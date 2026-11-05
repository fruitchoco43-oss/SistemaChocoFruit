"use client";

import { Sparkles } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { Thumb } from "@/components/ui";
import { fmtDinero } from "@/lib/format";
import type { Complemento } from "@/lib/types";

export default function ComplementosPage() {
  return (
    <ResourcePage<Complemento>
      titulo="Complementos"
      descripcion="Extras que el cliente puede sumar al personalizar su regalo: globos, tarjetas, peluches…"
      endpoint="/api/complementos"
      singular="complemento"
      icono={<Sparkles className="size-6" />}
      columnas={[
        {
          header: "Complemento",
          cell: (c) => (
            <div className="flex items-center gap-3">
              <Thumb src={c.imagen} alt={c.nombre} className="size-10 shrink-0" />
              <span className="font-medium text-stone-900">{c.nombre}</span>
            </div>
          ),
        },
        { header: "Precio", className: "text-right tabular-nums", cell: (c) => <span className="font-semibold">{fmtDinero(c.precio)}</span> },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, placeholder: "Globo metálico" },
        { name: "precio", label: "Precio", tipo: "dinero", requerido: true },
        { name: "imagen", label: "Imagen (enlace)", tipo: "texto", completo: true, placeholder: "https://…" },
        { name: "activo", label: "Disponible", tipo: "switch" },
      ]}
      defaults={{ nombre: "", precio: "", imagen: "", activo: true }}
      nombreFila={(c) => c.nombre}
    />
  );
}
