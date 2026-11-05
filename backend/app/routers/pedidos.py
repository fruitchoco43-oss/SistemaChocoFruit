"""Pedidos registrados por el personal (llegan por WhatsApp)."""

from datetime import date, datetime, time, timedelta
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app import models as m
from app import schemas as s
from app.config import TZ_LOCAL
from app.crud import obtener_o_404
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/api/pedidos", tags=["pedidos"])

DOS = Decimal("0.01")


def _estado_pago(total: Decimal, pagado: Decimal) -> m.EstadoPago:
    if pagado <= 0:
        return m.EstadoPago.pendiente
    return m.EstadoPago.pagado if pagado >= total else m.EstadoPago.abonado


def _salida(p: m.Pedido) -> s.PedidoOut:
    out = s.PedidoOut.model_validate(p)
    out.zona_nombre = p.zona.nombre if p.zona else None
    return out


def _aplicar(db: Session, pedido: m.Pedido, datos: s.PedidoIn) -> None:
    zona = None
    if datos.zona_id is not None:
        zona = db.get(m.ZonaEntrega, datos.zona_id)
        if not zona:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "La zona no existe")
    for it in datos.items:
        if it.producto_id is not None and not db.get(m.Producto, it.producto_id):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Producto {it.producto_id} no existe")
        if it.maquina_id is not None and not db.get(m.MaquinaAlquiler, it.maquina_id):
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"Máquina {it.maquina_id} no existe")

    campos = datos.model_dump(exclude={"items", "costo_envio"})
    for k, v in campos.items():
        setattr(pedido, k, v)

    costo_envio = datos.costo_envio if datos.costo_envio is not None else (zona.costo_envio if zona else Decimal(0))
    subtotal = sum((it.precio_unitario * it.cantidad for it in datos.items), Decimal(0))
    pedido.costo_envio = costo_envio.quantize(DOS)
    pedido.subtotal = subtotal.quantize(DOS)
    pedido.total = (subtotal + costo_envio).quantize(DOS)
    pedido.estado_pago = _estado_pago(pedido.total, datos.monto_pagado)
    pedido.items = [m.ItemPedido(**it.model_dump()) for it in datos.items]


@router.get("", response_model=list[s.PedidoOut])
def listar(
    q: str | None = Query(None, description="Nombre o teléfono del cliente"),
    estado: m.EstadoPedido | None = None,
    desde: date | None = Query(None, description="Fecha de entrega desde"),
    hasta: date | None = Query(None, description="Fecha de entrega hasta"),
    db: Session = Depends(get_db),
    _=Depends(get_current_user),
):
    stmt = select(m.Pedido).options(selectinload(m.Pedido.items), selectinload(m.Pedido.zona))
    if q:
        patron = f"%{q.strip()}%"
        filtros = [m.Pedido.cliente_nombre.ilike(patron), m.Pedido.cliente_telefono.ilike(patron)]
        if q.strip().lstrip("#").isdigit():
            filtros.append(m.Pedido.id == int(q.strip().lstrip("#")))
        stmt = stmt.where(or_(*filtros))
    if estado:
        stmt = stmt.where(m.Pedido.estado == estado)
    if desde:
        stmt = stmt.where(m.Pedido.fecha_entrega >= datetime.combine(desde, time.min, TZ_LOCAL))
    if hasta:
        stmt = stmt.where(m.Pedido.fecha_entrega < datetime.combine(hasta + timedelta(days=1), time.min, TZ_LOCAL))
    stmt = stmt.order_by(m.Pedido.creado_en.desc())
    return [_salida(p) for p in db.scalars(stmt).all()]


@router.get("/{id_}", response_model=s.PedidoOut)
def detalle(id_: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    return _salida(obtener_o_404(db, m.Pedido, id_))


@router.post("", response_model=s.PedidoOut, status_code=status.HTTP_201_CREATED)
def crear(datos: s.PedidoIn, db: Session = Depends(get_db), user: m.Usuario = Depends(get_current_user)):
    pedido = m.Pedido(creado_por_id=user.id)
    _aplicar(db, pedido, datos)
    db.add(pedido)
    db.commit()
    db.refresh(pedido)
    return _salida(pedido)


@router.put("/{id_}", response_model=s.PedidoOut)
def actualizar(id_: int, datos: s.PedidoIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    pedido = obtener_o_404(db, m.Pedido, id_)
    _aplicar(db, pedido, datos)
    db.commit()
    db.refresh(pedido)
    return _salida(pedido)


@router.patch("/{id_}/estado", response_model=s.PedidoOut)
def cambiar_estado(id_: int, datos: s.PedidoEstadoIn, db: Session = Depends(get_db), _=Depends(get_current_user)):
    """Cambio rápido de estado y/o pago desde la lista."""
    pedido = obtener_o_404(db, m.Pedido, id_)
    if datos.estado is not None:
        pedido.estado = datos.estado
    if datos.monto_pagado is not None:
        pedido.monto_pagado = datos.monto_pagado
        pedido.estado_pago = _estado_pago(pedido.total, datos.monto_pagado)
    db.commit()
    db.refresh(pedido)
    return _salida(pedido)


@router.delete("/{id_}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_: int, db: Session = Depends(get_db), _=Depends(get_current_user)):
    db.delete(obtener_o_404(db, m.Pedido, id_))
    db.commit()
