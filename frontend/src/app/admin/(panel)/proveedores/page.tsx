"use client";

import { MessageCircle, Truck } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { linkWhatsApp } from "@/lib/format";
import type { Proveedor } from "@/lib/types";

export default function ProveedoresPage() {
  return (
    <ResourcePage<Proveedor>
      titulo="Proveedores"
      descripcion="A quién le compras la materia prima."
      endpoint="/api/proveedores"
      singular="proveedor"
      icono={<Truck className="size-6" />}
      columnas={[
        {
          header: "Proveedor",
          cell: (p) => (
            <div>
              <p className="font-medium text-stone-900">{p.nombre}</p>
              {p.ruc && <p className="text-xs text-stone-500">RUC {p.ruc}</p>}
            </div>
          ),
        },
        {
          header: "Contacto",
          cell: (p) => (
            <div className="text-sm">
              {p.telefono ? (
                <a href={linkWhatsApp(p.telefono)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-700 hover:underline">
                  <MessageCircle className="size-3.5" /> {p.telefono}
                </a>
              ) : (
                <span className="text-stone-400">—</span>
              )}
              {p.email && <p className="text-xs text-stone-500">{p.email}</p>}
            </div>
          ),
        },
        { header: "Notas", cell: (p) => <span className="line-clamp-2 text-stone-600">{p.notas || "—"}</span> },
      ]}
      campos={[
        { name: "nombre", label: "Nombre o razón social", tipo: "texto", requerido: true, completo: true },
        { name: "ruc", label: "RUC / Cédula", tipo: "texto", placeholder: "1790012345001", ayuda: "10 o 13 dígitos" },
        { name: "telefono", label: "Teléfono", tipo: "texto", placeholder: "0991234567" },
        { name: "email", label: "Correo", tipo: "email", completo: true },
        { name: "notas", label: "Notas", tipo: "area", placeholder: "Qué le compras, días de entrega, condiciones de pago…" },
        { name: "activo", label: "Activo", tipo: "switch" },
      ]}
      defaults={{ nombre: "", ruc: "", telefono: "", email: "", notas: "", activo: true }}
      nombreFila={(p) => p.nombre}
      buscar="Buscar por nombre, RUC o teléfono"
    />
  );
}
