"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { API_URL } from "@/lib/api";

/**
 * Escucha el canal público: cuando cambia el catálogo en el panel (precios,
 * productos, fotos, datos del negocio), vuelve a pedir la página al servidor sin
 * recargar el navegador. Se conserva lo que el visitante esté haciendo
 * (categoría elegida, personalizador abierto, scroll).
 */
export function ActualizarEnVivo() {
  const router = useRouter();
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const refrescar = () => {
      clearTimeout(t);
      t = setTimeout(() => router.refresh(), 400);
    };
    const fuente = new EventSource(`${API_URL}/api/publico/eventos`);
    fuente.onmessage = refrescar;
    // Al volver a la pestaña (los navegadores frenan las de fondo), traemos lo último.
    const alVolver = () => document.visibilityState === "visible" && refrescar();
    document.addEventListener("visibilitychange", alVolver);
    return () => {
      clearTimeout(t);
      fuente.close();
      document.removeEventListener("visibilitychange", alVolver);
    };
  }, [router]);
  return null;
}
