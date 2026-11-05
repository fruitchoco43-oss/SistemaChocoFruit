"use client";

import { AlertTriangle, CalendarClock, ClipboardList, MapPin, PackageCheck, Plus, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Badge, Button, Card, PageHeader, Segmentado, Skeleton, cn } from "@/components/ui";
import { qs } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { ESTADOS_PAGO, ESTADOS_PEDIDO, fmtDinero, fmtFecha, fmtNumero, hoyISO } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { Dashboard, EstadoPedido } from "@/lib/types";

const VIVO_RESUMEN = ["pedidos", "compras", "insumos", "movimientos"];

type Rango = "mes" | "mes_pasado" | "7d" | "30d";

function rango(r: Rango): { desde: string; hasta: string; label: string } {
  const hoy = hoyISO();
  const d = new Date(`${hoy}T12:00:00`);
  const iso = (x: Date) => x.toISOString().slice(0, 10);
  if (r === "mes") return { desde: `${hoy.slice(0, 7)}-01`, hasta: hoy, label: "este mes" };
  if (r === "mes_pasado") {
    const ini = new Date(d.getFullYear(), d.getMonth() - 1, 1, 12);
    const fin = new Date(d.getFullYear(), d.getMonth(), 0, 12);
    return { desde: iso(ini), hasta: iso(fin), label: "el mes pasado" };
  }
  const dias = r === "7d" ? 6 : 29;
  return { desde: iso(new Date(d.getTime() - dias * 864e5)), hasta: hoy, label: `los últimos ${dias + 1} días` };
}

function Tile({ titulo, valor, detalle, destacado, tono }: { titulo: string; valor: string; detalle?: ReactNode; destacado?: boolean; tono?: "pos" | "neg" }) {
  return (
    <Card className={cn("p-5", destacado && "bg-gradient-to-br from-cacao-700 to-cacao-900 ring-0")}>
      <p className={cn("text-sm font-medium", destacado ? "text-cacao-100" : "text-stone-500")}>{titulo}</p>
      <p
        className={cn(
          "mt-2 text-2xl font-bold tracking-tight tabular-nums sm:text-3xl",
          destacado ? "text-white" : tono === "neg" ? "text-fresa-700" : "text-stone-900",
        )}
      >
        {valor}
      </p>
      {detalle && <div className={cn("mt-1 text-xs", destacado ? "text-cacao-200" : "text-stone-500")}>{detalle}</div>}
    </Card>
  );
}

function Seccion({ titulo, icono, accion, children }: { titulo: string; icono: ReactNode; accion?: ReactNode; children: ReactNode }) {
  return (
    <Card className="flex flex-col">
      <div className="flex items-center justify-between border-b border-stone-100 px-5 py-3.5">
        <h2 className="flex items-center gap-2 font-semibold text-stone-900">
          <span className="text-cacao-600">{icono}</span>
          {titulo}
        </h2>
        {accion}
      </div>
      <div className="flex-1">{children}</div>
    </Card>
  );
}

const Vacio = ({ texto }: { texto: string }) => <p className="px-5 py-10 text-center text-sm text-stone-500">{texto}</p>;

