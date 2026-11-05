"use client";

import { ArrowRight, Cake, CakeSlice, Cherry, Dessert, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { Thumb, cn } from "@/components/ui";
import { fmtDinero } from "@/lib/format";
import { MARCA } from "@/lib/marca";
import { enlaceWhatsApp } from "@/lib/publico";
import type { Categoria, Complemento, Producto } from "@/lib/types";
import { IconoWhatsApp } from "./IconoWhatsApp";
import { Personalizador } from "./Personalizador";

/** Especialidades del negocio: se muestran mientras el catálogo aún no tiene productos cargados. */
const ESPECIALIDADES = [
  { nombre: "Fresas con chocolate", texto: "Fresas frescas bañadas en chocolate, en cajas y ramos para regalar.", icono: Cherry, fondo: "from-rosa-500 to-rosa-700" },
  { nombre: "Pasteles", texto: "Pasteles personalizados para cumpleaños, aniversarios y celebraciones.", icono: Cake, fondo: "from-rosa-400 to-rosa-600" },
  { nombre: "Gelatinas artísticas", texto: "Gelatinas con flores y diseños hechos a mano, únicas en cada pedido.", icono: Dessert, fondo: "from-rosa-300 to-rosa-500" },
  { nombre: "Bocaditos", texto: "Bocaditos dulces para eventos, mesas de postres y reuniones.", icono: CakeSlice, fondo: "from-rosa-600 to-rosa-800" },
];

function TarjetaProducto({ p, categoria, onElegir }: { p: Producto; categoria?: string; onElegir: () => void }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rosa-100 transition duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-rosa-200/50">
      <button type="button" onClick={onElegir} className="relative block overflow-hidden" aria-label={`Ver ${p.nombre}`}>
        <Thumb src={p.imagenes[0]} alt={p.nombre} className="aspect-[4/3.4] w-full rounded-none transition duration-500 group-hover:scale-105" />
        {p.destacado && (
          <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-semibold text-rosa-700 shadow-sm">
            <Sparkles className="size-3" /> Más pedido
          </span>
        )}
      </button>
      <div className="flex flex-1 flex-col p-5">
        {categoria && <p className="text-xs font-semibold uppercase tracking-wider text-rosa-500">{categoria}</p>}
        <h3 className="mt-1 font-display text-xl font-semibold leading-snug text-stone-900">{p.nombre}</h3>
        {p.descripcion && <p className="mt-1.5 line-clamp-2 text-sm text-stone-600">{p.descripcion}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <p className="font-display text-2xl font-semibold text-stone-900">{fmtDinero(p.precio)}</p>
          <button
            type="button"
            onClick={onElegir}
            className="inline-flex items-center gap-1.5 rounded-full bg-rosa-50 px-4 py-2 text-sm font-semibold text-rosa-700 ring-1 ring-rosa-200 transition hover:bg-rosa-600 hover:text-white hover:ring-rosa-600"
          >
            {p.personalizable ? "Personalizar" : "Pedir"} <ArrowRight className="size-4" />
          </button>
        </div>
      </div>
    </article>
  );
}

export function Catalogo({
  productos,
  categorias,
  complementos,
  whatsapp,
}: {
  productos: Producto[];
  categorias: Categoria[];
  complementos: Complemento[];
  whatsapp: string;
}) {
  const [cat, setCat] = useState<number | "todas">("todas");
  const [elegido, setElegido] = useState<Producto | null>(null);
  const nombreCat = useMemo(() => new Map(categorias.map((c) => [c.id, c.nombre])), [categorias]);
  const conProductos = categorias.filter((c) => productos.some((p) => p.categoria_id === c.id));
  const lista = cat === "todas" ? productos : productos.filter((p) => p.categoria_id === cat);

  if (productos.length === 0)
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {ESPECIALIDADES.map((e) => (
          <article key={e.nombre} className="group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-rosa-100 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-rosa-200/50">
            <div className={cn("relative flex aspect-[4/3] items-center justify-center overflow-hidden bg-gradient-to-br", e.fondo)}>
              <div className="absolute -right-8 -top-8 size-32 rounded-full bg-white/15" />
              <div className="absolute -bottom-10 -left-6 size-36 rounded-full bg-white/10" />
              <e.icono className="relative size-16 text-white drop-shadow transition duration-500 group-hover:scale-110" strokeWidth={1.4} />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-display text-xl font-semibold text-stone-900">{e.nombre}</h3>
              <p className="mt-1.5 text-sm text-stone-600">{e.texto}</p>
              <a
                href={enlaceWhatsApp(whatsapp, `Hola, ${MARCA.nombre}. Me interesan sus ${e.nombre.toLowerCase()}. ¿Qué opciones y precios tienen?`)}
                target="_blank"
                rel="noreferrer"
                className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-semibold text-rosa-700 hover:text-rosa-800"
              >
                <IconoWhatsApp className="size-4" /> Consultar opciones
              </a>
            </div>
          </article>
        ))}
      </div>
    );

  return (
    <>
      {conProductos.length > 1 && (
        <div className="mb-8 flex flex-wrap justify-center gap-2" role="tablist" aria-label="Categorías">
          {[{ id: "todas" as const, nombre: "Todo" }, ...conProductos].map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              aria-selected={cat === c.id}
              onClick={() => setCat(c.id)}
              className={cn(
                "rounded-full px-5 py-2.5 text-sm font-semibold transition",
                cat === c.id ? "bg-rosa-600 text-white shadow-lg shadow-rosa-600/25" : "bg-white text-stone-700 ring-1 ring-rosa-100 hover:bg-rosa-50 hover:text-rosa-700",
              )}
            >
              {c.nombre}
            </button>
          ))}
        </div>
      )}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lista.map((p) => (
          <TarjetaProducto key={p.id} p={p} categoria={p.categoria_id ? nombreCat.get(p.categoria_id) : undefined} onElegir={() => setElegido(p)} />
        ))}
      </div>
      {elegido && <Personalizador key={elegido.id} producto={elegido} complementos={complementos} whatsapp={whatsapp} onCerrar={() => setElegido(null)} />}
    </>
  );
}
