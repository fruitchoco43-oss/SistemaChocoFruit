"use client";

import { ChevronDown, Gift, PartyPopper, PenLine, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge, Button, Field, IconButton, Input, Modal, Segmentado, Select, Textarea, cn } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { ESTADOS_PEDIDO, fmtDinero, isoALocal, localAIso } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Complemento, EstadoPedido, Maquina, MetodoPago, Pedido, Personalizacion, Producto, TipoPedido, Zona } from "@/lib/types";

interface Linea {
  key: number;
  producto_id: number | null;
  maquina_id: number | null;
  descripcion: string;
  cantidad: string;
  precio_base: string;
  pers: Required<Personalizacion>;
  abierta: boolean;
}

let sec = 0;
const persVacia = (): Required<Personalizacion> => ({ nombre: "", dedicatoria: "", colores: [], complementos: [] });
const extra = (l: Linea) => l.pers.complementos.reduce((s, c) => s + c.precio, 0);
const precioUnit = (l: Linea) => (Number(l.precio_base) || 0) + extra(l);
const subtotalLinea = (l: Linea) => precioUnit(l) * (Number(l.cantidad) || 0);

function lineaDesde(p: Partial<Linea>): Linea {
  return {
    key: ++sec,
    producto_id: null,
    maquina_id: null,
    descripcion: "",
    cantidad: "1",
    precio_base: "",
    pers: persVacia(),
    abierta: false,
    ...p,
  };
}

const CAB_VACIA = {
  tipo: "producto" as TipoPedido,
  cliente_nombre: "",
  cliente_telefono: "",
  fecha_entrega: "",
  zona_id: "",
  direccion: "",
  costo_envio: "",
  monto_pagado: "",
  metodo_pago: "transferencia" as MetodoPago,
  estado: "pendiente" as EstadoPedido,
  notas: "",
};

function cabDesde(pedido: Pedido | null) {
  if (!pedido) return CAB_VACIA;
  return {
    tipo: pedido.tipo,
    cliente_nombre: pedido.cliente_nombre,
    cliente_telefono: pedido.cliente_telefono,
    fecha_entrega: isoALocal(pedido.fecha_entrega),
    zona_id: pedido.zona_id ? String(pedido.zona_id) : "",
    direccion: pedido.direccion ?? "",
    costo_envio: String(pedido.costo_envio),
    monto_pagado: pedido.monto_pagado ? String(pedido.monto_pagado) : "",
    metodo_pago: pedido.metodo_pago,
    estado: pedido.estado,
    notas: pedido.notas ?? "",
  };
}

function lineasDesde(pedido: Pedido | null): Linea[] {
  return (pedido?.items ?? []).map((it) => {
    const pers = { ...persVacia(), ...(it.personalizacion ?? {}) } as Required<Personalizacion>;
    const ext = pers.complementos.reduce((s, c) => s + c.precio, 0);
    return lineaDesde({
      producto_id: it.producto_id,
      maquina_id: it.maquina_id,
      descripcion: it.descripcion,
      cantidad: String(it.cantidad),
      precio_base: String(Math.round((it.precio_unitario - ext) * 100) / 100),
      pers,
    });
  });
}

