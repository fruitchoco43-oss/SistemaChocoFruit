import type { EstadoPago, EstadoPedido, TipoMovimiento } from "./types";

const TZ = "America/Guayaquil";

const dinero = new Intl.NumberFormat("es-EC", { style: "currency", currency: "USD" });
const numero = new Intl.NumberFormat("es-EC", { maximumFractionDigits: 3 });

export const fmtDinero = (n: number | null | undefined) => dinero.format(n ?? 0);
export const fmtNumero = (n: number | null | undefined) => numero.format(n ?? 0);

export function fmtFecha(iso: string | null | undefined, conHora = false): string {
  if (!iso) return "—";
  // Fechas "YYYY-MM-DD" sin hora: se muestran tal cual, sin desfase de zona.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(iso) ? new Date(`${iso}T12:00:00`) : new Date(iso);
  return d.toLocaleString("es-EC", {
    timeZone: TZ,
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...(conHora ? { hour: "2-digit", minute: "2-digit" } : {}),
  });
}

/** ISO (UTC) -> valor para <input type="datetime-local"> en hora de Ecuador. */
export function isoALocal(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(new Date(iso).getTime() - 5 * 3600 * 1000);
  return d.toISOString().slice(0, 16);
}

/** Valor de <input type="datetime-local"> (hora de Ecuador) -> ISO con zona. */
export function localAIso(local: string): string | null {
  return local ? `${local}:00-05:00` : null;
}

export function hoyISO(): string {
  return new Date(Date.now() - 5 * 3600 * 1000).toISOString().slice(0, 10);
}

/** 0991234567 -> 593991234567 (formato para wa.me). */
export function telefonoWhatsApp(tel: string): string {
  const d = tel.replace(/\D/g, "");
  if (d.startsWith("593")) return d;
  if (d.startsWith("0")) return `593${d.slice(1)}`;
  return d;
}

export function linkWhatsApp(tel: string, mensaje?: string): string {
  const base = `https://wa.me/${telefonoWhatsApp(tel)}`;
  return mensaje ? `${base}?text=${encodeURIComponent(mensaje)}` : base;
}

type Tono = "gris" | "ambar" | "azul" | "violeta" | "verde" | "rojo";

export const ESTADOS_PEDIDO: Record<EstadoPedido, { label: string; tono: Tono }> = {
  pendiente: { label: "Pendiente", tono: "ambar" },
  confirmado: { label: "Confirmado", tono: "azul" },
  en_preparacion: { label: "En preparación", tono: "violeta" },
  entregado: { label: "Entregado", tono: "verde" },
  cancelado: { label: "Cancelado", tono: "gris" },
};

export const ESTADOS_PAGO: Record<EstadoPago, { label: string; tono: Tono }> = {
  pendiente: { label: "Sin pagar", tono: "rojo" },
  abonado: { label: "Abonado", tono: "ambar" },
  pagado: { label: "Pagado", tono: "verde" },
};

export const TIPOS_MOVIMIENTO: Record<TipoMovimiento, { label: string; tono: Tono }> = {
  entrada: { label: "Entrada", tono: "verde" },
  salida: { label: "Salida", tono: "rojo" },
  ajuste: { label: "Ajuste", tono: "azul" },
};

export const UNIDADES = ["kg", "g", "l", "ml", "unidad", "paquete", "caja", "metro"];
