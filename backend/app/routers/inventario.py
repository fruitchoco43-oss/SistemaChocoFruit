"""Materia prima: proveedores, insumos, compras y movimientos de inventario.

Reglas:
  - Una compra suma stock a cada insumo y recalcula su costo promedio ponderado.
  - Eliminar una compra revierte el stock (si alcanza) y borra sus movimientos.
  - Los consumos (salida) y ajustes se registran como movimientos.
"""

from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app import models as m
from app import schemas as s
from app.crud import crud_router, obtener_o_404
from app.database import get_db
from app.security import get_current_user

proveedores = crud_router(
    model=m.Proveedor, create_schema=s.ProveedorIn, update_schema=s.ProveedorUpdate,
    out_schema=s.ProveedorOut, prefix="/api/proveedores", tag="materia prima",
    search_fields=("nombre", "ruc", "telefono"),
)

insumos = crud_router(
    model=m.MateriaPrima, create_schema=s.MateriaPrimaIn, update_schema=s.MateriaPrimaUpdate,
    out_schema=s.MateriaPrimaOut, prefix="/api/insumos", tag="materia prima",
)

router = APIRouter(tags=["materia prima"], dependencies=[Depends(get_current_user)])

CUATRO = Decimal("0.0001")


def _compra_out(c: m.Compra) -> s.CompraOut:
    out = s.CompraOut.model_validate(c)
    out.proveedor_nombre = c.proveedor.nombre if c.proveedor else None
    for item_out, item in zip(out.items, c.items):
        item_out.materia_prima_nombre = item.materia_prima.nombre
        item_out.unidad = item.materia_prima.unidad
    return out


def _mov_out(mv: m.MovimientoInventario) -> s.MovimientoOut:
    out = s.MovimientoOut.model_validate(mv)
    out.materia_prima_nombre = mv.materia_prima.nombre
    out.unidad = mv.materia_prima.unidad
    return out


# ---------------------------------------------------------------- Compras


@router.get("/api/compras", response_model=list[s.CompraOut])
def listar_compras(
    proveedor_id: int | None = None,
    desde: date | None = None,
    hasta: date | None = None,
    db: Session = Depends(get_db),
):
    stmt = select(m.Compra).options(
        selectinload(m.Compra.items).selectinload(m.ItemCompra.materia_prima),
        selectinload(m.Compra.proveedor),
    )
    if proveedor_id:
        stmt = stmt.where(m.Compra.proveedor_id == proveedor_id)
    if desde:
        stmt = stmt.where(m.Compra.fecha >= desde)
    if hasta:
        stmt = stmt.where(m.Compra.fecha <= hasta)
    stmt = stmt.order_by(m.Compra.fecha.desc(), m.Compra.id.desc())
    return [_compra_out(c) for c in db.scalars(stmt).all()]


@router.get("/api/compras/{id_}", response_model=s.CompraOut)
def detalle_compra(id_: int, db: Session = Depends(get_db)):
    return _compra_out(obtener_o_404(db, m.Compra, id_))


