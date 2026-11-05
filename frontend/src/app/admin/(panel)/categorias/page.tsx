"use client";

import { Tags } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import type { Categoria } from "@/lib/types";

export default function CategoriasPage() {
  return (
    <ResourcePage<Categoria>
      titulo="Categorías"
      descripcion="Agrupan los productos en el catálogo (ej.: Fresas con chocolate, Desayunos sorpresa)."
      endpoint="/api/categorias"
      singular="categoría"
      femenino
      icono={<Tags className="size-6" />}
      columnas={[
        { header: "Nombre", cell: (c) => <span className="font-medium text-stone-900">{c.nombre}</span> },
        { header: "Enlace", cell: (c) => <code className="rounded bg-stone-100 px-1.5 py-0.5 text-xs text-stone-600">/{c.slug}</code> },
        { header: "Orden", className: "w-24 tabular-nums", cell: (c) => c.orden },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, completo: true },
        { name: "orden", label: "Orden", tipo: "numero", step: "1", ayuda: "Menor número aparece primero." },
        { name: "activo", label: "Visible", tipo: "switch" },
      ]}
      defaults={{ nombre: "", orden: 0, activo: true }}
      nombreFila={(c) => c.nombre}
      textoVacio="Crea categorías para ordenar tu catálogo."
    />
  );
}
