"""Resumen para la pantalla principal del panel."""

from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app import models as m
from app import schemas as s
from app.config import TZ_LOCAL
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(get_current_user)])


@router.get("")
def resumen(
    desde: date | None = Query(None, description="Por defecto: inicio del mes actual"),
    hasta: date | None = Query(None, description="Por defecto: hoy"),
    db: Session = Depends(get_db),
):
    hoy = datetime.now(TZ_LOCAL).date()
    desde = desde or hoy.replace(day=1)
    hasta = hasta or hoy
    ini = datetime.combine(desde, time.min, TZ_LOCAL)
    fin = datetime.combine(hasta + timedelta(days=1), time.min, TZ_LOCAL)

    validos = (m.Pedido.creado_en >= ini, m.Pedido.creado_en < fin, m.Pedido.estado != m.EstadoPedido.cancelado)
    ventas, cobrado, n_pedidos = db.execute(
        select(
            func.coalesce(func.sum(m.Pedido.total), 0),
            func.coalesce(func.sum(m.Pedido.monto_pagado), 0),
            func.count(m.Pedido.id),
        ).where(*validos)
    ).one()

    gastos = db.scalar(
        select(func.coalesce(func.sum(m.Compra.total), 0)).where(m.Compra.fecha >= desde, m.Compra.fecha <= hasta)
    )

    por_estado = dict(
        db.execute(
            select(m.Pedido.estado, func.count())
            .where(m.Pedido.creado_en >= ini, m.Pedido.creado_en < fin)
            .group_by(m.Pedido.estado)
        ).all()
    )

    top = db.execute(
        select(m.ItemPedido.descripcion, func.sum(m.ItemPedido.cantidad).label("cant"),
               func.sum(m.ItemPedido.cantidad * m.ItemPedido.precio_unitario).label("monto"))
        .join(m.Pedido)
        .where(*validos)
        .group_by(m.ItemPedido.descripcion)
        .order_by(func.sum(m.ItemPedido.cantidad).desc())
        .limit(5)
    ).all()

    bajo_stock = db.scalars(
        select(m.MateriaPrima)
        .where(m.MateriaPrima.activo.is_(True), m.MateriaPrima.stock_actual <= m.MateriaPrima.stock_minimo)
        .order_by(m.MateriaPrima.nombre)
    ).all()

    ahora = datetime.now(TZ_LOCAL)
    proximas = db.scalars(
        select(m.Pedido)
        .options(selectinload(m.Pedido.items), selectinload(m.Pedido.zona))
        .where(
            m.Pedido.fecha_entrega >= datetime.combine(ahora.date(), time.min, TZ_LOCAL),
            m.Pedido.fecha_entrega < ahora + timedelta(days=7),
            m.Pedido.estado.notin_([m.EstadoPedido.entregado, m.EstadoPedido.cancelado]),
        )
        .order_by(m.Pedido.fecha_entrega)
        .limit(10)
    ).all()

    por_cobrar = db.scalar(
        select(func.coalesce(func.sum(m.Pedido.total - m.Pedido.monto_pagado), 0)).where(
            m.Pedido.estado != m.EstadoPedido.cancelado, m.Pedido.estado_pago != m.EstadoPago.pagado
        )
    )

    return {
        "desde": desde,
        "hasta": hasta,
        "ventas": float(ventas),
        "cobrado": float(cobrado),
        "por_cobrar": float(por_cobrar),
        "gastos_materia_prima": float(gastos),
        "utilidad_bruta": float(ventas - gastos),
        "pedidos": n_pedidos,
        "pedidos_por_estado": {e.value: por_estado.get(e, 0) for e in m.EstadoPedido},
        "top_productos": [{"descripcion": d, "cantidad": int(c), "monto": float(mo)} for d, c, mo in top],
        "insumos_bajo_stock": [s.MateriaPrimaOut.model_validate(i).model_dump(mode="json") for i in bajo_stock],
        "proximas_entregas": [
            {
                "id": p.id, "cliente_nombre": p.cliente_nombre, "cliente_telefono": p.cliente_telefono,
                "fecha_entrega": p.fecha_entrega, "estado": p.estado, "estado_pago": p.estado_pago,
                "total": float(p.total), "zona_nombre": p.zona.nombre if p.zona else None,
                "items": [f"{i.cantidad}× {i.descripcion}" for i in p.items],
            }
            for p in proximas
        ],
    }
