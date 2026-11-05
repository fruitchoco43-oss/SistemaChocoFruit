"""Schemas de entrada/salida de la API."""

from datetime import date, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer

from app.models import EstadoPago, EstadoPedido, MetodoPago, Rol, TipoMovimiento, TipoPedido

# Decimal -> número en JSON (por defecto Pydantic lo envía como string)
Num = Annotated[Decimal, PlainSerializer(float, return_type=float, when_used="json")]
Dinero = Annotated[Decimal, Field(ge=0, max_digits=10, decimal_places=2)]
Cant = Annotated[Decimal, Field(max_digits=12, decimal_places=3)]
Costo = Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=4)]
Texto = Annotated[str, Field(min_length=1, max_length=200)]


class Orm(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# ---------------------------------------------------------------- Usuarios


class UsuarioBase(BaseModel):
    nombre: Texto
    email: EmailStr
    rol: Rol = Rol.empleado
    activo: bool = True


class UsuarioCreate(UsuarioBase):
    password: str = Field(min_length=8, max_length=128)


class UsuarioUpdate(BaseModel):
    nombre: Texto | None = None
    email: EmailStr | None = None
    rol: Rol | None = None
    activo: bool | None = None
    password: str | None = Field(default=None, min_length=8, max_length=128)


class UsuarioOut(Orm):
    id: int
    nombre: str
    email: str
    rol: Rol
    activo: bool
    creado_en: datetime


# ---------------------------------------------------------------- Catálogo


class CategoriaIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=80)]
    orden: int = 0
    activo: bool = True


class CategoriaUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=80)] | None = None
    orden: int | None = None
    activo: bool | None = None


class CategoriaOut(Orm):
    id: int
    nombre: str
    slug: str
    orden: int
    activo: bool


class ProductoIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)]
    categoria_id: int | None = None
    descripcion: str | None = None
    precio: Dinero
    imagenes: list[str] = []
    personalizable: bool = False
    colores_disponibles: list[str] = []
    destacado: bool = False
    activo: bool = True


class ProductoUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    categoria_id: int | None = None
    descripcion: str | None = None
    precio: Dinero | None = None
    imagenes: list[str] | None = None
    personalizable: bool | None = None
    colores_disponibles: list[str] | None = None
    destacado: bool | None = None
    activo: bool | None = None


class ProductoOut(Orm):
    id: int
    nombre: str
    slug: str
    categoria_id: int | None
    descripcion: str | None
    precio: Num
    imagenes: list[str]
    personalizable: bool
    colores_disponibles: list[str]
    destacado: bool
    activo: bool


class ComplementoIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=100)]
    precio: Dinero
    imagen: str | None = None
    activo: bool = True


class ComplementoUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    precio: Dinero | None = None
    imagen: str | None = None
    activo: bool | None = None


class ComplementoOut(Orm):
    id: int
    nombre: str
    precio: Num
    imagen: str | None
    activo: bool


class GaleriaIn(BaseModel):
    imagen: Annotated[str, Field(min_length=1, max_length=500)]
    titulo: str | None = None
    descripcion: str | None = None
    orden: int = 0
    activo: bool = True


class GaleriaUpdate(BaseModel):
    imagen: Annotated[str, Field(min_length=1, max_length=500)] | None = None
    titulo: str | None = None
    descripcion: str | None = None
    orden: int | None = None
    activo: bool | None = None


class GaleriaOut(Orm):
    id: int
    imagen: str
    titulo: str | None
    descripcion: str | None
    orden: int
    activo: bool


class ZonaIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=100)]
    costo_envio: Dinero
    descripcion: str | None = None
    activo: bool = True


class ZonaUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    costo_envio: Dinero | None = None
    descripcion: str | None = None
    activo: bool | None = None


class ZonaOut(Orm):
    id: int
    nombre: str
    costo_envio: Num
    descripcion: str | None
    activo: bool


class MaquinaIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)]
    descripcion: str | None = None
    precio: Dinero
    duracion_horas: int = Field(ge=1, le=72)
    condiciones: str | None = None
    imagenes: list[str] = []
    activo: bool = True


class MaquinaUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    descripcion: str | None = None
    precio: Dinero | None = None
    duracion_horas: int | None = Field(default=None, ge=1, le=72)
    condiciones: str | None = None
    imagenes: list[str] | None = None
    activo: bool | None = None


class MaquinaOut(Orm):
    id: int
    nombre: str
    descripcion: str | None
    precio: Num
    duracion_horas: int
    condiciones: str | None
    imagenes: list[str]
    activo: bool


class InfoNegocioIn(BaseModel):
    whatsapp: Annotated[str, Field(pattern=r"^\d{8,15}$")]
    datos_transferencia: str | None = None
    horario: str | None = None
    direccion: str | None = None
    instagram: str | None = None
    facebook: str | None = None
    tiktok: str | None = None
    texto_inicio: str | None = None


class InfoNegocioOut(InfoNegocioIn, Orm):
    whatsapp: str


# ---------------------------------------------------------------- Chatbot


class ChatbotNodoIn(BaseModel):
    padre_id: int | None = None
    etiqueta: Annotated[str, Field(min_length=1, max_length=100)]
    respuesta: Annotated[str, Field(min_length=1)]
    palabras_clave: list[str] = []
    accion_whatsapp: bool = False
    mensaje_whatsapp: str | None = None
    orden: int = 0
    activo: bool = True


