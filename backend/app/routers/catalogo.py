"""CRUD del catálogo público, chatbot y datos del negocio."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app import schemas as s
from app.crud import crud_router
from app.database import get_db
from app.security import get_current_user


def _existe(db: Session, model, id_: int | None, nombre: str) -> None:
    if id_ is not None and not db.get(model, id_):
        raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, f"{nombre} no existe")


def validar_producto(db: Session, datos: dict, _obj) -> None:
    _existe(db, m.Categoria, datos.get("categoria_id"), "La categoría")


def validar_nodo(db: Session, datos: dict, obj) -> None:
    padre_id = datos.get("padre_id")
    if padre_id is None:
        return
    _existe(db, m.ChatbotNodo, padre_id, "La opción padre")
    if obj is None:
        return
    # Evitar ciclos: el padre no puede ser el mismo nodo ni uno de sus descendientes.
    actual = padre_id
    while actual is not None:
        if actual == obj.id:
            raise HTTPException(status.HTTP_422_UNPROCESSABLE_CONTENT, "Una opción no puede estar dentro de sí misma")
        actual = db.scalar(select(m.ChatbotNodo.padre_id).where(m.ChatbotNodo.id == actual))


routers = [
    crud_router(
        model=m.Categoria, create_schema=s.CategoriaIn, update_schema=s.CategoriaUpdate,
        out_schema=s.CategoriaOut, prefix="/api/categorias", tag="catálogo",
        order_by=("orden", "nombre"), con_slug=True,
    ),
    crud_router(
        model=m.Producto, create_schema=s.ProductoIn, update_schema=s.ProductoUpdate,
        out_schema=s.ProductoOut, prefix="/api/productos", tag="catálogo",
        search_fields=("nombre", "descripcion"), con_slug=True, validar=validar_producto,
    ),
    crud_router(
        model=m.Complemento, create_schema=s.ComplementoIn, update_schema=s.ComplementoUpdate,
        out_schema=s.ComplementoOut, prefix="/api/complementos", tag="catálogo",
    ),
    crud_router(
        model=m.ItemGaleria, create_schema=s.GaleriaIn, update_schema=s.GaleriaUpdate,
        out_schema=s.GaleriaOut, prefix="/api/galeria", tag="catálogo",
        search_fields=("titulo", "descripcion"), order_by=("orden",),
    ),
    crud_router(
        model=m.ZonaEntrega, create_schema=s.ZonaIn, update_schema=s.ZonaUpdate,
        out_schema=s.ZonaOut, prefix="/api/zonas", tag="catálogo",
    ),
    crud_router(
        model=m.MaquinaAlquiler, create_schema=s.MaquinaIn, update_schema=s.MaquinaUpdate,
        out_schema=s.MaquinaOut, prefix="/api/maquinas", tag="catálogo",
        search_fields=("nombre", "descripcion"),
    ),
    crud_router(
        model=m.ChatbotNodo, create_schema=s.ChatbotNodoIn, update_schema=s.ChatbotNodoUpdate,
        out_schema=s.ChatbotNodoOut, prefix="/api/chatbot", tag="chatbot",
        search_fields=("etiqueta", "respuesta"), order_by=("orden", "etiqueta"), validar=validar_nodo,
    ),
]


# ---- Datos del negocio (fila única)

negocio = APIRouter(prefix="/api/negocio", tags=["negocio"], dependencies=[Depends(get_current_user)])


@negocio.get("", response_model=s.InfoNegocioOut | None)
def obtener_negocio(db: Session = Depends(get_db)):
    return db.scalar(select(m.InfoNegocio).limit(1))


@negocio.put("", response_model=s.InfoNegocioOut)
def guardar_negocio(datos: s.InfoNegocioIn, db: Session = Depends(get_db)):
    info = db.scalar(select(m.InfoNegocio).limit(1))
    if info is None:
        info = m.InfoNegocio(**datos.model_dump())
        db.add(info)
    else:
        for k, v in datos.model_dump().items():
            setattr(info, k, v)
    db.commit()
    db.refresh(info)
    return info
