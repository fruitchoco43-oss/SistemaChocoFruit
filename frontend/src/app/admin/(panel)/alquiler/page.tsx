"use client";

import { Clock, PartyPopper } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { Thumb } from "@/components/ui";
import { fmtDinero } from "@/lib/format";
import type { Maquina } from "@/lib/types";

export default function AlquilerPage() {
  return (
    <ResourcePage<Maquina>
      titulo="Alquiler de máquinas"
      descripcion="Máquinas para eventos: precio, duración del servicio y condiciones."
      endpoint="/api/maquinas"
      singular="máquina"
      femenino
      icono={<PartyPopper className="size-6" />}
      columnas={[
        {
          header: "Máquina",
          cell: (m) => (
            <div className="flex items-center gap-3">
              <Thumb src={m.imagenes[0]} alt={m.nombre} className="size-11 shrink-0" />
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">{m.nombre}</p>
                <p className="truncate text-xs text-stone-500">{m.descripcion || "Sin descripción"}</p>
              </div>
            </div>
          ),
        },
        {
          header: "Duración",
          cell: (m) => (
            <span className="inline-flex items-center gap-1.5 text-stone-600">
              <Clock className="size-3.5" /> {m.duracion_horas} h
            </span>
          ),
        },
        { header: "Precio", className: "text-right tabular-nums", cell: (m) => <span className="font-semibold">{fmtDinero(m.precio)}</span> },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, completo: true, placeholder: "Fuente de chocolate grande" },
        { name: "precio", label: "Precio del alquiler", tipo: "dinero", requerido: true },
        { name: "duracion_horas", label: "Duración (horas)", tipo: "numero", requerido: true, step: "1", min: 1 },
        { name: "descripcion", label: "Descripción", tipo: "area", placeholder: "Qué incluye: insumos, personal, montaje…" },
        { name: "condiciones", label: "Condiciones", tipo: "area", placeholder: "Anticipo, garantía, cobertura, daños…" },
        { name: "imagenes", label: "Fotos", tipo: "imagenes" },
        { name: "activo", label: "Disponible", tipo: "switch" },
      ]}
      defaults={{ nombre: "", precio: "", duracion_horas: 3, descripcion: "", condiciones: "", imagenes: [], activo: true }}
      nombreFila={(m) => m.nombre}
      anchoModal="lg"
    />
  );
}
