"""Endpoints públicos (sin login) que consumirá la landing y el chatbot."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app import models as m
from app import schemas as s
from app.database import get_db

router = APIRouter(prefix="/api/publico", tags=["público"])


def _activos(db: Session, model, *orden):
    return db.scalars(select(model).where(model.activo.is_(True)).order_by(*orden, model.id)).all()


@router.get("/catalogo")
def catalogo(db: Session = Depends(get_db)):
    return {
        "negocio": s.InfoNegocioOut.model_validate(info).model_dump(mode="json")
        if (info := db.scalar(select(m.InfoNegocio).limit(1)))
        else None,
        "categorias": [s.CategoriaOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.Categoria, m.Categoria.orden)],
        "productos": [s.ProductoOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.Producto, m.Producto.nombre)],
        "complementos": [s.ComplementoOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.Complemento, m.Complemento.nombre)],
        "zonas": [s.ZonaOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.ZonaEntrega, m.ZonaEntrega.nombre)],
        "maquinas": [s.MaquinaOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.MaquinaAlquiler, m.MaquinaAlquiler.nombre)],
        "galeria": [s.GaleriaOut.model_validate(x).model_dump(mode="json") for x in _activos(db, m.ItemGaleria, m.ItemGaleria.orden)],
    }


@router.get("/productos/{slug}", response_model=s.ProductoOut)
def producto(slug: str, db: Session = Depends(get_db)):
    p = db.scalar(select(m.Producto).where(m.Producto.slug == slug, m.Producto.activo.is_(True)))
    if not p:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Producto no encontrado")
    return p


@router.get("/chatbot", response_model=list[s.ChatbotNodoOut])
def chatbot(db: Session = Depends(get_db)):
    """Todos los nodos activos; el widget arma el árbol con `padre_id`."""
    return _activos(db, m.ChatbotNodo, m.ChatbotNodo.orden)
