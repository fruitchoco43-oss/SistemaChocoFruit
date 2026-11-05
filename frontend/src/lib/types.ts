// Tipos que reflejan los schemas de la API (backend/app/schemas.py).

export type Rol = "admin" | "empleado";
export type EstadoPedido = "pendiente" | "confirmado" | "en_preparacion" | "entregado" | "cancelado";
export type EstadoPago = "pendiente" | "abonado" | "pagado";
export type MetodoPago = "transferencia" | "efectivo" | "tarjeta";
export type TipoPedido = "producto" | "alquiler";
export type TipoMovimiento = "entrada" | "salida" | "ajuste";

export interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: Rol;
  activo: boolean;
  creado_en?: string;
}

export interface Categoria {
  id: number;
  nombre: string;
  slug: string;
  orden: number;
  activo: boolean;
}

export interface Producto {
  id: number;
  nombre: string;
  slug: string;
  categoria_id: number | null;
  descripcion: string | null;
  precio: number;
  imagenes: string[];
  personalizable: boolean;
  colores_disponibles: string[];
  destacado: boolean;
  activo: boolean;
}

export interface Complemento {
  id: number;
  nombre: string;
  precio: number;
  imagen: string | null;
  activo: boolean;
}

export interface Zona {
  id: number;
  nombre: string;
  costo_envio: number;
  descripcion: string | null;
  activo: boolean;
}

export interface Maquina {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  duracion_horas: number;
  condiciones: string | null;
  imagenes: string[];
  activo: boolean;
}

export interface Personalizacion {
  nombre?: string;
  dedicatoria?: string;
  colores?: string[];
  complementos?: { id: number; nombre: string; precio: number }[];
}

export interface ItemPedido {
  id?: number;
  producto_id: number | null;
  maquina_id: number | null;
  descripcion: string;
  cantidad: number;
  precio_unitario: number;
  personalizacion: Personalizacion | null;
}

export interface Pedido {
  id: number;
  tipo: TipoPedido;
  cliente_nombre: string;
  cliente_telefono: string;
  fecha_entrega: string | null;
  zona_id: number | null;
  zona_nombre: string | null;
  direccion: string | null;
  costo_envio: number;
  subtotal: number;
  total: number;
  monto_pagado: number;
  metodo_pago: MetodoPago;
  estado: EstadoPedido;
  estado_pago: EstadoPago;
  notas: string | null;
  creado_en: string;
  items: ItemPedido[];
}

export interface Proveedor {
  id: number;
  nombre: string;
  ruc: string | null;
  telefono: string | null;
  email: string | null;
  notas: string | null;
  activo: boolean;
}

export interface Insumo {
  id: number;
  nombre: string;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  costo_promedio: number;
  activo: boolean;
}

export interface Compra {
  id: number;
  proveedor_id: number | null;
  proveedor_nombre: string | null;
  fecha: string;
  numero_factura: string | null;
  total: number;
  notas: string | null;
  items: {
    id: number;
    materia_prima_id: number;
    materia_prima_nombre: string;
    unidad: string;
    cantidad: number;
    costo_unitario: number;
  }[];
}

export interface Movimiento {
  id: number;
  materia_prima_id: number;
  materia_prima_nombre: string;
  unidad: string;
  tipo: TipoMovimiento;
  cantidad: number;
  costo_unitario: number | null;
  motivo: string | null;
  compra_id: number | null;
  pedido_id: number | null;
  fecha: string;
}

export interface ChatbotNodo {
  id: number;
  padre_id: number | null;
  etiqueta: string;
  respuesta: string;
  palabras_clave: string[];
  accion_whatsapp: boolean;
  mensaje_whatsapp: string | null;
  orden: number;
  activo: boolean;
}

export interface InfoNegocio {
  whatsapp: string;
  datos_transferencia: string | null;
  horario: string | null;
  direccion: string | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  texto_inicio: string | null;
}

export interface Dashboard {
  desde: string;
  hasta: string;
  ventas: number;
  cobrado: number;
  por_cobrar: number;
  gastos_materia_prima: number;
  utilidad_bruta: number;
  pedidos: number;
  pedidos_por_estado: Record<EstadoPedido, number>;
  top_productos: { descripcion: string; cantidad: number; monto: number }[];
  insumos_bajo_stock: Insumo[];
  proximas_entregas: {
    id: number;
    cliente_nombre: string;
    cliente_telefono: string;
    fecha_entrega: string;
    estado: EstadoPedido;
    estado_pago: EstadoPago;
    total: number;
    zona_nombre: string | null;
    items: string[];
  }[];
}
