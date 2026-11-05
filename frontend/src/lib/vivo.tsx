"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_URL, CLIENTE_ID, tokenStore } from "./api";

export interface EventoVivo {
  canal: string;
  accion: "crear" | "actualizar" | "eliminar" | "reconectado";
  id: number | string | null;
  origen: string | null;
  /** true si el cambio lo hizo esta misma pestaña */
  propio: boolean;
  cliente?: string;
  total?: number;
  estado?: string;
}

type Oyente = (e: EventoVivo) => void;
export type EstadoConexion = "conectando" | "en_vivo" | "reconectando";

interface Ctx {
  estado: EstadoConexion;
  escuchar: (fn: Oyente) => () => void;
}

const VivoCtx = createContext<Ctx | null>(null);

/** Abre UNA conexión SSE por pestaña y reparte los eventos a quien los escuche. */
export function EnVivoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoConexion>("conectando");
  const oyentes = useRef(new Set<Oyente>());

  useEffect(() => {
    const token = tokenStore.get();
    if (!token) return;
    let fuente: EventSource | null = null;
    let reintento: ReturnType<typeof setTimeout> | undefined;
    let conectadoAntes = false;
    let cerrado = false;

    const emitir = (e: EventoVivo) => oyentes.current.forEach((fn) => fn(e));

    const conectar = () => {
      fuente = new EventSource(`${API_URL}/api/eventos?token=${encodeURIComponent(token)}`);
      fuente.onopen = () => {
        setEstado("en_vivo");
        // Si se cortó la conexión, pudimos perder eventos: que todos recarguen.
        if (conectadoAntes) emitir({ canal: "*", accion: "reconectado", id: null, origen: null, propio: false });
        conectadoAntes = true;
      };
      fuente.onmessage = (m) => {
        try {
          const d = JSON.parse(m.data);
          emitir({ ...d, propio: d.origen === CLIENTE_ID });
        } catch {}
      };
      fuente.onerror = () => {
        setEstado("reconectando");
        // EventSource reintenta solo; si quedó cerrado (p. ej. el servidor se reinició), reabrimos nosotros.
        if (fuente?.readyState === EventSource.CLOSED && !cerrado) {
          fuente.close();
          reintento = setTimeout(conectar, 4000);
        }
      };
    };
    conectar();

    // Los navegadores frenan las pestañas en segundo plano: al volver a la pestaña, sincronizamos todo.
    const alVolver = () => {
      if (document.visibilityState === "visible") emitir({ canal: "*", accion: "reconectado", id: null, origen: null, propio: false });
    };
    document.addEventListener("visibilitychange", alVolver);

    return () => {
      cerrado = true;
      clearTimeout(reintento);
      fuente?.close();
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, []);

  const escuchar = (fn: Oyente) => {
    oyentes.current.add(fn);
    return () => {
      oyentes.current.delete(fn);
    };
  };

  return <VivoCtx.Provider value={{ estado, escuchar }}>{children}</VivoCtx.Provider>;
}

export function useEstadoVivo(): EstadoConexion | null {
  return useContext(VivoCtx)?.estado ?? null;
}

/**
 * Ejecuta `alCambiar` cuando llega un evento de alguno de los `canales`
 * (o al reconectar). Agrupa ráfagas de eventos en una sola llamada.
 */
export function useEnVivo(canales: string[] | undefined, alCambiar: (e: EventoVivo) => void) {
  const ctx = useContext(VivoCtx);
  const cb = useRef(alCambiar);
  useEffect(() => {
    cb.current = alCambiar;
  });
  const clave = canales?.join(",") ?? "";

  useEffect(() => {
    if (!ctx || !clave) return;
    const lista = clave.split(",");
    let t: ReturnType<typeof setTimeout> | undefined;
    const off = ctx.escuchar((e) => {
      if (e.canal !== "*" && !lista.includes(e.canal)) return;
      clearTimeout(t);
      t = setTimeout(() => cb.current(e), 250);
    });
    return () => {
      clearTimeout(t);
      off();
    };
  }, [ctx, clave]);
}
