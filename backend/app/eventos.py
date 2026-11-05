"""Canal de eventos en tiempo real (Server-Sent Events).

Cada cambio (crear/actualizar/eliminar) se publica aquí y se reenvía a los
navegadores conectados:
  - /api/eventos           -> panel (requiere sesión), recibe todo.
  - /api/publico/eventos   -> página pública, solo recibe "catalogo".

El broker vive en memoria del proceso: funciona con 1 réplica (plan actual de
Railway). Con varias réplicas habría que pasar a PostgreSQL LISTEN/NOTIFY.
"""

import asyncio
import json
from collections import deque
from contextvars import ContextVar
from dataclasses import dataclass, field

# Id de la pestaña que originó la petición (header X-Cliente-Id), para que el
# frontend no se muestre a sí mismo avisos de lo que acaba de hacer.
cliente_actual: ContextVar[str | None] = ContextVar("cliente_actual", default=None)

# Entidades cuyo cambio afecta a la página pública.
CANALES_PUBLICOS = {"categorias", "productos", "complementos", "galeria", "zonas", "maquinas", "chatbot", "negocio"}


@dataclass(eq=False)
class Suscriptor:
    cola: asyncio.Queue
    publico: bool


@dataclass
class Broker:
    suscriptores: set[Suscriptor] = field(default_factory=set)
    loop: asyncio.AbstractEventLoop | None = None
    historial: deque = field(default_factory=lambda: deque(maxlen=50))  # útil para pruebas y depuración

    def iniciar(self, loop: asyncio.AbstractEventLoop) -> None:
        self.loop = loop

    def suscribir(self, publico: bool) -> Suscriptor:
        s = Suscriptor(asyncio.Queue(maxsize=200), publico)
        self.suscriptores.add(s)
        return s

    def desuscribir(self, s: Suscriptor) -> None:
        self.suscriptores.discard(s)

    def publicar(self, canal: str, accion: str, id_: int | str | None = None, **datos) -> None:
        """Se puede llamar desde endpoints síncronos (threadpool): reenvía al event loop."""
        evento = {"canal": canal, "accion": accion, "id": id_, "origen": cliente_actual.get(), **datos}
        self.historial.append(evento)
        if self.loop is None or self.loop.is_closed():
            return
        es_publico = canal in CANALES_PUBLICOS
        for s in list(self.suscriptores):
            if s.publico:
                if es_publico:
                    self.loop.call_soon_threadsafe(_poner, s.cola, {"canal": "catalogo"})
            else:
                self.loop.call_soon_threadsafe(_poner, s.cola, evento)


def _poner(cola: asyncio.Queue, evento: dict) -> None:
    try:
        cola.put_nowait(evento)
    except asyncio.QueueFull:
        pass  # cliente demasiado lento: pierde eventos, pero al reconectar recarga todo


broker = Broker()

LATIDO_SEG = 15  # mantiene viva la conexión a través del proxy de Railway


async def flujo(s: Suscriptor, desconectado):
    """Generador SSE: envía eventos y un comentario de latido periódico."""
    try:
        yield "retry: 3000\n\n"
        while True:
            if await desconectado():
                break
            try:
                evento = await asyncio.wait_for(s.cola.get(), timeout=LATIDO_SEG)
                yield f"data: {json.dumps(evento, default=str)}\n\n"
            except asyncio.TimeoutError:
                yield ": latido\n\n"
    finally:
        broker.desuscribir(s)
