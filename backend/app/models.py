"""Modelo de datos de ChocoFruit.

Bloques:
  - Usuarios del panel
  - Catálogo público (categorías, productos, complementos, galería, zonas, alquiler)
  - Pedidos (registrados por el personal desde el panel; llegan por WhatsApp)
  - Materia prima (insumos, proveedores, compras, movimientos de inventario)
  - Chatbot de reglas (menú de preguntas frecuentes)
"""

import enum
from datetime import date, datetime
from decimal import Decimal

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Integer,
    LargeBinary,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

Dinero = Numeric(10, 2)
Cantidad = Numeric(12, 3)


class TimestampMixin:
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    actualizado_en: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )


# ---------------------------------------------------------------- Usuarios


class Rol(str, enum.Enum):
    admin = "admin"
    empleado = "empleado"


class Usuario(TimestampMixin, Base):
    __tablename__ = "usuarios"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(160), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(200))
    rol: Mapped[Rol] = mapped_column(Enum(Rol, name="rol"), default=Rol.empleado)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


# ---------------------------------------------------------------- Catálogo


class Categoria(TimestampMixin, Base):
    __tablename__ = "categorias"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(80), unique=True)
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    productos: Mapped[list["Producto"]] = relationship(back_populates="categoria")


class Producto(TimestampMixin, Base):
    __tablename__ = "productos"

    id: Mapped[int] = mapped_column(primary_key=True)
    categoria_id: Mapped[int | None] = mapped_column(ForeignKey("categorias.id", ondelete="SET NULL"))
    nombre: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140), unique=True, index=True)
    descripcion: Mapped[str | None] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Dinero)
    imagenes: Mapped[list[str]] = mapped_column(JSON, default=list)  # URLs (Cloudinary)
    personalizable: Mapped[bool] = mapped_column(Boolean, default=False)
    colores_disponibles: Mapped[list[str]] = mapped_column(JSON, default=list)
    destacado: Mapped[bool] = mapped_column(Boolean, default=False)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    categoria: Mapped[Categoria | None] = relationship(back_populates="productos")


class Complemento(TimestampMixin, Base):
    """Extras del personalizador: globos, tarjeta, peluche, etc."""

    __tablename__ = "complementos"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    precio: Mapped[Decimal] = mapped_column(Dinero)
    imagen: Mapped[str | None] = mapped_column(String(500))
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class ItemGaleria(TimestampMixin, Base):
    __tablename__ = "galeria"

    id: Mapped[int] = mapped_column(primary_key=True)
    imagen: Mapped[str] = mapped_column(String(500))
    titulo: Mapped[str | None] = mapped_column(String(120))
    descripcion: Mapped[str | None] = mapped_column(Text)
    orden: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class ZonaEntrega(TimestampMixin, Base):
    __tablename__ = "zonas_entrega"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(100))
    costo_envio: Mapped[Decimal] = mapped_column(Dinero)
    descripcion: Mapped[str | None] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class MaquinaAlquiler(TimestampMixin, Base):
    __tablename__ = "maquinas_alquiler"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120))
    descripcion: Mapped[str | None] = mapped_column(Text)
    precio: Mapped[Decimal] = mapped_column(Dinero)
    duracion_horas: Mapped[int] = mapped_column(Integer)
    condiciones: Mapped[str | None] = mapped_column(Text)
    imagenes: Mapped[list[str]] = mapped_column(JSON, default=list)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class InfoNegocio(TimestampMixin, Base):
    """Fila única con datos editables: WhatsApp, cuentas bancarias, horarios, textos del inicio."""

    __tablename__ = "info_negocio"

    id: Mapped[int] = mapped_column(primary_key=True)
    whatsapp: Mapped[str] = mapped_column(String(20))  # formato internacional, ej. 593991234567
    datos_transferencia: Mapped[str | None] = mapped_column(Text)
    horario: Mapped[str | None] = mapped_column(String(200))
    direccion: Mapped[str | None] = mapped_column(String(250))
    instagram: Mapped[str | None] = mapped_column(String(200))
    facebook: Mapped[str | None] = mapped_column(String(200))
    tiktok: Mapped[str | None] = mapped_column(String(200))
    texto_inicio: Mapped[str | None] = mapped_column(Text)


# ---------------------------------------------------------------- Pedidos


class TipoPedido(str, enum.Enum):
    producto = "producto"
    alquiler = "alquiler"


class EstadoPedido(str, enum.Enum):
    pendiente = "pendiente"
    confirmado = "confirmado"
    en_preparacion = "en_preparacion"
    entregado = "entregado"
    cancelado = "cancelado"


