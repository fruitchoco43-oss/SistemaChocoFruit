"use client";

import { Check, Minus, Plus, Store, Truck } from "lucide-react";
import { useState } from "react";
import { Field, Input, Modal, Textarea, Thumb, cn } from "@/components/ui";
import { fmtDinero, hoyISO } from "@/lib/format";
import { MARCA } from "@/lib/marca";
import { enlaceWhatsApp } from "@/lib/publico";
import type { Complemento, Producto } from "@/lib/types";
import { IconoWhatsApp } from "./IconoWhatsApp";

export function Personalizador({
  producto,
  complementos,
  whatsapp,
  onCerrar,
}: {
  producto: Producto;
  complementos: Complemento[];
  whatsapp: string;
  onCerrar: () => void;
}) {
  const [cantidad, setCantidad] = useState(1);
  const [colores, setColores] = useState<string[]>([]);
  const [nombre, setNombre] = useState("");
  const [dedicatoria, setDedicatoria] = useState("");
  const [extras, setExtras] = useState<number[]>([]);
  const [entrega, setEntrega] = useState<"domicilio" | "retiro">("domicilio");
  const [sector, setSector] = useState("");
  const [fecha, setFecha] = useState("");
  const [hoy] = useState(hoyISO);

  const elegidos = complementos.filter((c) => extras.includes(c.id));
  const unitario = producto.precio + elegidos.reduce((s, c) => s + c.precio, 0);
  const total = unitario * cantidad;
  const p = producto.personalizable;

  const detalles = [
    `Producto: ${producto.nombre}`,
    `Cantidad: ${cantidad}`,
    p && colores.length ? `Colores: ${colores.join(", ")}` : "",
    p && nombre.trim() ? `Nombre a incluir: ${nombre.trim()}` : "",
    p && dedicatoria.trim() ? `Dedicatoria: "${dedicatoria.trim()}"` : "",
    elegidos.length ? `Complementos: ${elegidos.map((c) => `${c.nombre} (${fmtDinero(c.precio)})`).join(", ")}` : "",
    `Entrega: ${entrega === "domicilio" ? `A domicilio${sector.trim() ? ` en ${sector.trim()}` : ""}` : "Retiro en el local"}`,
    fecha ? `Fecha deseada: ${new Date(`${fecha}T12:00:00`).toLocaleDateString("es-EC", { weekday: "long", day: "numeric", month: "long" })}` : "",
  ].filter(Boolean);
  const mensaje = [
    `Hola, ${MARCA.nombre}. Quiero hacer un pedido:`,
    "",
    ...detalles,
    "",
    `Total referencial: ${fmtDinero(total)}${entrega === "domicilio" ? " (más envío)" : ""}`,
    "Entiendo que se requiere el 50% de anticipo para confirmar el pedido.",
  ].join("\n");



  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={p ? "Personaliza tu regalo" : "Arma tu pedido"}
      ancho="lg"
      pie={
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs text-stone-500">Total referencial{entrega === "domicilio" ? " (sin envío)" : ""}</p>
            <p className="font-display text-2xl font-semibold text-stone-900">{fmtDinero(total)}</p>
          </div>
          <a
            href={enlaceWhatsApp(whatsapp, mensaje)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-rosa-600 px-6 py-3 font-semibold text-white shadow-lg shadow-rosa-600/25 transition hover:bg-rosa-700"
          >
            <IconoWhatsApp className="size-5" /> Enviar pedido por WhatsApp
          </a>
        </div>
      }
    >
      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <div>
          <Thumb src={producto.imagenes[0]} alt={producto.nombre} className="aspect-square w-full rounded-2xl" />
          <h3 className="mt-3 font-display text-xl font-semibold text-stone-900">{producto.nombre}</h3>
          <p className="text-lg font-semibold text-rosa-700">{fmtDinero(producto.precio)}</p>
          {producto.descripcion && <p className="mt-1 text-sm text-stone-600">{producto.descripcion}</p>}
        </div>

        <div className="space-y-5">
          <Field label="Cantidad">
            <div className="inline-flex w-fit items-center self-start rounded-full bg-rosa-50 p-1 ring-1 ring-rosa-100">
              <button type="button" aria-label="Menos" onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="flex size-9 items-center justify-center rounded-full text-rosa-700 hover:bg-white">
                <Minus className="size-4" />
              </button>
              <span className="w-10 text-center font-semibold tabular-nums">{cantidad}</span>
              <button type="button" aria-label="Más" onClick={() => setCantidad(cantidad + 1)} className="flex size-9 items-center justify-center rounded-full text-rosa-700 hover:bg-white">
                <Plus className="size-4" />
              </button>
            </div>
          </Field>

          {p && producto.colores_disponibles.length > 0 && (
            <Field label="Colores">
              <div className="flex flex-wrap gap-2">
                {producto.colores_disponibles.map((c) => {
                  const on = colores.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setColores(on ? colores.filter((x) => x !== c) : [...colores, c])}
                      className={cn(
                        "inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-3.5 text-sm font-medium ring-1 transition",
                        on ? "bg-rosa-600 text-white ring-rosa-600" : "bg-white text-stone-700 ring-stone-200 hover:ring-rosa-300",
                      )}
                    >
                      <span className="size-5 rounded-full ring-2 ring-white" style={{ background: c }} />
                      {c}
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          {p && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre a incluir" htmlFor="pz-nombre">
                <Input id="pz-nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej.: Valentina" maxLength={40} />
              </Field>
              <Field label="Dedicatoria" className="sm:col-span-2" htmlFor="pz-ded">
                <Textarea id="pz-ded" rows={2} value={dedicatoria} onChange={(e) => setDedicatoria(e.target.value)} placeholder="Escribe el mensaje para la tarjeta" maxLength={240} />
              </Field>
            </div>
          )}

          {complementos.length > 0 && (
            <Field label="Complementos" ayuda="Se suman al precio de cada unidad.">
              <div className="flex flex-wrap gap-2">
                {complementos.map((c) => {
                  const on = extras.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setExtras(on ? extras.filter((x) => x !== c.id) : [...extras, c.id])}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-medium ring-1 transition",
                        on ? "bg-rosa-600 text-white ring-rosa-600" : "bg-white text-stone-700 ring-stone-200 hover:ring-rosa-300",
                      )}
                    >
                      {on && <Check className="size-3.5" />}
                      {c.nombre} <span className={on ? "text-rosa-100" : "text-stone-400"}>+{fmtDinero(c.precio)}</span>
                    </button>
                  );
                })}
              </div>
            </Field>
          )}

          <Field label="Entrega">
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  { v: "domicilio", label: "A domicilio", icono: Truck },
                  { v: "retiro", label: "Retiro en el local", icono: Store },
                ] as const
              ).map((o) => (
                <button
                  key={o.v}
                  type="button"
                  aria-pressed={entrega === o.v}
                  onClick={() => setEntrega(o.v)}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold ring-1 transition",
                    entrega === o.v ? "bg-rosa-50 text-rosa-800 ring-2 ring-rosa-500" : "bg-white text-stone-600 ring-stone-200 hover:ring-rosa-300",
                  )}
                >
                  <o.icono className="size-4" /> {o.label}
                </button>
              ))}
            </div>
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            {entrega === "domicilio" && (
              <Field label="Sector" ayuda="El envío se calcula según tu sector." htmlFor="pz-sector">
                <Input id="pz-sector" value={sector} onChange={(e) => setSector(e.target.value)} placeholder="Ej.: Cumbayá" />
              </Field>
            )}
            <Field label="Fecha deseada" htmlFor="pz-fecha">
              <Input id="pz-fecha" type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </Field>
          </div>

          <p className="rounded-xl bg-rosa-50 px-4 py-3 text-sm text-rosa-900 ring-1 ring-rosa-100">
            Al enviar, se abrirá WhatsApp con tu pedido listo. Te confirmaremos disponibilidad y el costo de envío. Para registrar el pedido se requiere el <b>50% de anticipo</b>.
          </p>
        </div>
      </div>
    </Modal>
  );
}