@router.post("/api/compras", response_model=s.CompraOut, status_code=status.HTTP_201_CREATED)
def crear_compra(datos: s.CompraIn, db: Session = Depends(get_db), user: m.Usuario = Depends(get_current_user)):
    if datos.proveedor_id is not None and not db.get(m.Proveedor, datos.proveedor_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El proveedor no existe")

    compra = m.Compra(**datos.model_dump(exclude={"items"}), registrado_por_id=user.id)
    total = Decimal(0)
    for it in datos.items:
        insumo = db.get(m.MateriaPrima, it.materia_prima_id, with_for_update=True)
        if not insumo:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Insumo {it.materia_prima_id} no existe")
        # Costo promedio ponderado (solo sobre stock positivo)
        stock_previo = max(insumo.stock_actual, Decimal(0))
        nuevo_stock = stock_previo + it.cantidad
        insumo.costo_promedio = (
            (stock_previo * insumo.costo_promedio + it.cantidad * it.costo_unitario) / nuevo_stock
        ).quantize(CUATRO)
        insumo.stock_actual += it.cantidad
        compra.items.append(m.ItemCompra(**it.model_dump()))
        total += it.cantidad * it.costo_unitario
        db.add(m.MovimientoInventario(
            materia_prima_id=insumo.id, tipo=m.TipoMovimiento.entrada, cantidad=it.cantidad,
            costo_unitario=it.costo_unitario, motivo="Compra", compra=compra, usuario_id=user.id,
        ))
    compra.total = total.quantize(Decimal("0.01"))
    db.add(compra)
    db.commit()
    db.refresh(compra)
    return _compra_out(compra)


@router.delete("/api/compras/{id_}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_compra(id_: int, db: Session = Depends(get_db)):
    compra = obtener_o_404(db, m.Compra, id_)
    for it in compra.items:
        insumo = db.get(m.MateriaPrima, it.materia_prima_id, with_for_update=True)
        if insumo.stock_actual < it.cantidad:
            raise HTTPException(
                status.HTTP_409_CONFLICT,
                f"No se puede eliminar: ya se consumió parte de «{insumo.nombre}» de esta compra. "
                "Registra un ajuste de inventario en su lugar.",
            )
        insumo.stock_actual -= it.cantidad
    db.query(m.MovimientoInventario).filter(m.MovimientoInventario.compra_id == compra.id).delete()
    db.delete(compra)
    db.commit()


# ---------------------------------------------------------------- Movimientos


@router.get("/api/movimientos", response_model=list[s.MovimientoOut])
def listar_movimientos(
    materia_prima_id: int | None = None,
    tipo: m.TipoMovimiento | None = None,
    limite: int = Query(200, le=1000),
    db: Session = Depends(get_db),
):
    stmt = select(m.MovimientoInventario).options(selectinload(m.MovimientoInventario.materia_prima))
    if materia_prima_id:
        stmt = stmt.where(m.MovimientoInventario.materia_prima_id == materia_prima_id)
    if tipo:
        stmt = stmt.where(m.MovimientoInventario.tipo == tipo)
    stmt = stmt.order_by(m.MovimientoInventario.fecha.desc(), m.MovimientoInventario.id.desc()).limit(limite)
    return [_mov_out(mv) for mv in db.scalars(stmt).all()]


@router.post("/api/movimientos", response_model=s.MovimientoOut, status_code=status.HTTP_201_CREATED)
def crear_movimiento(datos: s.MovimientoIn, db: Session = Depends(get_db), user: m.Usuario = Depends(get_current_user)):
    if datos.tipo == m.TipoMovimiento.entrada:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Las entradas se registran como compras")
    if datos.cantidad == 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "La cantidad no puede ser 0")
    if datos.tipo == m.TipoMovimiento.salida and datos.cantidad < 0:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "La salida debe ser una cantidad positiva")
    if datos.pedido_id is not None and not db.get(m.Pedido, datos.pedido_id):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El pedido no existe")

    insumo = db.get(m.MateriaPrima, datos.materia_prima_id, with_for_update=True)
    if not insumo:
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "El insumo no existe")

    delta = -datos.cantidad if datos.tipo == m.TipoMovimiento.salida else datos.cantidad
    if insumo.stock_actual + delta < 0:
        raise HTTPException(
            status.HTTP_409_CONFLICT,
            f"Stock insuficiente de «{insumo.nombre}»: hay {insumo.stock_actual.normalize()} {insumo.unidad}",
        )
    insumo.stock_actual += delta
    mv = m.MovimientoInventario(
        **datos.model_dump(), costo_unitario=insumo.costo_promedio, usuario_id=user.id,
    )
    db.add(mv)
    db.commit()
    db.refresh(mv)
    return _mov_out(mv)