class EstadoPago(str, enum.Enum):
    pendiente = "pendiente"
    abonado = "abonado"
    pagado = "pagado"


class MetodoPago(str, enum.Enum):
    transferencia = "transferencia"
    efectivo = "efectivo"
    tarjeta = "tarjeta"  # cobrada fuera de la página (datáfono / link de pago); solo se registra


class Pedido(TimestampMixin, Base):
    __tablename__ = "pedidos"

    id: Mapped[int] = mapped_column(primary_key=True)
    tipo: Mapped[TipoPedido] = mapped_column(Enum(TipoPedido, name="tipo_pedido"), default=TipoPedido.producto)
    cliente_nombre: Mapped[str] = mapped_column(String(120))
    cliente_telefono: Mapped[str] = mapped_column(String(20))
    fecha_entrega: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    zona_id: Mapped[int | None] = mapped_column(ForeignKey("zonas_entrega.id", ondelete="SET NULL"))
    direccion: Mapped[str | None] = mapped_column(String(300))
    costo_envio: Mapped[Decimal] = mapped_column(Dinero, default=0)
    subtotal: Mapped[Decimal] = mapped_column(Dinero, default=0)
    total: Mapped[Decimal] = mapped_column(Dinero, default=0)
    monto_pagado: Mapped[Decimal] = mapped_column(Dinero, default=0)
    metodo_pago: Mapped[MetodoPago] = mapped_column(
        Enum(MetodoPago, name="metodo_pago"), default=MetodoPago.transferencia
    )
    estado: Mapped[EstadoPedido] = mapped_column(
        Enum(EstadoPedido, name="estado_pedido"), default=EstadoPedido.pendiente, index=True
    )
    estado_pago: Mapped[EstadoPago] = mapped_column(
        Enum(EstadoPago, name="estado_pago"), default=EstadoPago.pendiente
    )
    notas: Mapped[str | None] = mapped_column(Text)
    creado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))

    items: Mapped[list["ItemPedido"]] = relationship(back_populates="pedido", cascade="all, delete-orphan")
    zona: Mapped[ZonaEntrega | None] = relationship()


class ItemPedido(Base):
    __tablename__ = "items_pedido"

    id: Mapped[int] = mapped_column(primary_key=True)
    pedido_id: Mapped[int] = mapped_column(ForeignKey("pedidos.id", ondelete="CASCADE"), index=True)
    producto_id: Mapped[int | None] = mapped_column(ForeignKey("productos.id", ondelete="SET NULL"))
    maquina_id: Mapped[int | None] = mapped_column(ForeignKey("maquinas_alquiler.id", ondelete="SET NULL"))
    descripcion: Mapped[str] = mapped_column(String(200))  # copia del nombre al momento del pedido
    cantidad: Mapped[int] = mapped_column(Integer, default=1)
    precio_unitario: Mapped[Decimal] = mapped_column(Dinero)
    # {"colores": [...], "nombre": "...", "dedicatoria": "...", "complementos": [{"id":1,"nombre":"Globo","precio":3}]}
    personalizacion: Mapped[dict | None] = mapped_column(JSON)

    pedido: Mapped[Pedido] = relationship(back_populates="items")


# ---------------------------------------------------------------- Materia prima


class Proveedor(TimestampMixin, Base):
    __tablename__ = "proveedores"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(150))
    ruc: Mapped[str | None] = mapped_column(String(13))
    telefono: Mapped[str | None] = mapped_column(String(20))
    email: Mapped[str | None] = mapped_column(String(160))
    notas: Mapped[str | None] = mapped_column(Text)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class MateriaPrima(TimestampMixin, Base):
    __tablename__ = "materias_primas"

    id: Mapped[int] = mapped_column(primary_key=True)
    nombre: Mapped[str] = mapped_column(String(120), unique=True)
    unidad: Mapped[str] = mapped_column(String(20))  # kg, g, l, ml, unidad
    stock_actual: Mapped[Decimal] = mapped_column(Cantidad, default=0)
    stock_minimo: Mapped[Decimal] = mapped_column(Cantidad, default=0)
    costo_promedio: Mapped[Decimal] = mapped_column(Numeric(12, 4), default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)