class ChatbotNodoUpdate(BaseModel):
    padre_id: int | None = None
    etiqueta: Annotated[str, Field(min_length=1, max_length=100)] | None = None
    respuesta: str | None = None
    palabras_clave: list[str] | None = None
    accion_whatsapp: bool | None = None
    mensaje_whatsapp: str | None = None
    orden: int | None = None
    activo: bool | None = None


class ChatbotNodoOut(Orm):
    id: int
    padre_id: int | None
    etiqueta: str
    respuesta: str
    palabras_clave: list[str]
    accion_whatsapp: bool
    mensaje_whatsapp: str | None
    orden: int
    activo: bool


# ---------------------------------------------------------------- Pedidos


class ItemPedidoIn(BaseModel):
    producto_id: int | None = None
    maquina_id: int | None = None
    descripcion: Texto
    cantidad: int = Field(ge=1, le=1000)
    precio_unitario: Dinero
    personalizacion: dict | None = None


class ItemPedidoOut(Orm):
    id: int
    producto_id: int | None
    maquina_id: int | None
    descripcion: str
    cantidad: int
    precio_unitario: Num
    personalizacion: dict | None


class PedidoIn(BaseModel):
    tipo: TipoPedido = TipoPedido.producto
    cliente_nombre: Annotated[str, Field(min_length=1, max_length=120)]
    cliente_telefono: Annotated[str, Field(min_length=7, max_length=20)]
    fecha_entrega: datetime | None = None
    zona_id: int | None = None
    direccion: str | None = None
    costo_envio: Dinero | None = None  # si es None se toma de la zona
    monto_pagado: Dinero = Decimal(0)
    metodo_pago: MetodoPago = MetodoPago.transferencia
    estado: EstadoPedido = EstadoPedido.pendiente
    notas: str | None = None
    items: list[ItemPedidoIn] = Field(min_length=1)


class PedidoEstadoIn(BaseModel):
    estado: EstadoPedido | None = None
    monto_pagado: Dinero | None = None


class PedidoOut(Orm):
    id: int
    tipo: TipoPedido
    cliente_nombre: str
    cliente_telefono: str
    fecha_entrega: datetime | None
    zona_id: int | None
    zona_nombre: str | None = None
    direccion: str | None
    costo_envio: Num
    subtotal: Num
    total: Num
    monto_pagado: Num
    metodo_pago: MetodoPago
    estado: EstadoPedido
    estado_pago: EstadoPago
    notas: str | None
    creado_en: datetime
    items: list[ItemPedidoOut]


# ---------------------------------------------------------------- Materia prima


class ProveedorIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=150)]
    ruc: Annotated[str, Field(pattern=r"^\d{10}(\d{3})?$")] | None = None
    telefono: str | None = None
    email: EmailStr | None = None
    notas: str | None = None
    activo: bool = True


class ProveedorUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=150)] | None = None
    ruc: Annotated[str, Field(pattern=r"^\d{10}(\d{3})?$")] | None = None
    telefono: str | None = None
    email: EmailStr | None = None
    notas: str | None = None
    activo: bool | None = None


class ProveedorOut(Orm):
    id: int
    nombre: str
    ruc: str | None
    telefono: str | None
    email: str | None
    notas: str | None
    activo: bool


class MateriaPrimaIn(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)]
    unidad: Annotated[str, Field(min_length=1, max_length=20)]
    stock_minimo: Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=3)] = Decimal(0)
    activo: bool = True


class MateriaPrimaUpdate(BaseModel):
    nombre: Annotated[str, Field(min_length=1, max_length=120)] | None = None
    unidad: Annotated[str, Field(min_length=1, max_length=20)] | None = None
    stock_minimo: Annotated[Decimal, Field(ge=0, max_digits=12, decimal_places=3)] | None = None
    activo: bool | None = None


class MateriaPrimaOut(Orm):
    id: int
    nombre: str
    unidad: str
    stock_actual: Num
    stock_minimo: Num
    costo_promedio: Num
    activo: bool


class ItemCompraIn(BaseModel):
    materia_prima_id: int
    cantidad: Annotated[Decimal, Field(gt=0, max_digits=12, decimal_places=3)]
    costo_unitario: Costo


class ItemCompraOut(Orm):
    id: int
    materia_prima_id: int
    materia_prima_nombre: str | None = None
    unidad: str | None = None
    cantidad: Num
    costo_unitario: Num


class CompraIn(BaseModel):
    proveedor_id: int | None = None
    fecha: date
    numero_factura: str | None = None
    notas: str | None = None
    items: list[ItemCompraIn] = Field(min_length=1)


class CompraOut(Orm):
    id: int
    proveedor_id: int | None
    proveedor_nombre: str | None = None
    fecha: date
    numero_factura: str | None
    total: Num
    notas: str | None
    items: list[ItemCompraOut]


class MovimientoIn(BaseModel):
    materia_prima_id: int
    tipo: TipoMovimiento  # salida o ajuste (las entradas se registran como compras)
    cantidad: Cant  # salida: positiva. ajuste: con signo (+ suma, - resta)
    motivo: str | None = None
    pedido_id: int | None = None


class MovimientoOut(Orm):
    id: int
    materia_prima_id: int
    materia_prima_nombre: str | None = None
    unidad: str | None = None
    tipo: TipoMovimiento
    cantidad: Num
    costo_unitario: Num | None
    motivo: str | None
    compra_id: int | None
    pedido_id: int | None
    fecha: datetime
