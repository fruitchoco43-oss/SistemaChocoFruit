# Sistema ChocoFruit

Landing + catálogo con precios + personalizador que envía el pedido por WhatsApp,
chatbot de reglas (sin costo) y panel administrativo (pedidos, inventario y finanzas de materia prima).

| Carpeta     | Tecnología                          | Despliegue |
|-------------|-------------------------------------|------------|
| `frontend/` | Next.js 15 + Tailwind               | Vercel     |
| `backend/`  | FastAPI + SQLAlchemy + Alembic      | Railway    |
| BD          | PostgreSQL 16                       | Railway (local: Docker, puerto 5433) |

## Desarrollo local

```bash
# 1. Base de datos (requiere Docker Desktop abierto)
docker compose up -d

# 2. Backend  -> http://localhost:8000/docs
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
python -m scripts.crear_admin "Nombre" correo@dominio.com "contraseña"
uvicorn app.main:app --reload

# 3. Frontend -> http://localhost:3000
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Cambios en `backend/app/models.py` → `alembic revision --autogenerate -m "descripcion"` y `alembic upgrade head`.

## Despliegue

**Railway (backend + BD)** — se configura desde la UI (Config-as-code está deprecado)
1. Nuevo proyecto → *Deploy from GitHub repo* → `SistemaChocoFruit`.
2. Agregar servicio **PostgreSQL** en el mismo proyecto.
3. Settings del servicio backend:
   - Root Directory: `/backend`
   - Pre-deploy step: `alembic upgrade head`
   - Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Healthcheck Path: `/api/health`
   - Watch Paths: `/backend/**`
4. Variables del servicio backend:
   - `DATABASE_URL` = `${{Postgres.DATABASE_URL}}`
   - `JWT_SECRET` = valor largo aleatorio
   - `CORS_ORIGINS` = URL de Vercel (ej. `https://chocofruit.vercel.app`)
5. Networking → Generate Domain.
6. Crear el admin una vez (Shell del servicio): `python -m scripts.crear_admin "Nombre" correo "clave"`

**Vercel (frontend)**
1. *Import Git Repository* → Root Directory: `frontend`.
2. Variable: `NEXT_PUBLIC_API_URL` = dominio público del backend en Railway.
