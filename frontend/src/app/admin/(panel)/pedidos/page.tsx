"use client";

import { CalendarClock, ClipboardList, MapPin, MessageCircle, Pencil, Plus, Trash2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, ConfirmDialog, EmptyState, IconButton, Input, PageHeader, SearchInput, Segmentado, Skeleton, cn } from "@/components/ui";
import { api, ApiError, qs } from "@/lib/api";
import { ESTADOS_PAGO, ESTADOS_PEDIDO, fmtDinero, fmtFecha, linkWhatsApp } from "@/lib/format";
import { useApi, useDebounce } from "@/lib/hooks";
import type { EstadoPedido, Pedido } from "@/lib/types";
import { PedidoForm } from "./PedidoForm";

const SELECT_ESTADO: Record<EstadoPedido, string> = {
  pendiente: "bg-amber-50 text-amber-800 ring-amber-200",
  confirmado: "bg-sky-50 text-sky-800 ring-sky-200",
  en_preparacion: "bg-violet-50 text-violet-800 ring-violet-200",
  entregado: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  cancelado: "bg-stone-100 text-stone-600 ring-stone-200",
};

const VIVO_PEDIDOS = ["pedidos", "zonas"];

function mensajeCliente(p: Pedido): string {
  const lineas = p.items.map((i) => `• ${i.cantidad}× ${i.descripcion} — ${fmtDinero(i.precio_unitario * i.cantidad)}`);
  const saldo = p.total - p.monto_pagado;
  const anticipo = Math.round(p.total * 50) / 100;
  const faltaAnticipo = anticipo - p.monto_pagado;
  return [
    `¡Hola ${p.cliente_nombre.split(" ")[0]}! Este es el resumen de tu pedido #${p.id}:`,
    "",
    ...lineas,
    p.costo_envio ? `• Envío${p.zona_nombre ? ` (${p.zona_nombre})` : ""} — ${fmtDinero(p.costo_envio)}` : "",
    "",
    `*Total: ${fmtDinero(p.total)}*`,
    p.monto_pagado > 0 ? `Recibido: ${fmtDinero(p.monto_pagado)}` : "",
    faltaAnticipo > 0.009 ? `Para confirmar tu pedido necesitamos el 50% de anticipo: *${fmtDinero(faltaAnticipo)}*` : "",
    saldo > 0.009 ? `Saldo pendiente: ${fmtDinero(saldo)}` : "Pago completo",
    p.fecha_entrega ? `\nEntrega: ${fmtFecha(p.fecha_entrega, true)}` : "",
  ]
    .filter((x) => x !== "")
    .join("\n");
}

