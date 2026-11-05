"""Endpoints SSE. EventSource no permite enviar headers, por eso el token va en la URL."""

import jwt
from fastapi import APIRouter, HTTPException, Query, Request, status
from fastapi.responses import StreamingResponse

from app.config import settings
from app.database import SessionLocal
from app.eventos import broker, flujo
from app.models import Usuario

router = APIRouter(tags=["tiempo real"])

CABECERAS = {"Cache-Control": "no-cache", "X-Accel-Buffering": "no", "Connection": "keep-alive"}


def _validar_token(token: str) -> None:
    error = HTTPException(status.HTTP_401_UNAUTHORIZED, "Sesión inválida")
    try:
        user_id = int(jwt.decode(token, settings.jwt_secret, algorithms=["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise error
    with SessionLocal() as db:
        user = db.get(Usuario, user_id)
        if not user or not user.activo:
            raise error


@router.get("/api/eventos")
async def eventos_panel(request: Request, token: str = Query(...)):
    _validar_token(token)
    s = broker.suscribir(publico=False)
    return StreamingResponse(flujo(s, request.is_disconnected), media_type="text/event-stream", headers=CABECERAS)


@router.get("/api/publico/eventos")
async def eventos_publicos(request: Request):
    s = broker.suscribir(publico=True)
    return StreamingResponse(flujo(s, request.is_disconnected), media_type="text/event-stream", headers=CABECERAS)
