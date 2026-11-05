"use client";

import { Images } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { Thumb } from "@/components/ui";
import type { Campo } from "@/components/ResourcePage";

interface ItemGaleria {
  id: number;
  imagen: string;
  titulo: string | null;
  descripcion: string | null;
  orden: number;
  activo: boolean;
}

const campos: Campo[] = [
  { name: "imagen", label: "Foto", tipo: "imagen", requerido: true },
  { name: "titulo", label: "Título", tipo: "texto", placeholder: "Arreglo de cumpleaños" },
  { name: "orden", label: "Orden", tipo: "numero", step: "1" },
  { name: "descripcion", label: "Descripción", tipo: "area" },
  { name: "activo", label: "Visible", tipo: "switch" },
];

export default function GaleriaPage() {
  return (
    <ResourcePage<ItemGaleria>
      titulo="Galería"
      descripcion="Fotos de trabajos entregados que se muestran en la página."
      endpoint="/api/galeria"
      singular="foto"
      femenino
      icono={<Images className="size-6" />}
      columnas={[
        {
          header: "Foto",
          cell: (g) => (
            <div className="flex items-center gap-3">
              <Thumb src={g.imagen} alt={g.titulo ?? "Foto"} className="size-14 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{g.titulo || "Sin título"}</p>
                <p className="truncate text-xs text-stone-500">{g.descripcion}</p>
              </div>
            </div>
          ),
        },
        { header: "Orden", className: "w-24 tabular-nums", cell: (g) => g.orden },
      ]}
      campos={campos}
      defaults={{ imagen: "", titulo: "", descripcion: "", orden: 0, activo: true }}
      nombreFila={(g) => g.titulo || `Foto #${g.id}`}
      buscar="Buscar por título"
    />
  );
}