function Contenido() {
  const nuevo = useSearchParams().get("nuevo") === "1";
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<"todos" | EstadoPedido>("todos");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const q = useDebounce(busqueda);
  const { data, cargando, recargar, setData } = useApi<Pedido[]>(`/api/pedidos${qs({ q, desde, hasta })}`, VIVO_PEDIDOS);

  const [form, setForm] = useState<{ abierto: boolean; pedido: Pedido | null }>({ abierto: nuevo, pedido: null });
  const [borrar, setBorrar] = useState<Pedido | null>(null);
  const [borrando, setBorrando] = useState(false);

  const cuentas = useMemo(() => {
    const c: Record<string, number> = { todos: data?.length ?? 0 };
    for (const p of data ?? []) c[p.estado] = (c[p.estado] ?? 0) + 1;
    return c;
  }, [data]);
  const lista = estado === "todos" ? data : data?.filter((p) => p.estado === estado);

  async function cambiarEstado(p: Pedido, nuevo: EstadoPedido) {
    setData((d) => d?.map((x) => (x.id === p.id ? { ...x, estado: nuevo } : x)) ?? d);
    try {
      await api(`/api/pedidos/${p.id}/estado`, { method: "PATCH", body: { estado: nuevo } });
      toast.success(`Pedido #${p.id}: ${ESTADOS_PEDIDO[nuevo].label}`);
    } catch (err) {
      setData((d) => d?.map((x) => (x.id === p.id ? { ...x, estado: p.estado } : x)) ?? d);
      toast.error(err instanceof ApiError ? err.message : "No se pudo cambiar el estado");
    }
  }

  async function eliminar() {
    if (!borrar) return;
    setBorrando(true);
    try {
      await api(`/api/pedidos/${borrar.id}`, { method: "DELETE" });
      toast.success(`Pedido #${borrar.id} eliminado`);
      setBorrar(null);
      recargar();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <PageHeader
        titulo="Pedidos"
        descripcion="Pedidos que llegan por WhatsApp. Registra, cobra y sigue cada entrega."
        acciones={
          <Button onClick={() => setForm({ abierto: true, pedido: null })} icono={<Plus className="size-4" />}>
            Nuevo pedido
          </Button>
        }
      />

      <Card>
        <div className="space-y-3 border-b border-stone-100 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <SearchInput value={busqueda} onChange={setBusqueda} placeholder="Cliente, teléfono o #pedido" className="lg:w-80" />
            <div className="flex min-w-0 items-center gap-2 text-sm text-stone-500">
              <CalendarClock className="size-4 shrink-0" />
              <span className="hidden sm:inline">Entrega</span>
              <div className="min-w-0 flex-1 sm:flex-none">
                <Input type="date" aria-label="Entrega desde" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 min-w-0 sm:w-auto" />
              </div>
              <span>–</span>
              <div className="min-w-0 flex-1 sm:flex-none">
                <Input type="date" aria-label="Entrega hasta" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 min-w-0 sm:w-auto" />
              </div>
            </div>
          </div>
          <Segmentado
            valor={estado}
            onChange={setEstado}
            opciones={[
              { valor: "todos", label: "Todos", cuenta: cuentas.todos },
              ...(Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]).map((e) => ({ valor: e, label: ESTADOS_PEDIDO[e].label, cuenta: cuentas[e] ?? 0 })),
            ]}
          />
        </div>

        {cargando && !data ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16" />
            ))}
          </div>
        ) : !lista?.length ? (
          <EmptyState
            icono={<ClipboardList className="size-6" />}
            titulo={data?.length ? "No hay pedidos con este filtro" : "Aún no hay pedidos"}
            texto={data?.length ? "Prueba con otro estado o fecha." : "Cuando un cliente te escriba por WhatsApp, registra aquí su pedido."}
            accion={
              !data?.length && (
                <Button onClick={() => setForm({ abierto: true, pedido: null })} icono={<Plus className="size-4" />}>
                  Registrar primer pedido
                </Button>
              )
            }
          />
        ) : (
          <ul className={cn("divide-y divide-stone-100 transition-opacity", cargando && "opacity-60")}>
            {lista.map((p) => {
              const pago = ESTADOS_PAGO[p.estado_pago];
              return (
                <li key={p.id} className="grid gap-3 p-4 hover:bg-cacao-50/30 md:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto_auto] md:items-center">
                  {/* Cliente */}
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 rounded-lg bg-stone-100 px-2 py-1 text-xs font-bold tabular-nums text-stone-600">#{p.id}</span>
                    <div className="min-w-0">
                      <button onClick={() => setForm({ abierto: true, pedido: p })} className="block truncate text-left font-semibold text-stone-900 hover:text-cacao-700">
                        {p.cliente_nombre}
                      </button>
                      <a
                        href={linkWhatsApp(p.cliente_telefono)}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-emerald-700 hover:underline"
                      >
                        <MessageCircle className="size-3" /> {p.cliente_telefono}
                      </a>
                    </div>
                  </div>
                  {/* Entrega */}
                  <div className="text-sm">
                    <p className={cn("flex items-center gap-1.5", p.fecha_entrega ? "text-stone-800" : "text-stone-400")}>
                      <CalendarClock className="size-3.5 shrink-0 text-stone-400" />
                      {p.fecha_entrega ? fmtFecha(p.fecha_entrega, true) : "Sin fecha"}
                    </p>
                    {p.zona_nombre && (
                      <p className="flex items-center gap-1.5 text-xs text-stone-500">
                        <MapPin className="size-3 shrink-0" /> {p.zona_nombre}
                      </p>
                    )}
                  </div>
                  {/* Productos */}
                  <p className="line-clamp-2 text-sm text-stone-600">
                    {p.tipo === "alquiler" && <Badge tono="violeta">Alquiler</Badge>} {p.items.map((i) => `${i.cantidad}× ${i.descripcion}`).join(", ")}
                  </p>
                  {/* Total y pago */}
                  <div className="flex items-center gap-3 md:block md:text-right">
                    <p className="font-bold tabular-nums text-stone-900">{fmtDinero(p.total)}</p>
                    <Badge tono={pago.tono} punto>
                      {pago.label}
                    </Badge>
                  </div>
                  {/* Estado y acciones */}
                  <div className="flex items-center justify-between gap-1 md:justify-end">
                    <select
                      aria-label={`Estado del pedido ${p.id}`}
                      value={p.estado}
                      onChange={(e) => cambiarEstado(p, e.target.value as EstadoPedido)}
                      className={cn("h-8 rounded-full border-0 py-0 pl-3 pr-7 text-xs font-semibold ring-1 ring-inset focus:ring-2 focus:ring-cacao-400", SELECT_ESTADO[p.estado])}
                    >
                      {(Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]).map((e) => (
                        <option key={e} value={e}>
                          {ESTADOS_PEDIDO[e].label}
                        </option>
                      ))}
                    </select>
                    <div className="flex">
                      <a
                        href={linkWhatsApp(p.cliente_telefono, mensajeCliente(p))}
                        target="_blank"
                        rel="noreferrer"
                        title="Enviar resumen por WhatsApp"
                        aria-label="Enviar resumen por WhatsApp"
                        className="inline-flex size-8 items-center justify-center rounded-lg text-emerald-600 hover:bg-emerald-50"
                      >
                        <MessageCircle className="size-4" />
                      </a>
                      <IconButton label="Editar" onClick={() => setForm({ abierto: true, pedido: p })}>
                        <Pencil className="size-4" />
                      </IconButton>
                      <IconButton label="Eliminar" onClick={() => setBorrar(p)} className="hover:bg-fresa-50 hover:text-fresa-600">
                        <Trash2 className="size-4" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      {form.abierto && (
        <PedidoForm
          key={form.pedido?.id ?? "nuevo"}
          pedido={form.pedido}
          onCerrar={() => setForm({ abierto: false, pedido: null })}
          onGuardado={() => {
            setForm({ abierto: false, pedido: null });
            recargar();
          }}
        />
      )}

      <ConfirmDialog
        abierto={!!borrar}
        titulo="Eliminar pedido"
        texto={
          <>
            ¿Eliminar el pedido <b>#{borrar?.id}</b> de <b>{borrar?.cliente_nombre}</b>? Si solo no se concretó, mejor márcalo como <b>Cancelado</b> para
            conservar el historial.
          </>
        }
        cargando={borrando}
        onConfirmar={eliminar}
        onCerrar={() => setBorrar(null)}
      />
    </>
  );
}

export default function PedidosPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