export default function ResumenPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [r, setR] = useState<Rango>("mes");
  const { desde, hasta, label } = rango(r);
  const { data: d, cargando } = useApi<Dashboard>(`/api/dashboard${qs({ desde, hasta })}`, VIVO_RESUMEN);
  const maxTop = Math.max(1, ...(d?.top_productos.map((t) => t.cantidad) ?? [1]));
  const totalEstados = d ? Object.values(d.pedidos_por_estado).reduce((a, b) => a + b, 0) : 0;
  const saludo = new Date().getHours() < 12 ? "Buenos días" : new Date().getHours() < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <>
      <PageHeader
        titulo={`${saludo}, ${user?.nombre.split(" ")[0]}`}
        descripcion={`Así va el negocio ${label}.`}
        acciones={
          <Button onClick={() => router.push("/admin/pedidos?nuevo=1")} icono={<Plus className="size-4" />}>
            Nuevo pedido
          </Button>
        }
      />

      <div className="mb-5">
        <Segmentado
          valor={r}
          onChange={setR}
          opciones={[
            { valor: "mes", label: "Este mes" },
            { valor: "mes_pasado", label: "Mes pasado" },
            { valor: "7d", label: "7 días" },
            { valor: "30d", label: "30 días" },
          ]}
        />
      </div>

      {!d ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className={cn("space-y-5 transition-opacity", cargando && "opacity-60")}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Tile
              titulo="Ventas"
              valor={fmtDinero(d.ventas)}
              destacado
              detalle={`${d.pedidos} ${d.pedidos === 1 ? "pedido" : "pedidos"} · sin cancelados`}
            />
            <Tile titulo="Cobrado" valor={fmtDinero(d.cobrado)} detalle={<>Por cobrar (total): <b className="text-fresa-700">{fmtDinero(d.por_cobrar)}</b></>} />
            <Tile titulo="Gasto en materia prima" valor={fmtDinero(d.gastos_materia_prima)} detalle="Compras registradas" />
            <Tile
              titulo="Utilidad bruta"
              valor={fmtDinero(d.utilidad_bruta)}
              tono={d.utilidad_bruta < 0 ? "neg" : "pos"}
              detalle={d.ventas > 0 ? `Margen ${Math.round((d.utilidad_bruta / d.ventas) * 100)}% · ventas − compras` : "Ventas − compras"}
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
            <Seccion
              titulo="Próximas entregas"
              icono={<CalendarClock className="size-4" />}
              accion={
                <Link href="/admin/pedidos" className="text-sm font-medium text-cacao-700 hover:underline">
                  Ver pedidos
                </Link>
              }
            >
              {d.proximas_entregas.length === 0 ? (
                <Vacio texto="No hay entregas programadas para los próximos 7 días." />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {d.proximas_entregas.map((p) => (
                    <li key={p.id} className="flex items-center gap-4 px-5 py-3">
                      <div className="w-14 shrink-0 rounded-xl bg-cacao-50 py-1.5 text-center ring-1 ring-cacao-100">
                        <p className="text-[10px] font-semibold uppercase text-cacao-600">
                          {new Date(p.fecha_entrega).toLocaleDateString("es-EC", { timeZone: "America/Guayaquil", weekday: "short" })}
                        </p>
                        <p className="text-lg font-bold leading-tight text-cacao-900">
                          {new Date(p.fecha_entrega).toLocaleDateString("es-EC", { timeZone: "America/Guayaquil", day: "numeric" })}
                        </p>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-stone-900">
                          #{p.id} · {p.cliente_nombre}
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {new Date(p.fecha_entrega).toLocaleTimeString("es-EC", { timeZone: "America/Guayaquil", hour: "2-digit", minute: "2-digit" })}
                          {p.zona_nombre && (
                            <>
                              {" "}
                              · <MapPin className="inline size-3" /> {p.zona_nombre}
                            </>
                          )}{" "}
                          · {p.items.join(", ")}
                        </p>
                      </div>
                      <div className="hidden flex-col items-end gap-1 sm:flex">
                        <Badge tono={ESTADOS_PEDIDO[p.estado].tono}>{ESTADOS_PEDIDO[p.estado].label}</Badge>
                        <Badge tono={ESTADOS_PAGO[p.estado_pago].tono} punto>
                          {ESTADOS_PAGO[p.estado_pago].label}
                        </Badge>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>

            <Seccion
              titulo="Insumos por reponer"
              icono={<AlertTriangle className="size-4" />}
              accion={
                <Link href="/admin/compras" className="text-sm font-medium text-cacao-700 hover:underline">
                  Registrar compra
                </Link>
              }
            >
              {d.insumos_bajo_stock.length === 0 ? (
                <div className="flex flex-col items-center px-5 py-10 text-center">
                  <PackageCheck className="size-8 text-emerald-500" />
                  <p className="mt-2 text-sm text-stone-600">Todo el inventario está sobre el mínimo.</p>
                </div>
              ) : (
                <ul className="divide-y divide-stone-100">
                  {d.insumos_bajo_stock.map((i) => (
                    <li key={i.id} className="flex items-center justify-between gap-3 px-5 py-3">
                      <span className="font-medium text-stone-800">{i.nombre}</span>
                      <span className="text-right text-sm tabular-nums">
                        <b className="text-fresa-700">
                          {fmtNumero(i.stock_actual)} {i.unidad}
                        </b>
                        <span className="text-stone-500">
                          {" "}
                          / mín. {fmtNumero(i.stock_minimo)}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Seccion titulo="Más vendidos" icono={<TrendingUp className="size-4" />}>
              {d.top_productos.length === 0 ? (
                <Vacio texto="Aún no hay ventas en este periodo." />
              ) : (
                <ul className="space-y-3.5 px-5 py-4">
                  {d.top_productos.map((t) => (
                    <li key={t.descripcion}>
                      <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                        <span className="truncate font-medium text-stone-800">{t.descripcion}</span>
                        <span className="shrink-0 tabular-nums text-stone-500">
                          <b className="text-stone-800">{t.cantidad}</b> u · {fmtDinero(t.monto)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-stone-100">
                        <div className="h-full rounded-full bg-cacao-500" style={{ width: `${(t.cantidad / maxTop) * 100}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>

            <Seccion titulo="Pedidos por estado" icono={<ClipboardList className="size-4" />}>
              {totalEstados === 0 ? (
                <Vacio texto="No se registraron pedidos en este periodo." />
              ) : (
                <ul className="divide-y divide-stone-100">
                  {(Object.keys(ESTADOS_PEDIDO) as EstadoPedido[]).map((e) => (
                    <li key={e} className="flex items-center justify-between px-5 py-2.5">
                      <Badge tono={ESTADOS_PEDIDO[e].tono} punto>
                        {ESTADOS_PEDIDO[e].label}
                      </Badge>
                      <span className="text-sm font-semibold tabular-nums text-stone-800">{d.pedidos_por_estado[e]}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Seccion>
          </div>

          <p className="text-xs text-stone-400">
            Periodo: {fmtFecha(d.desde)} – {fmtFecha(d.hasta)}. Ventas y cobros según la fecha de registro del pedido.
          </p>
        </div>
      )}
    </>
  );
}
