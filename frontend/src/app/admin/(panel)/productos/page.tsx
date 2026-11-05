"use client";

import { Gift, Star } from "lucide-react";
import { useMemo } from "react";
import { ResourcePage, type Campo, type Columna } from "@/components/ResourcePage";
import { Badge, Thumb } from "@/components/ui";
import { fmtDinero } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Categoria, Producto } from "@/lib/types";

export default function ProductosPage() {
  const { data: categorias } = useApi<Categoria[]>("/api/categorias", ["categorias"]);
  const nombreCat = useMemo(() => new Map(categorias?.map((c) => [c.id, c.nombre])), [categorias]);

  const columnas = useMemo<Columna<Producto>[]>(
    () => [
      {
        header: "Producto",
        cell: (p) => (
          <div className="flex items-center gap-3">
            <Thumb src={p.imagenes[0]} alt={p.nombre} className="size-11 shrink-0" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 truncate font-medium text-stone-900">
                {p.nombre}
                {p.destacado && <Star className="size-3.5 shrink-0 fill-amber-400 text-amber-400" aria-label="Destacado" />}
              </p>
              <p className="truncate text-xs text-stone-500">{p.descripcion || "Sin descripción"}</p>
            </div>
          </div>
        ),
      },
      {
        header: "Categoría",
        cell: (p) => (p.categoria_id ? <Badge tono="cacao">{nombreCat.get(p.categoria_id) ?? "—"}</Badge> : <span className="text-stone-400">—</span>),
      },
      { header: "Precio", className: "text-right tabular-nums", cell: (p) => <span className="font-semibold">{fmtDinero(p.precio)}</span> },
      {
        header: "Personalizable",
        cell: (p) =>
          p.personalizable ? (
            <div className="flex items-center gap-1">
              {p.colores_disponibles.slice(0, 5).map((c) => (
                <span key={c} title={c} className="size-3.5 rounded-full ring-1 ring-black/10" style={{ background: c }} />
              ))}
              {p.colores_disponibles.length === 0 && <Badge tono="violeta">Sí</Badge>}
            </div>
          ) : (
            <span className="text-stone-400">No</span>
          ),
      },
    ],
    [nombreCat],
  );

  const campos: Campo[] = [
    { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, placeholder: "Caja de fresas corazón" },
    {
      name: "categoria_id",
      label: "Categoría",
      tipo: "select",
      numerico: true,
      vacio: "— Sin categoría —",
      opciones: categorias?.map((c) => ({ valor: c.id, label: c.nombre })) ?? [],
    },
    { name: "precio", label: "Precio", tipo: "dinero", requerido: true, placeholder: "0.00" },
    { name: "descripcion", label: "Descripción", tipo: "area", placeholder: "Qué incluye, tamaño, para cuántas personas…" },
    { name: "imagenes", label: "Fotos", tipo: "imagenes", ayuda: "La primera foto es la portada del catálogo." },
    { name: "destacado", label: "Destacado", tipo: "switch", ayuda: "Aparece en la página de inicio." },
    { name: "personalizable", label: "Personalizable", tipo: "switch", ayuda: "El cliente puede elegir colores, nombre y dedicatoria." },
    {
      name: "colores_disponibles",
      label: "Colores disponibles",
      tipo: "colores",
      placeholder: "rojo, rosado, #8B4513…",
      ayuda: "Escribe un color (nombre en inglés o código #hex) y presiona Enter.",
      visible: (f) => !!f.personalizable,
    },
    { name: "activo", label: "Visible en el catálogo", tipo: "switch" },
  ];

  return (
    <ResourcePage<Producto>
      titulo="Productos"
      descripcion="Lo que se muestra en el catálogo de la página."
      endpoint="/api/productos"
      singular="producto"
      icono={<Gift className="size-6" />}
      columnas={columnas}
      campos={campos}
      defaults={{ nombre: "", categoria_id: "", precio: "", descripcion: "", imagenes: [], destacado: false, personalizable: false, colores_disponibles: [], activo: true }}
      aPayload={(f) => ({ ...f, colores_disponibles: f.personalizable ? f.colores_disponibles : [] })}
      nombreFila={(p) => p.nombre}
      buscar="Buscar por nombre o descripción"
      textoVacio="Agrega tu primer producto con su foto y precio."
      anchoModal="lg"
    />
  );
}
