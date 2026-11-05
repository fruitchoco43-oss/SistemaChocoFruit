"use client";

import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import { useEnVivo, type EventoVivo } from "./vivo";

/**
 * Carga un endpoint GET. `recargar()` vuelve a pedirlo.
 * Si se pasan `vivo` (canales), se recarga solo cuando otro usuario/pestaña cambia algo,
 * sin mostrar el estado de carga (actualización silenciosa, sin F5).
 * `cargando` se deriva comparando la petición actual con la última completada,
 * así no hay setState síncrono dentro del efecto.
 */
export function useApi<T>(path: string | null, vivo?: string[], alCambiar?: (e: EventoVivo) => void) {
  const [version, setVersion] = useState(0);
  const [silenciosa, setSilenciosa] = useState(-1);
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [completada, setCompletada] = useState<string | null>(null);
  const clave = path ? `${version}|${path}` : null;

  useEffect(() => {
    if (!path || !clave) return;
    let cancelado = false;
    api<T>(path)
      .then((r) => {
        if (cancelado) return;
        setData(r);
        setError(null);
      })
      .catch((e) => {
        if (!cancelado) setError(e instanceof ApiError ? e.message : "Error inesperado");
      })
      .finally(() => {
        if (!cancelado) setCompletada(clave);
      });
    return () => {
      cancelado = true;
    };
  }, [path, clave]);

  const recargar = useCallback(() => setVersion((v) => v + 1), []);

  useEnVivo(vivo, (e) => {
    setSilenciosa(version + 1);
    setVersion(version + 1);
    alCambiar?.(e);
  });

  const cargando = clave !== null && completada !== clave && version !== silenciosa;

  return { data, error, cargando, recargar, setData };
}

export function useDebounce<T>(valor: T, ms = 300): T {
  const [v, setV] = useState(valor);
  useEffect(() => {
    const t = setTimeout(() => setV(valor), ms);
    return () => clearTimeout(t);
  }, [valor, ms]);
  return v;
}
