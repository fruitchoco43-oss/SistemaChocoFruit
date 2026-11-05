"use client";

import { ChevronDown, Plus, Receipt, Trash2 } from "lucide-react";
import { Fragment, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  Input,
  Modal,
  PageHeader,
  Select,
  Skeleton,
  Textarea,
  cn,
} from "@/components/ui";
import { api, ApiError, qs } from "@/lib/api";
import { fmtDinero, fmtFecha, fmtNumero, hoyISO } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Compra, Insumo, Proveedor } from "@/lib/types";

interface Linea {
  key: number;
  materia_prima_id: string;
  cantidad: string;
  costo_unitario: string;
}

let sec = 0;
const nuevaLinea = (): Linea => ({ key: ++sec, materia_prima_id: "", cantidad: "", costo_unitario: "" });

function inicioMes() {
  return `${hoyISO().slice(0, 7)}-01`;
}

export default function ComprasPage() {
  const [desde, setDesde] = useState(inicioMes);
  const [hasta, setHasta] = useState(hoyISO);
  const [proveedorId, setProveedorId] = useState("");
  const { data, cargando, recargar } = useApi<Compra[]>(`/api/compras${qs({ desde, hasta, proveedor_id: proveedorId })}`);
  const { data: proveedores } = useApi<Proveedor[]>("/api/proveedores?activo=true");
  const { data: insumos } = useApi<Insumo[]>("/api/insumos?activo=true");

  const [abierto, setAbierto] = useState(false);
  const [expandida, setExpandida] = useState<number | null>(null);
  const [cab, setCab] = useState({ proveedor_id: "", fecha: hoyISO(), numero_factura: "", notas: "" });
  const [lineas, setLineas] = useState<Linea[]>([nuevaLinea()]);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState<Compra | null>(null);
  const [borrando, setBorrando] = useState(false);

  const total = lineas.reduce((s, l) => s + (Number(l.cantidad) || 0) * (Number(l.costo_unitario) || 0), 0);
  const totalPeriodo = data?.reduce((s, c) => s + c.total, 0) ?? 0;

  function abrir() {
    setCab({ proveedor_id: "", fecha: hoyISO(), numero_factura: "", notas: "" });
    setLineas([nuevaLinea()]);
    setErrores({});
    setAbierto(true);
  }

  const setLinea = (key: number, campo: keyof Linea, v: string) => setLineas((ls) => ls.map((l) => (l.key === key ? { ...l, [campo]: v } : l)));

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrores({});
    try {
      await api("/api/compras", {
        method: "POST",
        body: {
          proveedor_id: cab.proveedor_id ? Number(cab.proveedor_id) : null,
          fecha: cab.fecha,
          numero_factura: cab.numero_factura.trim() || null,
          notas: cab.notas.trim() || null,
          items: lineas
            .filter((l) => l.materia_prima_id || l.cantidad || l.costo_unitario)
            .map((l) => ({
              materia_prima_id: Number(l.materia_prima_id) || null,
              cantidad: l.cantidad === "" ? null : Number(l.cantidad),
              costo_unitario: l.costo_unitario === "" ? null : Number(l.costo_unitario),
            })),
        },
      });
      toast.success("Compra registrada y stock actualizado");
      setAbierto(false);
      recargar();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.fieldErrors);
        toast.error(err.fieldErrors.items ? "Agrega al menos un insumo" : err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  async function eliminar() {
    if (!borrar) return;
    setBorrando(true);
    try {
      await api(`/api/compras/${borrar.id}`, { method: "DELETE" });
      toast.success("Compra eliminada y stock revertido");
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
        titulo="Compras de materia prima"
        descripcion="Cada compra suma stock a los insumos y actualiza su costo promedio."
        acciones={
          <Button onClick={abrir} icono={<Plus className="size-4" />}>
            Nueva compra
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-end">
            <Field label="Desde" htmlFor="c-desde">
              <Input id="c-desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </Field>
            <Field label="Hasta" htmlFor="c-hasta">
              <Input id="c-hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </Field>
            <Field label="Proveedor" htmlFor="c-prov" className="col-span-2 sm:w-56">
              <Select id="c-prov" value={proveedorId} onChange={(e) => setProveedorId(e.target.value)}>
                <option value="">Todos</option>
                {proveedores?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="rounded-xl bg-cacao-50 px-4 py-2 text-right ring-1 ring-cacao-100">
            <p className="text-xs text-cacao-700">Total del periodo</p>
            <p className="text-lg font-bold tabular-nums text-cacao-900">{fmtDinero(totalPeriodo)}</p>
          </div>
        </div>

        {cargando && !data ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <EmptyState
            icono={<Receipt className="size-6" />}
            titulo="Sin compras en este periodo"
            texto="Registra tus compras para llevar el control de gastos y stock."
            accion={
              <Button onClick={abrir} icono={<Plus className="size-4" />}>
                Nueva compra
              </Button>
            }
          />
        ) : (
          <div className="scroll-fino overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                  <th className="w-10 px-4 py-3" />
                  <th className="px-4 py-3">Fecha</th>
                  <th className="px-4 py-3">Proveedor</th>
                  <th className="px-4 py-3">Factura</th>
                  <th className="px-4 py-3">Insumos</th>
                  <th className="px-4 py-3 text-right">Total</th>
                  <th className="w-14 px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {data?.map((c) => (
                  <Fragment key={c.id}>
                    <tr className="cursor-pointer hover:bg-cacao-50/40" onClick={() => setExpandida(expandida === c.id ? null : c.id)}>
                      <td className="px-4 py-3">
                        <ChevronDown className={cn("size-4 text-stone-400 transition-transform", expandida === c.id && "rotate-180")} />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">{fmtFecha(c.fecha)}</td>
                      <td className="px-4 py-3 font-medium text-stone-900">{c.proveedor_nombre ?? <span className="text-stone-400">Sin proveedor</span>}</td>
                      <td className="px-4 py-3 text-stone-600">{c.numero_factura ?? "—"}</td>
                      <td className="px-4 py-3 text-stone-600">
                        {c.items.length} {c.items.length === 1 ? "insumo" : "insumos"}
                      </td>
                      <td className="px-4 py-3 text-right font-semibold tabular-nums">{fmtDinero(c.total)}</td>
                      <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <IconButton label="Eliminar compra" onClick={() => setBorrar(c)} className="hover:bg-fresa-50 hover:text-fresa-600">
                          <Trash2 className="size-4" />
                        </IconButton>
                      </td>
                    </tr>
                    {expandida === c.id && (
                      <tr className="bg-stone-50/70">
                        <td />
                        <td colSpan={6} className="px-4 py-3">
                          <table className="w-full text-sm">
                            <tbody>
                              {c.items.map((it) => (
                                <tr key={it.id}>
                                  <td className="py-1 text-stone-700">{it.materia_prima_nombre}</td>
                                  <td className="py-1 text-right tabular-nums text-stone-600">
                                    {fmtNumero(it.cantidad)} {it.unidad} × {fmtDinero(it.costo_unitario)}
                                  </td>
                                  <td className="w-28 py-1 text-right font-medium tabular-nums">{fmtDinero(it.cantidad * it.costo_unitario)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {c.notas && <p className="mt-2 text-xs text-stone-500">Notas: {c.notas}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Nueva compra"
        ancho="lg"
        pie={
          <>
            <Button variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-compra" cargando={guardando}>
              Registrar compra · {fmtDinero(total)}
            </Button>
          </>
        }
      >
        <form id="form-compra" onSubmit={guardar} className="space-y-5" noValidate>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Proveedor" htmlFor="nc-prov">
              <Select id="nc-prov" value={cab.proveedor_id} onChange={(e) => setCab({ ...cab, proveedor_id: e.target.value })}>
                <option value="">— Sin proveedor —</option>
                {proveedores?.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha" requerido error={errores.fecha} htmlFor="nc-fecha">
              <Input id="nc-fecha" type="date" value={cab.fecha} onChange={(e) => setCab({ ...cab, fecha: e.target.value })} />
            </Field>
            <Field label="N.º de factura" htmlFor="nc-fact">
              <Input id="nc-fact" value={cab.numero_factura} onChange={(e) => setCab({ ...cab, numero_factura: e.target.value })} placeholder="001-001-000123" />
            </Field>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-stone-700">Insumos comprados</p>
            {insumos?.length === 0 && (
              <p className="mb-2 rounded-xl bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-amber-200">
                Primero crea tus insumos en la sección Insumos.
              </p>
            )}
            <div className="space-y-2">
              <div className="hidden grid-cols-[1fr_110px_120px_100px_32px] gap-2 px-1 text-xs font-medium text-stone-500 sm:grid">
                <span>Insumo</span>
                <span>Cantidad</span>
                <span>Costo unitario</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>
              {lineas.map((l, idx) => {
                const ins = insumos?.find((i) => String(i.id) === l.materia_prima_id);
                const err = (c: string) => !!errores[`items.${idx}.${c}`];
                return (
                  <div key={l.key} className="grid grid-cols-2 gap-2 rounded-xl bg-stone-50 p-2 sm:grid-cols-[1fr_110px_120px_100px_32px] sm:bg-transparent sm:p-0">
                    <Select
                      aria-label="Insumo"
                      value={l.materia_prima_id}
                      onChange={(e) => setLinea(l.key, "materia_prima_id", e.target.value)}
                      invalido={err("materia_prima_id")}
                      className="col-span-2 sm:col-span-1"
                    >
                      <option value="">Selecciona…</option>
                      {insumos?.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.nombre} ({i.unidad})
                        </option>
                      ))}
                    </Select>
                    <Input
                      aria-label="Cantidad"
                      type="number"
                      step="0.001"
                      min={0}
                      placeholder={ins?.unidad ?? "0"}
                      value={l.cantidad}
                      onChange={(e) => setLinea(l.key, "cantidad", e.target.value)}
                      invalido={err("cantidad")}
                    />
                    <Input
                      aria-label="Costo unitario"
                      type="number"
                      step="0.0001"
                      min={0}
                      prefijo="$"
                      placeholder="0.00"
                      value={l.costo_unitario}
                      onChange={(e) => setLinea(l.key, "costo_unitario", e.target.value)}
                      invalido={err("costo_unitario")}
                    />
                    <p className="flex items-center justify-end text-sm font-semibold tabular-nums text-stone-800">
                      {fmtDinero((Number(l.cantidad) || 0) * (Number(l.costo_unitario) || 0))}
                    </p>
                    <IconButton
                      label="Quitar línea"
                      disabled={lineas.length === 1}
                      onClick={() => setLineas((ls) => ls.filter((x) => x.key !== l.key))}
                      className="self-center justify-self-end disabled:opacity-30"
                    >
                      <Trash2 className="size-4" />
                    </IconButton>
                  </div>
                );
              })}
            </div>
            <Button type="button" variante="fantasma" tam="sm" className="mt-2" onClick={() => setLineas((ls) => [...ls, nuevaLinea()])} icono={<Plus className="size-4" />}>
              Agregar insumo
            </Button>
          </div>

          <Field label="Notas" htmlFor="nc-notas">
            <Textarea id="nc-notas" rows={2} value={cab.notas} onChange={(e) => setCab({ ...cab, notas: e.target.value })} />
          </Field>

          <div className="flex items-center justify-between rounded-xl bg-cacao-50 px-4 py-3 ring-1 ring-cacao-100">
            <span className="text-sm font-medium text-cacao-800">Total de la compra</span>
            <span className="text-xl font-bold tabular-nums text-cacao-900">{fmtDinero(total)}</span>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        abierto={!!borrar}
        titulo="Eliminar compra"
        texto={
          <>
            Se eliminará la compra del <b>{borrar && fmtFecha(borrar.fecha)}</b> por <b>{borrar && fmtDinero(borrar.total)}</b> y se{" "}
            <b>restará del stock</b> lo que se compró. Si ya usaste parte de esos insumos no se podrá eliminar.
          </>
        }
        cargando={borrando}
        onConfirmar={eliminar}
        onCerrar={() => setBorrar(null)}
      />
    </>
  );
}
