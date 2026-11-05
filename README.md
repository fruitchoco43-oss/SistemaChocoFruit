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

## Panel administrativo

`/admin` (login con usuarios creados por `scripts.crear_admin` o desde *Usuarios*).

| Sección | Qué hace |
|---|---|
| Resumen | Ventas, cobrado, por cobrar, gasto en materia prima, utilidad bruta, próximas entregas, insumos bajo mínimo, más vendidos |
| Pedidos | Registro de pedidos de WhatsApp con personalización, envío por zona, abonos, cambio rápido de estado y resumen para enviar al cliente |
| Catálogo | Productos, categorías, complementos, alquiler de máquinas, galería, zonas de entrega |
| Materia prima | Insumos (stock y costo promedio), compras (suman stock), movimientos (salidas/ajustes), proveedores |
| Ajustes | Chatbot de reglas (árbol de opciones + vista previa), datos del negocio, usuarios (solo admin) |

Reglas de negocio en el backend: totales y estado de pago del pedido se calculan en el servidor; una compra suma stock y recalcula el costo promedio ponderado; no se puede sacar más stock del que hay ni borrar una compra ya consumida.

## Tiempo real (sin F5)

- El backend publica un evento en cada alta/edición/baja (`app/eventos.py`) y lo envía por **Server-Sent Events**:
  - `/api/eventos?token=…` → panel (con sesión): cada pantalla se recarga sola, aviso de pedido nuevo e indicador "En vivo".
  - `/api/publico/eventos` → web pública: solo recibe "catálogo cambió" y refresca los datos sin recargar la página.
- Al volver a una pestaña o tras una reconexión, se sincroniza todo.
- El broker vive en memoria: válido con **1 réplica** en Railway (plan actual). Con más réplicas, migrar a PostgreSQL `LISTEN/NOTIFY`.

## Pruebas (backend)

```bash
docker exec chocofruit-db createdb -U chocofruit chocofruit_test   # una sola vez
cd backend
pip install -r requirements-dev.txt
pytest
```

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
