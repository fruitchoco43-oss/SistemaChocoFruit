"use client";

import { Map as MapIcon } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { fmtDinero } from "@/lib/format";
import type { Zona } from "@/lib/types";

export default function ZonasPage() {
  return (
    <ResourcePage<Zona>
      titulo="Zonas de entrega"
      descripcion="Sectores de cobertura y su costo de envío. Se usan al registrar pedidos."
      endpoint="/api/zonas"
      singular="zona"
      femenino
      icono={<MapIcon className="size-6" />}
      columnas={[
        {
          header: "Zona",
          cell: (z) => (
            <div>
              <p className="font-medium text-stone-900">{z.nombre}</p>
              {z.descripcion && <p className="text-xs text-stone-500">{z.descripcion}</p>}
            </div>
          ),
        },
        {
          header: "Costo de envío",
          className: "text-right tabular-nums",
          cell: (z) => (z.costo_envio === 0 ? <span className="font-medium text-emerald-700">Gratis</span> : <span className="font-semibold">{fmtDinero(z.costo_envio)}</span>),
        },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, placeholder: "Norte de Quito" },
        { name: "costo_envio", label: "Costo de envío", tipo: "dinero", requerido: true, ayuda: "0 = envío gratis" },
        { name: "descripcion", label: "Sectores que incluye", tipo: "area", placeholder: "Carcelén, Condado, Ponceano…" },
        { name: "activo", label: "Activa", tipo: "switch" },
      ]}
      defaults={{ nombre: "", costo_envio: "", descripcion: "", activo: true }}
      nombreFila={(z) => z.nombre}
    />
  );
}
