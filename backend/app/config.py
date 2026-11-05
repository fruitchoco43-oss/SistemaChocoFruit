from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str = "postgresql+psycopg://chocofruit:chocofruit@localhost:5433/chocofruit"
    jwt_secret: str = "cambiar-en-produccion"
    jwt_expire_minutes: int = 60 * 12
    # Orígenes permitidos separados por coma (ej. https://chocofruit.vercel.app)
    cors_origins: str = "http://localhost:3000"

    @field_validator("database_url")
    @classmethod
    def usar_driver_psycopg(cls, v: str) -> str:
        # Railway entrega "postgresql://..." o "postgres://..."; SQLAlchemy necesita el driver explícito.
        if v.startswith("postgres://"):
            v = "postgresql://" + v[len("postgres://"):]
        if v.startswith("postgresql://"):
            v = "postgresql+psycopg://" + v[len("postgresql://"):]
        return v

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


settings = Settings()
