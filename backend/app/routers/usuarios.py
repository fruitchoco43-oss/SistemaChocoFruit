"""Usuarios del panel (solo administradores)."""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app import models as m
from app import schemas as s
from app.crud import commit_o_409, obtener_o_404
from app.database import get_db
from app.eventos import broker
from app.security import hash_password, require_admin

router = APIRouter(prefix="/api/usuarios", tags=["usuarios"])
YA_EXISTE = "Ya existe un usuario con ese correo"


def _admins_activos(db: Session) -> int:
    return db.scalar(select(func.count()).where(m.Usuario.rol == m.Rol.admin, m.Usuario.activo.is_(True)))


@router.get("", response_model=list[s.UsuarioOut])
def listar(q: str | None = None, activo: bool | None = None, db: Session = Depends(get_db), _=Depends(require_admin)):
    stmt = select(m.Usuario)
    if q:
        patron = f"%{q.strip()}%"
        stmt = stmt.where(or_(m.Usuario.nombre.ilike(patron), m.Usuario.email.ilike(patron)))
    if activo is not None:
        stmt = stmt.where(m.Usuario.activo == activo)
    return db.scalars(stmt.order_by(m.Usuario.nombre)).all()


@router.post("", response_model=s.UsuarioOut, status_code=status.HTTP_201_CREATED)
def crear(datos: s.UsuarioCreate, db: Session = Depends(get_db), _=Depends(require_admin)):
    valores = datos.model_dump(exclude={"password"})
    valores["email"] = valores["email"].lower()
    user = m.Usuario(**valores, password_hash=hash_password(datos.password))
    db.add(user)
    commit_o_409(db, YA_EXISTE)
    db.refresh(user)
    broker.publicar("usuarios", "crear", user.id)
    return user


@router.patch("/{id_}", response_model=s.UsuarioOut)
def actualizar(id_: int, datos: s.UsuarioUpdate, db: Session = Depends(get_db), yo: m.Usuario = Depends(require_admin)):
    user = obtener_o_404(db, m.Usuario, id_)
    valores = datos.model_dump(exclude_unset=True)
    pierde_admin = (valores.get("rol", user.rol) != m.Rol.admin) or (valores.get("activo", user.activo) is False)
    if user.rol == m.Rol.admin and user.activo and pierde_admin and _admins_activos(db) <= 1:
        raise HTTPException(status.HTTP_409_CONFLICT, "Debe quedar al menos un administrador activo")
    if (password := valores.pop("password", None)) is not None:
        user.password_hash = hash_password(password)
    if "email" in valores and valores["email"]:
        valores["email"] = valores["email"].lower()
    for k, v in valores.items():
        setattr(user, k, v)
    commit_o_409(db, YA_EXISTE)
    db.refresh(user)
    broker.publicar("usuarios", "actualizar", user.id)
    return user


@router.delete("/{id_}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar(id_: int, db: Session = Depends(get_db), yo: m.Usuario = Depends(require_admin)):
    if id_ == yo.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "No puedes eliminar tu propio usuario")
    user = obtener_o_404(db, m.Usuario, id_)
    db.delete(user)
    db.commit()
    broker.publicar("usuarios", "eliminar", id_)
