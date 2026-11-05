from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.routers import auth, catalogo, dashboard, imagenes, inventario, pedidos, publico, usuarios

app = FastAPI(title="ChocoFruit API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
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
