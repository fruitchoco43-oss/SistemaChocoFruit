import { API_URL } from "./api";
import { MARCA } from "./marca";
import type { Categoria, ChatbotNodo, Complemento, InfoNegocio, Maquina, Producto, Zona } from "./types";

export interface ItemGaleria {
  id: number;
  imagen: string;
  titulo: string | null;
  descripcion: string | null;
}

export interface CatalogoPublico {
  negocio: InfoNegocio | null;
  categorias: Categoria[];
  productos: Producto[];
  complementos: Complemento[];
  zonas: Zona[];
  maquinas: Maquina[];
  galeria: ItemGaleria[];
}

const VACIO: CatalogoPublico = { negocio: null, categorias: [], productos: [], complementos: [], zonas: [], maquinas: [], galeria: [] };

/** Se ejecuta en el servidor de Vercel en cada visita (datos siempre al día). Si la API no responde, la página igual se muestra. */
export async function cargarCatalogo(): Promise<CatalogoPublico> {
  try {
    const r = await fetch(`${API_URL}/api/publico/catalogo`, { cache: "no-store" });
    if (!r.ok) return VACIO;
    return { ...VACIO, ...(await r.json()) };
  } catch {
    return VACIO;
  }
}

export async function cargarChatbot(): Promise<ChatbotNodo[]> {
  try {
    const r = await fetch(`${API_URL}/api/publico/chatbot`, { cache: "no-store" });
    return r.ok ? await r.json() : [];
  } catch {
    return [];
  }
}

export function numeroWhatsApp(negocio: InfoNegocio | null): string {
  return negocio?.whatsapp || MARCA.whatsapp;
}

export function enlaceWhatsApp(numero: string, mensaje: string): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`;
}

export const MENSAJE_GENERAL = `Hola, ${MARCA.nombre}. Me gustaría hacer un pedido.`;