class Compra(TimestampMixin, Base):
    __tablename__ = "compras"

    id: Mapped[int] = mapped_column(primary_key=True)
    proveedor_id: Mapped[int | None] = mapped_column(ForeignKey("proveedores.id", ondelete="SET NULL"))
    fecha: Mapped[date] = mapped_column(Date, index=True)
    numero_factura: Mapped[str | None] = mapped_column(String(50))
    total: Mapped[Decimal] = mapped_column(Dinero, default=0)
    notas: Mapped[str | None] = mapped_column(Text)
    registrado_por_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))

    proveedor: Mapped[Proveedor | None] = relationship()
    items: Mapped[list["ItemCompra"]] = relationship(back_populates="compra", cascade="all, delete-orphan")


class ItemCompra(Base):
    __tablename__ = "items_compra"

    id: Mapped[int] = mapped_column(primary_key=True)
    compra_id: Mapped[int] = mapped_column(ForeignKey("compras.id", ondelete="CASCADE"), index=True)
    materia_prima_id: Mapped[int] = mapped_column(ForeignKey("materias_primas.id", ondelete="RESTRICT"))
    cantidad: Mapped[Decimal] = mapped_column(Cantidad)
    costo_unitario: Mapped[Decimal] = mapped_column(Numeric(12, 4))

    compra: Mapped[Compra] = relationship(back_populates="items")
    materia_prima: Mapped[MateriaPrima] = relationship()


class TipoMovimiento(str, enum.Enum):
    entrada = "entrada"  # compra
    salida = "salida"  # consumo en producción
    ajuste = "ajuste"  # conteo físico, merma, etc. (cantidad con signo)


class MovimientoInventario(Base):
    __tablename__ = "movimientos_inventario"

    id: Mapped[int] = mapped_column(primary_key=True)
    materia_prima_id: Mapped[int] = mapped_column(ForeignKey("materias_primas.id", ondelete="CASCADE"), index=True)
    tipo: Mapped[TipoMovimiento] = mapped_column(Enum(TipoMovimiento, name="tipo_movimiento"))
    cantidad: Mapped[Decimal] = mapped_column(Cantidad)
    costo_unitario: Mapped[Decimal | None] = mapped_column(Numeric(12, 4))
    motivo: Mapped[str | None] = mapped_column(String(250))
    compra_id: Mapped[int | None] = mapped_column(ForeignKey("compras.id", ondelete="SET NULL"))
    pedido_id: Mapped[int | None] = mapped_column(ForeignKey("pedidos.id", ondelete="SET NULL"))
    usuario_id: Mapped[int | None] = mapped_column(ForeignKey("usuarios.id", ondelete="SET NULL"))
    fecha: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), index=True)

    materia_prima: Mapped[MateriaPrima] = relationship()
    compra: Mapped[Compra | None] = relationship()


# ---------------------------------------------------------------- Imágenes subidas desde el panel


class Imagen(Base):
    """Imágenes guardadas en la BD (ya comprimidas por el navegador, ~100-300 KB).

    Se sirven en /api/imagenes/{id}; productos, galería, etc. guardan esa ruta.
    """

    __tablename__ = "imagenes"

    id: Mapped[str] = mapped_column(String(32), primary_key=True)  # uuid hex
    content_type: Mapped[str] = mapped_column(String(50))
    datos: Mapped[bytes] = mapped_column(LargeBinary)
    tamano: Mapped[int] = mapped_column(Integer)
    nombre_original: Mapped[str | None] = mapped_column(String(200))
    creado_en: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


# ---------------------------------------------------------------- Chatbot (reglas, costo 0)


class ChatbotNodo(TimestampMixin, Base):
    """Árbol de menú: cada nodo es una opción con su respuesta y sus opciones hijas.

    Nodos raíz (padre_id = NULL) = menú principal. Si `accion_whatsapp` es True,
    la respuesta muestra un botón que abre WhatsApp con `mensaje_whatsapp` prellenado.
    `palabras_clave` permite responder si el usuario escribe texto libre.
    """

    __tablename__ = "chatbot_nodos"

    id: Mapped[int] = mapped_column(primary_key=True)
    padre_id: Mapped[int | None] = mapped_column(ForeignKey("chatbot_nodos.id", ondelete="CASCADE"), index=True)
    etiqueta: Mapped[str] = mapped_column(String(100))  # texto del botón
    respuesta: Mapped[str] = mapped_column(Text)
    palabras_clave: Mapped[list[str]] = mapped_column(JSON, default=list)
    accion_whatsapp: Mapped[bool] = mapped_column(Boolean, default=False)
    mensaje_whatsapp: Mapped[str | None] = mapped_column(String(500))
    orden: Mapped[int] = mapped_column(Integer, default=0)
    activo: Mapped[bool] = mapped_column(Boolean, default=True)

    hijos: Mapped[list["ChatbotNodo"]] = relationship(order_by="ChatbotNodo.orden")
