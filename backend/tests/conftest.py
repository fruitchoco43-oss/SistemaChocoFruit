"""Las pruebas usan una BD aparte (chocofruit_test) en el Postgres de docker compose.

Crear una vez:  docker exec chocofruit-db createdb -U chocofruit chocofruit_test
Correr:         pytest
"""

import os

os.environ["JWT_SECRET"] = "clave-de-pruebas-suficientemente-larga-para-hs256"

os.environ["DATABASE_URL"] = os.environ.get(
    "TEST_DATABASE_URL", "postgresql+psycopg://chocofruit:chocofruit@localhost:5433/chocofruit_test"
)

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app import models as m  # noqa: E402
from app.database import Base, SessionLocal, engine  # noqa: E402
from app.main import app  # noqa: E402
from app.security import hash_password  # noqa: E402


@pytest.fixture(autouse=True)
def bd_limpia():
    Base.metadata.drop_all(engine)
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        db.add_all([
            m.Usuario(nombre="Admin", email="admin@test.com", password_hash=hash_password("admin12345"), rol=m.Rol.admin),
            m.Usuario(nombre="Emp", email="emp@test.com", password_hash=hash_password("emp12345"), rol=m.Rol.empleado),
        ])
        db.commit()
    yield


def _cliente(email: str, password: str) -> TestClient:
    c = TestClient(app)
    token = c.post("/api/auth/login", data={"username": email, "password": password}).json()["access_token"]
    c.headers["Authorization"] = f"Bearer {token}"
    return c


@pytest.fixture
def admin() -> TestClient:
    return _cliente("admin@test.com", "admin12345")


@pytest.fixture
def empleado() -> TestClient:
    return _cliente("emp@test.com", "emp12345")
