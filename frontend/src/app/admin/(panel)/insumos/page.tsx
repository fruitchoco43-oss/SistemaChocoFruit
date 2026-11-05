"use client";

import { AlertTriangle, History, Package } from "lucide-react";
import Link from "next/link";
import { ResourcePage } from "@/components/ResourcePage";
import { Badge } from "@/components/ui";
import { fmtDinero, fmtNumero, UNIDADES } from "@/lib/format";
import type { Insumo } from "@/lib/types";

function NivelStock({ i }: { i: Insumo }) {
  const bajo = i.stock_actual <= i.stock_minimo;
  const pct = i.stock_minimo > 0 ? Math.min(100, (i.stock_actual / (i.stock_minimo * 3)) * 100) : 100;
  return (
    <div className="min-w-32">
      <div className="flex items-center gap-2">
        <span className="font-semibold tabular-nums text-stone-900">
          {fmtNumero(i.stock_actual)} <span className="font-normal text-stone-500">{i.unidad}</span>
        </span>
        {bajo && (
          <Badge tono="rojo">
            <AlertTriangle className="size-3" /> Bajo
          </Badge>
        )}
      </div>
      <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-stone-100" aria-hidden>
        <div className={bajo ? "h-full rounded-full bg-fresa-500" : "h-full rounded-full bg-cacao-400"} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function InsumosPage() {
  return (
    <ResourcePage<Insumo>
      titulo="Insumos"
      descripcion="Materia prima y su stock. El stock sube con las compras y baja con los movimientos de salida."
      endpoint="/api/insumos"
      singular="insumo"
      icono={<Package className="size-6" />}
      columnas={[
        { header: "Insumo", cell: (i) => <span className="font-medium text-stone-900">{i.nombre}</span> },
        { header: "Stock", cell: (i) => <NivelStock i={i} /> },
        {
          header: "Mínimo",
          className: "tabular-nums",
          cell: (i) => (
            <span className="text-stone-600">
              {fmtNumero(i.stock_minimo)} {i.unidad}
            </span>
          ),
        },
        {
          header: "Costo promedio",
          className: "text-right tabular-nums",
          cell: (i) => (
            <span>
              {fmtDinero(i.costo_promedio)}
              <span className="text-xs text-stone-500"> /{i.unidad}</span>
            </span>
          ),
        },
        { header: "Valor en stock", className: "text-right tabular-nums", cell: (i) => fmtDinero(Math.max(0, i.stock_actual) * i.costo_promedio) },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true, completo: true, placeholder: "Chocolate de cobertura semiamargo" },
        { name: "unidad", label: "Unidad de medida", tipo: "select", requerido: true, opciones: UNIDADES.map((u) => ({ valor: u, label: u })) },
        { name: "stock_minimo", label: "Stock mínimo", tipo: "numero", step: "0.001", min: 0, ayuda: "Te avisamos cuando baje de esta cantidad." },
        { name: "activo", label: "Activo", tipo: "switch" },
      ]}
      defaults={{ nombre: "", unidad: "kg", stock_minimo: 0, activo: true }}
      nombreFila={(i) => i.nombre}
      accionesFila={(i) => (
        <Link
          href={`/admin/movimientos?insumo=${i.id}`}
          title="Ver movimientos"
          aria-label="Ver movimientos"
          className="inline-flex size-8 items-center justify-center rounded-lg text-stone-500 hover:bg-stone-100 hover:text-stone-900"
        >
          <History className="size-4" />
        </Link>
      )}
      textoVacio="Registra tus insumos (chocolate, fresas, cajas…) y luego carga tus compras."
    />
  );
}