/** Se monta solo mientras está abierto (el padre lo renderiza condicionalmente con `key`). */
export function PedidoForm({
  pedido,
  onCerrar,
  onGuardado,
}: {
  pedido: Pedido | null;
  onCerrar: () => void;
  onGuardado: (p: Pedido) => void;
}) {
  const { data: productos } = useApi<Producto[]>("/api/productos?activo=true", ["productos"]);
  const { data: maquinas } = useApi<Maquina[]>("/api/maquinas?activo=true", ["maquinas"]);
  const { data: zonas } = useApi<Zona[]>("/api/zonas?activo=true", ["zonas"]);
  const { data: complementos } = useApi<Complemento[]>("/api/complementos?activo=true", ["complementos"]);

  const [cab, setCab] = useState(() => cabDesde(pedido));
  const [lineas, setLineas] = useState<Linea[]>(() => lineasDesde(pedido));
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const coloresDe = (l: Linea) => productos?.find((x) => x.id === l.producto_id)?.colores_disponibles ?? [];

  const subtotal = lineas.reduce((s, l) => s + subtotalLinea(l), 0);
  const envio = Number(cab.costo_envio) || 0;
  const total = subtotal + envio;
  const pagado = Number(cab.monto_pagado) || 0;
  const saldo = Math.max(0, total - pagado);

  const setL = (key: number, cambios: Partial<Linea>) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, ...cambios } : l)));
  const setPers = (l: Linea, cambios: Partial<Personalizacion>) => setL(l.key, { pers: { ...l.pers, ...cambios } });

  function agregarProducto(id: string) {
    const p = productos?.find((x) => String(x.id) === id);
    if (!p) return;
    setLineas((ls) => [
      ...ls,
      lineaDesde({
        producto_id: p.id,
        descripcion: p.nombre,
        precio_base: String(p.precio),
        abierta: p.personalizable,
      }),
    ]);
  }

  function agregarMaquina(id: string) {
    const m = maquinas?.find((x) => String(x.id) === id);
    if (!m) return;
    setLineas((ls) => [...ls, lineaDesde({ maquina_id: m.id, descripcion: `Alquiler ${m.nombre} (${m.duracion_horas} h)`, precio_base: String(m.precio) })]);
  }

  function elegirZona(id: string) {
    const z = zonas?.find((x) => String(x.id) === id);
    setCab((c) => ({ ...c, zona_id: id, costo_envio: z ? String(z.costo_envio) : c.costo_envio }));
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrores({});
    const body = {
      tipo: cab.tipo,
      cliente_nombre: cab.cliente_nombre.trim(),
      cliente_telefono: cab.cliente_telefono.trim(),
      fecha_entrega: localAIso(cab.fecha_entrega),
      zona_id: cab.zona_id ? Number(cab.zona_id) : null,
      direccion: cab.direccion.trim() || null,
      costo_envio: cab.costo_envio === "" ? null : Number(cab.costo_envio),
      monto_pagado: pagado,
      metodo_pago: cab.metodo_pago,
      estado: cab.estado,
      notas: cab.notas.trim() || null,
      items: lineas.map((l) => {
        const p = l.pers;
        const tienePers = p.nombre || p.dedicatoria || p.colores.length || p.complementos.length;
        return {
          producto_id: l.producto_id,
          maquina_id: l.maquina_id,
          descripcion: l.descripcion.trim(),
          cantidad: Number(l.cantidad) || 0,
          precio_unitario: Math.round(precioUnit(l) * 100) / 100,
          personalizacion: tienePers
            ? { nombre: p.nombre.trim() || undefined, dedicatoria: p.dedicatoria.trim() || undefined, colores: p.colores, complementos: p.complementos }
            : null,
        };
      }),
    };
    try {
      const r = pedido
        ? await api<Pedido>(`/api/pedidos/${pedido.id}`, { method: "PUT", body })
        : await api<Pedido>("/api/pedidos", { method: "POST", body });
      toast.success(pedido ? `Pedido #${r.id} actualizado` : `Pedido #${r.id} registrado`);
      onGuardado(r);
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.fieldErrors);
        toast.error(err.fieldErrors.items ? "Agrega al menos un producto" : err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  const err = (k: string) => errores[k];

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={pedido ? `Pedido #${pedido.id}` : "Nuevo pedido"}
      descripcion={pedido ? undefined : "Registra el pedido que llegó por WhatsApp."}
      ancho="xl"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button type="submit" form="form-pedido" cargando={guardando}>
            {pedido ? "Guardar cambios" : "Registrar pedido"} · {fmtDinero(total)}
          </Button>
        </>
      }
    >
      <form id="form-pedido" onSubmit={guardar} noValidate className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* ---------------- Productos */}
        <div className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Segmentado
              valor={cab.tipo}
              onChange={(t) => setCab({ ...cab, tipo: t })}
              opciones={[
                { valor: "producto", label: "Productos" },
                { valor: "alquiler", label: "Alquiler" },
              ]}
            />
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            {cab.tipo === "producto" ? (
              <Select value="" onChange={(e) => agregarProducto(e.target.value)} aria-label="Agregar producto">
                <option value="">Agregar producto del catálogo…</option>
                {productos?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} — {fmtDinero(p.precio)}
                  </option>
                ))}
              </Select>
            ) : (
              <Select value="" onChange={(e) => agregarMaquina(e.target.value)} aria-label="Agregar máquina">
                <option value="">Agregar máquina…</option>
                {maquinas?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre} — {fmtDinero(m.precio)} / {m.duracion_horas} h
                  </option>
                ))}
              </Select>
            )}
            <Button
              type="button"
              variante="secundario"
              onClick={() => setLineas((ls) => [...ls, lineaDesde({ abierta: false })])}
              icono={<PenLine className="size-4" />}
            >
              Línea libre
            </Button>
          </div>

          {lineas.length === 0 ? (
            <div className={cn("rounded-2xl border-2 border-dashed px-6 py-10 text-center", err("items") ? "border-fresa-300 bg-fresa-50/50" : "border-stone-200")}>
              {cab.tipo === "producto" ? <Gift className="mx-auto size-8 text-stone-300" /> : <PartyPopper className="mx-auto size-8 text-stone-300" />}
              <p className="mt-2 text-sm font-medium text-stone-700">Aún no hay productos en el pedido</p>
              <p className="text-xs text-stone-500">Elige del catálogo o agrega una línea libre.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {lineas.map((l, idx) => {
                const e = (c: string) => !!errores[`items.${idx}.${c}`];
                return (
                  <li key={l.key} className="rounded-2xl bg-white ring-1 ring-stone-200">
                    <div className="grid grid-cols-[1fr_auto] gap-2 p-3 sm:grid-cols-[1fr_72px_110px_90px_auto] sm:items-center">
                      <Input
                        aria-label="Descripción"
                        value={l.descripcion}
                        onChange={(ev) => setL(l.key, { descripcion: ev.target.value })}
                        placeholder="Descripción"
                        invalido={e("descripcion")}
                        className="col-span-2 sm:col-span-1"
                      />
                      <Input
                        aria-label="Cantidad"
                        type="number"
                        min={1}
                        step="1"
                        value={l.cantidad}
                        onChange={(ev) => setL(l.key, { cantidad: ev.target.value })}
                        invalido={e("cantidad")}
                      />
                      <Input
                        aria-label="Precio unitario"
                        type="number"
                        min={0}
                        step="0.01"
                        prefijo="$"
                        value={l.precio_base}
                        onChange={(ev) => setL(l.key, { precio_base: ev.target.value })}
                        invalido={e("precio_unitario")}
                      />
                      <p className="text-right text-sm font-semibold tabular-nums">{fmtDinero(subtotalLinea(l))}</p>
                      <div className="flex justify-end">
                        {cab.tipo === "producto" && (
                          <IconButton
                            label="Personalización"
                            onClick={() => setL(l.key, { abierta: !l.abierta })}
                            className={cn(l.abierta && "bg-cacao-50 text-cacao-700")}
                          >
                            <ChevronDown className={cn("size-4 transition-transform", l.abierta && "rotate-180")} />
                          </IconButton>
                        )}
                        <IconButton label="Quitar" onClick={() => setLineas((ls) => ls.filter((x) => x.key !== l.key))} className="hover:bg-fresa-50 hover:text-fresa-600">
                          <Trash2 className="size-4" />
                        </IconButton>
                      </div>
                    </div>

                    {!l.abierta && (l.pers.nombre || l.pers.dedicatoria || l.pers.colores.length > 0 || l.pers.complementos.length > 0) && (
                      <div className="flex flex-wrap gap-1.5 px-3 pb-3">
                        {l.pers.nombre && <Badge tono="violeta">Nombre: {l.pers.nombre}</Badge>}
                        {l.pers.dedicatoria && <Badge tono="violeta">Con dedicatoria</Badge>}
                        {l.pers.colores.map((c) => (
                          <Badge key={c}>{c}</Badge>
                        ))}
                        {l.pers.complementos.map((c) => (
                          <Badge key={c.id} tono="cacao">
                            + {c.nombre}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {l.abierta && (
                      <div className="grid gap-3 border-t border-stone-100 bg-cacao-50/40 p-3 sm:grid-cols-2">
                        <Field label="Nombre a incluir">
                          <Input value={l.pers.nombre} onChange={(ev) => setPers(l, { nombre: ev.target.value })} placeholder="Ej.: María" />
                        </Field>
                        <Field label="Colores">
                          {coloresDe(l).length ? (
                            <div className="flex flex-wrap gap-1.5">
                              {coloresDe(l).map((c) => {
                                const on = l.pers.colores.includes(c);
                                return (
                                  <button
                                    key={c}
                                    type="button"
                                    onClick={() => setPers(l, { colores: on ? l.pers.colores.filter((x) => x !== c) : [...l.pers.colores, c] })}
                                    className={cn(
                                      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                                      on ? "bg-cacao-700 text-white ring-cacao-700" : "bg-white text-stone-700 ring-stone-200 hover:ring-stone-300",
                                    )}
                                  >
                                    <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: c }} /> {c}
                                  </button>
                                );
                              })}
                            </div>
                          ) : (
                            <Input
                              value={l.pers.colores.join(", ")}
                              onChange={(ev) => setPers(l, { colores: ev.target.value.split(",").map((x) => x.trim()).filter(Boolean) })}
                              placeholder="rojo, blanco"
                            />
                          )}
                        </Field>
                        <Field label="Dedicatoria" className="sm:col-span-2">
                          <Textarea rows={2} value={l.pers.dedicatoria} onChange={(ev) => setPers(l, { dedicatoria: ev.target.value })} placeholder="Feliz cumpleaños…" />
                        </Field>
                        {!!complementos?.length && (
                          <Field label="Complementos" ayuda="Se suman al precio unitario." className="sm:col-span-2">
                            <div className="flex flex-wrap gap-1.5">
                              {complementos.map((c) => {
                                const on = l.pers.complementos.some((x) => x.id === c.id);
                                return (
                                  <button
                                    key={c.id}
                                    type="button"
                                    onClick={() =>
                                      setPers(l, {
                                        complementos: on
                                          ? l.pers.complementos.filter((x) => x.id !== c.id)
                                          : [...l.pers.complementos, { id: c.id, nombre: c.nombre, precio: c.precio }],
                                      })
                                    }
                                    className={cn(
                                      "rounded-full px-2.5 py-1 text-xs font-medium ring-1 transition-colors",
                                      on ? "bg-fresa-600 text-white ring-fresa-600" : "bg-white text-stone-700 ring-stone-200 hover:ring-stone-300",
                                    )}
                                  >
                                    {c.nombre} +{fmtDinero(c.precio)}
                                  </button>
                                );
                              })}
                            </div>
                          </Field>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}

          <Field label="Notas internas" htmlFor="p-notas">
            <Textarea id="p-notas" rows={2} value={cab.notas} onChange={(e) => setCab({ ...cab, notas: e.target.value })} placeholder="Referencias, hora exacta, quién recibe…" />
          </Field>
        </div>

        {/* ---------------- Cliente, entrega y pago */}
        <div className="space-y-4">
          <section className="space-y-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
            <h3 className="text-sm font-semibold text-stone-900">Cliente</h3>
            <Field label="Nombre" requerido error={err("cliente_nombre")} htmlFor="p-nom">
              <Input id="p-nom" value={cab.cliente_nombre} onChange={(e) => setCab({ ...cab, cliente_nombre: e.target.value })} invalido={!!err("cliente_nombre")} />
            </Field>
            <Field label="WhatsApp / teléfono" requerido error={err("cliente_telefono") && "Teléfono inválido"} htmlFor="p-tel">
              <Input
                id="p-tel"
                inputMode="tel"
                value={cab.cliente_telefono}
                onChange={(e) => setCab({ ...cab, cliente_telefono: e.target.value })}
                placeholder="0991234567"
                invalido={!!err("cliente_telefono")}
              />
            </Field>
          </section>

          <section className="space-y-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
            <h3 className="text-sm font-semibold text-stone-900">Entrega</h3>
            <Field label="Fecha y hora" htmlFor="p-fecha">
              <Input id="p-fecha" type="datetime-local" value={cab.fecha_entrega} onChange={(e) => setCab({ ...cab, fecha_entrega: e.target.value })} />
            </Field>
            <Field label="Zona" htmlFor="p-zona">
              <Select id="p-zona" value={cab.zona_id} onChange={(e) => elegirZona(e.target.value)}>
                <option value="">Retiro en local / sin zona</option>
                {zonas?.map((z) => (
                  <option key={z.id} value={z.id}>
                    {z.nombre} — {z.costo_envio ? fmtDinero(z.costo_envio) : "gratis"}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Dirección" htmlFor="p-dir">
              <Textarea id="p-dir" rows={2} value={cab.direccion} onChange={(e) => setCab({ ...cab, direccion: e.target.value })} />
            </Field>
          </section>

          <section className="space-y-3 rounded-2xl bg-stone-50 p-4 ring-1 ring-stone-200/70">
            <h3 className="text-sm font-semibold text-stone-900">Pago y estado</h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Método" htmlFor="p-met">
                <Select id="p-met" value={cab.metodo_pago} onChange={(e) => setCab({ ...cab, metodo_pago: e.target.value as MetodoPago })}>
                  <option value="transferencia">Transferencia</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="tarjeta">Tarjeta</option>
                </Select>
              </Field>
              <Field label="Estado" htmlFor="p-est">
                <Select id="p-est" value={cab.estado} onChange={(e) => setCab({ ...cab, estado: e.target.value as EstadoPedido })}>
                  {Object.entries(ESTADOS_PEDIDO).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </Select>
              </Field>
            </div>
            <Field label="Monto recibido" htmlFor="p-pag" error={err("monto_pagado")}>
              <div className="flex gap-2">
                <Input id="p-pag" type="number" min={0} step="0.01" prefijo="$" value={cab.monto_pagado} onChange={(e) => setCab({ ...cab, monto_pagado: e.target.value })} placeholder="0.00" />
                <Button
                  type="button"
                  variante="secundario"
                  tam="sm"
                  className="h-10 shrink-0"
                  title="Anticipo del 50% para confirmar el pedido"
                  onClick={() => setCab({ ...cab, monto_pagado: (Math.round(total * 50) / 100).toFixed(2) })}
                >
                  50%
                </Button>
                <Button type="button" variante="secundario" tam="sm" className="h-10 shrink-0" onClick={() => setCab({ ...cab, monto_pagado: total.toFixed(2) })}>
                  Total
                </Button>
              </div>
            </Field>

            <dl className="space-y-1.5 border-t border-stone-200 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-stone-500">Subtotal</dt>
                <dd className="tabular-nums">{fmtDinero(subtotal)}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-stone-500">Envío</dt>
                <dd className="w-28">
                  <Input
                    aria-label="Costo de envío"
                    type="number"
                    min={0}
                    step="0.01"
                    prefijo="$"
                    value={cab.costo_envio}
                    onChange={(e) => setCab({ ...cab, costo_envio: e.target.value })}
                    className="h-8 text-right"
                    placeholder="0.00"
                  />
                </dd>
              </div>
              <div className="flex justify-between pt-1 text-base font-bold text-stone-900">
                <dt>Total</dt>
                <dd className="tabular-nums">{fmtDinero(total)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-stone-500">Saldo pendiente</dt>
                <dd className={cn("font-semibold tabular-nums", saldo > 0 ? "text-fresa-700" : "text-emerald-700")}>
                  {saldo > 0 ? fmtDinero(saldo) : "Pagado"}
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </form>
    </Modal>
  );
}
