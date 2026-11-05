"use client";

import { ArrowDownRight, ArrowUpRight, Plus, Repeat, SlidersHorizontal } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Badge, Button, Card, EmptyState, Field, Input, Modal, PageHeader, Segmentado, Select, Skeleton } from "@/components/ui";
import { api, ApiError, qs } from "@/lib/api";
import { fmtFecha, fmtNumero, TIPOS_MOVIMIENTO } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Insumo, Movimiento, TipoMovimiento } from "@/lib/types";

function Contenido() {
  const inicial = useSearchParams().get("insumo") ?? "";
  const [insumoId, setInsumoId] = useState(inicial);
  const [tipo, setTipo] = useState<"" | TipoMovimiento>("");
  const { data: insumos, recargar: recargarInsumos } = useApi<Insumo[]>("/api/insumos?activo=true");
  const { data, cargando, recargar } = useApi<Movimiento[]>(`/api/movimientos${qs({ materia_prima_id: insumoId, tipo })}`);

  const [abierto, setAbierto] = useState(false);
  const [f, setF] = useState({ materia_prima_id: "", tipo: "salida" as TipoMovimiento, cantidad: "", motivo: "" });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const insumoSel = insumos?.find((i) => String(i.id) === f.materia_prima_id);

  function abrir() {
    setF({ materia_prima_id: insumoId, tipo: "salida", cantidad: "", motivo: "" });
    setErrores({});
    setAbierto(true);
  }

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrores({});
    try {
      await api("/api/movimientos", {
        method: "POST",
        body: {
          materia_prima_id: Number(f.materia_prima_id) || null,
          tipo: f.tipo,
          cantidad: f.cantidad === "" ? null : Number(f.cantidad),
          motivo: f.motivo.trim() || null,
        },
      });
      toast.success("Movimiento registrado");
      setAbierto(false);
      recargar();
      recargarInsumos();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.fieldErrors);
        toast.error(err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <PageHeader
        titulo="Movimientos de inventario"
        descripcion="Historial de entradas (compras), salidas (consumo en producción) y ajustes (conteos, mermas)."
        acciones={
          <Button onClick={abrir} icono={<Plus className="size-4" />}>
            Registrar salida o ajuste
          </Button>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <Select value={insumoId} onChange={(e) => setInsumoId(e.target.value)} className="sm:w-72">
            <option value="">Todos los insumos</option>
            {insumos?.map((i) => (
              <option key={i.id} value={i.id}>
                {i.nombre}
              </option>
            ))}
          </Select>
          <Segmentado
            valor={tipo}
            onChange={setTipo}
            opciones={[
              { valor: "", label: "Todos" },
              { valor: "entrada", label: "Entradas" },
              { valor: "salida", label: "Salidas" },
              { valor: "ajuste", label: "Ajustes" },
            ]}
          />
        </div>

        {cargando && !data ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : data?.length === 0 ? (
          <EmptyState icono={<Repeat className="size-6" />} titulo="Sin movimientos" texto="Los movimientos aparecen al registrar compras, salidas o ajustes." />
        ) : (
          <ul className="divide-y divide-stone-100">
            {data?.map((mv) => {
              const negativo = mv.tipo === "salida" || (mv.tipo === "ajuste" && mv.cantidad < 0);
              const Icono = mv.tipo === "ajuste" ? SlidersHorizontal : negativo ? ArrowDownRight : ArrowUpRight;
              return (
                <li key={mv.id} className="flex items-center gap-4 px-4 py-3 hover:bg-cacao-50/40">
                  <div
                    className={
                      negativo
                        ? "flex size-9 shrink-0 items-center justify-center rounded-xl bg-fresa-50 text-fresa-600"
                        : "flex size-9 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600"
                    }
                  >
                    <Icono className="size-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{mv.materia_prima_nombre}</p>
                    <p className="truncate text-xs text-stone-500">
                      {fmtFecha(mv.fecha, true)}
                      {mv.motivo && ` · ${mv.motivo}`}
                      {mv.compra_id && ` · Compra #${mv.compra_id}`}
                    </p>
                  </div>
                  <Badge tono={TIPOS_MOVIMIENTO[mv.tipo].tono}>{TIPOS_MOVIMIENTO[mv.tipo].label}</Badge>
                  <p className={negativo ? "w-28 text-right font-semibold tabular-nums text-fresa-700" : "w-28 text-right font-semibold tabular-nums text-emerald-700"}>
                    {negativo ? "−" : "+"}
                    {fmtNumero(Math.abs(mv.cantidad))} <span className="text-xs font-normal text-stone-500">{mv.unidad}</span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo="Registrar movimiento"
        descripcion="Las entradas se registran desde Compras."
        ancho="sm"
        pie={
          <>
            <Button variante="secundario" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-mov" cargando={guardando}>
              Registrar
            </Button>
          </>
        }
      >
        <form id="form-mov" onSubmit={guardar} className="space-y-4" noValidate>
          <Field label="Insumo" requerido error={errores.materia_prima_id} htmlFor="mv-ins">
            <Select id="mv-ins" value={f.materia_prima_id} onChange={(e) => setF({ ...f, materia_prima_id: e.target.value })}>
              <option value="">Selecciona…</option>
              {insumos?.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.nombre} — hay {fmtNumero(i.stock_actual)} {i.unidad}
                </option>
              ))}
            </Select>
          </Field>
          <Segmentado
            valor={f.tipo}
            onChange={(t) => setF({ ...f, tipo: t })}
            opciones={[
              { valor: "salida", label: "Salida (consumo)" },
              { valor: "ajuste", label: "Ajuste" },
            ]}
          />
          <Field
            label={`Cantidad${insumoSel ? ` (${insumoSel.unidad})` : ""}`}
            requerido
            error={errores.cantidad}
            ayuda={f.tipo === "ajuste" ? "Positivo suma al stock, negativo resta (ej.: -0.5 por merma)." : "Cantidad usada en producción."}
            htmlFor="mv-cant"
          >
            <Input id="mv-cant" type="number" step="0.001" value={f.cantidad} onChange={(e) => setF({ ...f, cantidad: e.target.value })} />
          </Field>
          <Field label="Motivo" htmlFor="mv-mot">
            <Input
              id="mv-mot"
              value={f.motivo}
              onChange={(e) => setF({ ...f, motivo: e.target.value })}
              placeholder={f.tipo === "salida" ? "Producción del día" : "Conteo físico, producto dañado…"}
            />
          </Field>
        </form>
      </Modal>
    </>
  );
}

export default function MovimientosPage() {
  return (
    <Suspense>
      <Contenido />
    </Suspense>
  );
}
