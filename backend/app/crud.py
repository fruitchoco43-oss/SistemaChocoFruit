"""Fábrica de routers CRUD para las tablas simples del panel."""

import re
import unicodedata
from collections.abc import Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query, status
from pydantic import BaseModel
from sqlalchemy import or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database import get_db
from app.security import get_current_user


def slugify(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return re.sub(r"[^a-z0-9]+", "-", texto.lower()).strip("-") or "item"


def slug_unico(db: Session, model, base: str, excluir_id: int | None = None) -> str:
    slug, n = slugify(base), 2
    candidato = slug
    while True:
        q = select(model.id).where(model.slug == candidato)
        if excluir_id:
            q = q.where(model.id != excluir_id)
        if not db.scalar(q):
            return candidato
        candidato, n = f"{slug}-{n}", n + 1


def commit_o_409(db: Session, mensaje: str = "Ya existe un registro con esos datos") -> None:
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(status.HTTP_409_CONFLICT, mensaje)


def obtener_o_404(db: Session, model, id_: int):
    obj = db.get(model, id_)
    if not obj:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "No encontrado")
    return obj


def crud_router(
    *,
    model,
    create_schema: type[BaseModel],
    update_schema: type[BaseModel],
    out_schema: type[BaseModel],
    prefix: str,
    tag: str,
    search_fields: tuple[str, ...] = ("nombre",),
    order_by: tuple[str, ...] = ("nombre",),
    con_slug: bool = False,
    dependencia: Callable[..., Any] = get_current_user,
    validar: Callable[[Session, dict, Any | None], None] | None = None,
) -> APIRouter:
    """Genera GET (lista / detalle), POST, PATCH y DELETE para `model`.

    `validar(db, datos, obj_existente)` permite reglas extra (p. ej. claves foráneas).
    """
    router = APIRouter(prefix=prefix, tags=[tag], dependencies=[Depends(dependencia)])

    @router.get("", response_model=list[out_schema])
    def listar(
        q: str | None = Query(None, description="Búsqueda por texto"),
        activo: bool | None = None,
        db: Session = Depends(get_db),
    ):
        stmt = select(model)
        if q:
            patron = f"%{q.strip()}%"
            stmt = stmt.where(or_(*[getattr(model, f).ilike(patron) for f in search_fields]))
        if activo is not None and hasattr(model, "activo"):
            stmt = stmt.where(model.activo == activo)
        stmt = stmt.order_by(*[getattr(model, f) for f in order_by], model.id)
        return db.scalars(stmt).all()

    @router.get("/{id_}", response_model=out_schema)
    def detalle(id_: int, db: Session = Depends(get_db)):
        return obtener_o_404(db, model, id_)

    @router.post("", response_model=out_schema, status_code=status.HTTP_201_CREATED)
    def crear(datos: create_schema, db: Session = Depends(get_db)):  # type: ignore[valid-type]
        valores = datos.model_dump()
        if validar:
            validar(db, valores, None)
        obj = model(**valores)
        if con_slug:
            obj.slug = slug_unico(db, model, valores["nombre"])
        db.add(obj)
        commit_o_409(db)
        db.refresh(obj)
        return obj

    @router.patch("/{id_}", response_model=out_schema)
    def actualizar(id_: int, datos: update_schema, db: Session = Depends(get_db)):  # type: ignore[valid-type]
        obj = obtener_o_404(db, model, id_)
        valores = datos.model_dump(exclude_unset=True)
        if validar:
            validar(db, valores, obj)
        for k, v in valores.items():
            setattr(obj, k, v)
        if con_slug and "nombre" in valores:
            obj.slug = slug_unico(db, model, valores["nombre"], excluir_id=obj.id)
        commit_o_409(db)
        db.refresh(obj)
        return obj

    @router.delete("/{id_}", status_code=status.HTTP_204_NO_CONTENT)
    def eliminar(id_: int, db: Session = Depends(get_db)):
        obj = obtener_o_404(db, model, id_)
        db.delete(obj)
        commit_o_409(db, "No se puede eliminar: está siendo usado en otros registros. Desactívalo en su lugar.")

    return router
