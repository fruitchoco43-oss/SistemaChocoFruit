import asyncio
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.eventos import broker, cliente_actual
from app.routers import auth, catalogo, dashboard, imagenes, inventario, pedidos, publico, usuarios, vivo


@asynccontextmanager
async def lifespan(_app: FastAPI):
    broker.iniciar(asyncio.get_running_loop())
    yield


app = FastAPI(title="ChocoFruit Daferson API", version="0.3.0", lifespan=lifespan)


class ClienteIdMiddleware:
    """Guarda el header X-Cliente-Id en un contextvar (middleware ASGI puro: no rompe el streaming SSE)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        valor = next((v.decode()[:64] for k, v in scope.get("headers", []) if k == b"x-cliente-id"), None)
        token = cliente_actual.set(valor)
        try:
            await self.app(scope, receive, send)
        finally:
            cliente_actual.reset(token)


app.add_middleware(ClienteIdMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(vivo.router)
app.include_router(publico.router)
app.include_router(dashboard.router)
for r in catalogo.routers:
    app.include_router(r)
app.include_router(catalogo.negocio)
app.include_router(pedidos.router)
app.include_router(inventario.proveedores)
app.include_router(inventario.insumos)
app.include_router(inventario.router)
app.include_router(usuarios.router)
app.include_router(imagenes.router)


@app.get("/api/health", tags=["sistema"])
def health(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"status": "ok", "db": "ok"}
