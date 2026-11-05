"""Subida y entrega de imágenes del catálogo."""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, Response, UploadFile, status
from sqlalchemy.orm import Session

from app import models as m
from app.database import get_db
from app.security import get_current_user

router = APIRouter(prefix="/api/imagenes", tags=["imágenes"])

MAX_BYTES = 3 * 1024 * 1024  # el navegador ya las comprime; esto es un tope de seguridad
FIRMAS = {
    "image/jpeg": (b"\xff\xd8\xff",),
    "image/png": (b"\x89PNG\r\n\x1a\n",),
    "image/webp": (b"RIFF",),  # + "WEBP" en el byte 8
}


def _tipo_real(datos: bytes) -> str | None:
    """Detecta el formato por los bytes del archivo, no por lo que dice el navegador."""
    for tipo, firmas in FIRMAS.items():
        if any(datos.startswith(f) for f in firmas):
            if tipo == "image/webp" and datos[8:12] != b"WEBP":
                continue
            return tipo
    return None


@router.post("", status_code=status.HTTP_201_CREATED)
async def subir(archivo: UploadFile = File(...), db: Session = Depends(get_db), _=Depends(get_current_user)):
    datos = await archivo.read(MAX_BYTES + 1)
    if len(datos) > MAX_BYTES:
        raise HTTPException(status.HTTP_413_CONTENT_TOO_LARGE, "La imagen pesa más de 3 MB")
    tipo = _tipo_real(datos)
    if not tipo:
        raise HTTPException(status.HTTP_415_UNSUPPORTED_MEDIA_TYPE, "Formato no permitido. Usa JPG, PNG o WebP.")
    img = m.Imagen(
        id=uuid.uuid4().hex, content_type=tipo, datos=datos, tamano=len(datos),
        nombre_original=(archivo.filename or "")[:200] or None,
    )
    db.add(img)
    db.commit()
    return {"id": img.id, "url": f"/api/imagenes/{img.id}", "tamano": img.tamano}


@router.get("/{id_}")
def ver(id_: str, db: Session = Depends(get_db)):
    img = db.get(m.Imagen, id_) if len(id_) == 32 else None
    if not img:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Imagen no encontrada")
    # El contenido de un id nunca cambia: se puede cachear para siempre.
    return Response(
        content=img.datos,
        media_type=img.content_type,
        headers={"Cache-Control": "public, max-age=31536000, immutable", "X-Content-Type-Options": "nosniff"},
    )
