"""Crea (o actualiza) el usuario administrador inicial.

Uso:  python -m scripts.crear_admin "Nombre" correo@dominio.com "contraseña"
"""

import sys

from sqlalchemy import select

from app.database import SessionLocal
from app.models import Rol, Usuario
from app.security import hash_password


def main() -> None:
    if len(sys.argv) != 4:
        sys.exit(__doc__)
    nombre, email, password = sys.argv[1], sys.argv[2].lower().strip(), sys.argv[3]
    with SessionLocal() as db:
        user = db.scalar(select(Usuario).where(Usuario.email == email))
        if user:
            user.nombre, user.password_hash, user.rol, user.activo = nombre, hash_password(password), Rol.admin, True
            print(f"Admin actualizado: {email}")
        else:
            db.add(Usuario(nombre=nombre, email=email, password_hash=hash_password(password), rol=Rol.admin))
            print(f"Admin creado: {email}")
        db.commit()


if __name__ == "__main__":
    main()
