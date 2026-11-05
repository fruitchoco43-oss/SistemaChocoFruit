"use client";

import { Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useMemo, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { api, ApiError, qs } from "@/lib/api";
import { useApi, useDebounce } from "@/lib/hooks";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  IconButton,
  ImageInput,
  ImagesInput,
  Input,
  Modal,
  PageHeader,
  SearchInput,
  Segmentado,
  Select,
  Skeleton,
  Switch,
  TagsInput,
  Textarea,
  cn,
} from "./ui";

/* eslint-disable @typescript-eslint/no-explicit-any */
type Form = Record<string, any>;

export interface Campo {
  name: string;
  label: string;
  tipo: "texto" | "email" | "password" | "area" | "numero" | "dinero" | "select" | "switch" | "tags" | "colores" | "imagenes" | "imagen";
  requerido?: boolean;
  placeholder?: string;
  ayuda?: string;
  completo?: boolean; // ocupa las 2 columnas
  opciones?: { valor: string | number; label: string }[];
  numerico?: boolean; // select con valores numéricos
  vacio?: string; // texto de la opción vacía del select
  step?: string;
  min?: number;
  soloCrear?: boolean;
  ayudaEditar?: string;
  visible?: (f: Form) => boolean;
}

export interface Columna<T> {
  header: string;
  cell: (row: T) => ReactNode;
  className?: string;
}

interface Props<T extends { id: number; activo?: boolean }> {
  titulo: string;
  descripcion?: string;
  endpoint: string;
  singular: string;
  femenino?: boolean;
  icono: ReactNode;
  columnas: Columna<T>[];
  campos: Campo[];
  defaults: Form;
  nombreFila: (row: T) => string;
  buscar?: string;
  conActivo?: boolean;
  aForm?: (row: T) => Form;
  aPayload?: (f: Form, editando: boolean) => Form;
  accionesFila?: (row: T) => ReactNode;
  accionesHeader?: ReactNode;
  textoVacio?: string;
  onCambio?: () => void;
  /** Orden personalizado de las filas (p. ej. árbol del chatbot). */
  ordenar?: (rows: T[]) => T[];
  /** Canales en vivo que recargan la tabla. Por defecto, el del endpoint (/api/productos -> productos). */
  vivo?: string[];
  anchoModal?: "md" | "lg";
}

function payloadPorDefecto(campos: Campo[], f: Form, editando: boolean): Form {
  const out: Form = {};
  for (const c of campos) {
    if (c.visible && !c.visible(f)) continue;
    let v = f[c.name];
    if (c.tipo === "password") {
      if (!v) {
        if (editando) continue;
        v = "";
      }
    } else if (c.tipo === "numero" || c.tipo === "dinero") {
      const vacio = v === "" || v === null || v === undefined;
      if (vacio && !c.requerido) continue; // la API usa su valor por defecto
      v = vacio ? null : Number(v);
    } else if (c.tipo === "select") {
      v = v === "" || v === null || v === undefined ? null : c.numerico ? Number(v) : v;
    } else if (["texto", "email", "area", "imagen"].includes(c.tipo)) {
      v = typeof v === "string" ? v.trim() : v;
      if (v === "" && !c.requerido) v = null;
    }
    out[c.name] = v;
  }
  return out;
}

export function ResourcePage<T extends { id: number; activo?: boolean }>(p: Props<T>) {
  const conActivo = p.conActivo ?? true;
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "activos" | "inactivos">("todos");
  const q = useDebounce(busqueda);
  const ruta = `${p.endpoint}${qs({ q, activo: filtro === "todos" ? undefined : filtro === "activos" })}`;
  const canales = p.vivo ?? [p.endpoint.split("/").pop()!];
  const { data: crudos, cargando, error, recargar, setData } = useApi<T[]>(ruta, canales);
  const { ordenar } = p;
  const data = useMemo(() => (crudos && ordenar ? ordenar(crudos) : crudos), [crudos, ordenar]);

  const [editando, setEditando] = useState<T | null>(null);
  const [abierto, setAbierto] = useState(false);
  const [form, setForm] = useState<Form>(p.defaults);
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);
  const [borrar, setBorrar] = useState<T | null>(null);
  const [borrando, setBorrando] = useState(false);

  const art = p.femenino ? "Nueva" : "Nuevo";
  const { onCambio, aForm, defaults } = p;

  const abrir = useCallback(
    (row: T | null) => {
      setEditando(row);
      setErrores({});
      if (row) {
        const base: Form = aForm ? aForm(row) : { ...row };
        for (const k of Object.keys(base)) if (base[k] === null) base[k] = "";
        setForm({ ...defaults, ...base });
      } else {
        setForm(defaults);
      }
      setAbierto(true);
    },
    [aForm, defaults],
  );

  const set = (name: string, v: any) => {
    setForm((f) => ({ ...f, [name]: v }));
    if (errores[name])
      setErrores((e) => {
        const n = { ...e };
        delete n[name];
        return n;
      });
  };

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrores({});
    try {
      const base = payloadPorDefecto(p.campos, form, !!editando);
      const body = p.aPayload ? p.aPayload({ ...form, ...base }, !!editando) : base;
      if (editando) {
        await api(`${p.endpoint}/${editando.id}`, { method: "PATCH", body });
        toast.success(`${p.singular[0].toUpperCase()}${p.singular.slice(1)} actualizad${p.femenino ? "a" : "o"}`);
      } else {
        await api(p.endpoint, { method: "POST", body });
        toast.success(`${p.singular[0].toUpperCase()}${p.singular.slice(1)} cread${p.femenino ? "a" : "o"}`);
      }
      setAbierto(false);
      recargar();
      onCambio?.();
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.fieldErrors);
        toast.error(err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  async function confirmarBorrado() {
    if (!borrar) return;
    setBorrando(true);
    try {
      await api(`${p.endpoint}/${borrar.id}`, { method: "DELETE" });
      toast.success(`«${p.nombreFila(borrar)}» eliminado`);
      setBorrar(null);
      recargar();
      onCambio?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "No se pudo eliminar");
    } finally {
      setBorrando(false);
    }
  }

  async function alternarActivo(row: T) {
    const nuevo = !row.activo;
    setData((d) => d?.map((r) => (r.id === row.id ? { ...r, activo: nuevo } : r)) ?? d);
    try {
      await api(`${p.endpoint}/${row.id}`, { method: "PATCH", body: { activo: nuevo } });
      if (filtro !== "todos") recargar();
      onCambio?.();
    } catch (err) {
      setData((d) => d?.map((r) => (r.id === row.id ? { ...r, activo: !nuevo } : r)) ?? d);
      toast.error(err instanceof ApiError ? err.message : "No se pudo actualizar");
    }
  }

  const columnas = useMemo<Columna<T>[]>(() => {
    const cols = [...p.columnas];
    if (conActivo)
      cols.push({
        header: "Activo",
        className: "w-20",
        cell: (r) => <Switch checked={!!r.activo} onChange={() => alternarActivo(r)} ariaLabel={`Activo: ${p.nombreFila(r)}`} />,
      });
    return cols;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.columnas, conActivo, filtro]);

  const acciones = (r: T) => (
    <div className="flex items-center justify-end gap-0.5">
      {p.accionesFila?.(r)}
      <IconButton label="Editar" onClick={() => abrir(r)}>
        <Pencil className="size-4" />
      </IconButton>
      <IconButton label="Eliminar" onClick={() => setBorrar(r)} className="hover:bg-fresa-50 hover:text-fresa-600">
        <Trash2 className="size-4" />
      </IconButton>
    </div>
  );

  const vacio = !cargando && data?.length === 0;
  const hayFiltros = !!q || filtro !== "todos";

  return (
    <>
      <PageHeader
        titulo={p.titulo}
        descripcion={p.descripcion}
        acciones={
          <>
            {p.accionesHeader}
            <Button onClick={() => abrir(null)} icono={<Plus className="size-4" />}>
              {art} {p.singular}
            </Button>
          </>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-stone-100 p-4 sm:flex-row sm:items-center sm:justify-between">
          <SearchInput value={busqueda} onChange={setBusqueda} placeholder={p.buscar ?? "Buscar…"} className="sm:w-80" />
          {conActivo && (
            <Segmentado
              valor={filtro}
              onChange={setFiltro}
              opciones={[
                { valor: "todos", label: "Todos" },
                { valor: "activos", label: "Activos" },
                { valor: "inactivos", label: "Inactivos" },
              ]}
            />
          )}
        </div>

        {error ? (
          <div className="p-6 text-sm text-fresa-700">
            {error}{" "}
            <button className="font-medium underline" onClick={recargar}>
              Reintentar
            </button>
          </div>
        ) : cargando && !data ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12" />
            ))}
          </div>
        ) : vacio ? (
          <EmptyState
            icono={p.icono}
            titulo={hayFiltros ? "Sin resultados" : `Aún no hay ${p.titulo.toLowerCase()}`}
            texto={hayFiltros ? "Prueba con otra búsqueda o filtro." : p.textoVacio}
            accion={
              !hayFiltros && (
                <Button onClick={() => abrir(null)} icono={<Plus className="size-4" />}>
                  {art} {p.singular}
                </Button>
              )
            }
          />
        ) : (
          <div className={cn("transition-opacity", cargando && "opacity-60")}>
            {/* Escritorio: tabla */}
            <div className="scroll-fino hidden overflow-x-auto md:block">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-stone-100 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {columnas.map((c) => (
                      <th key={c.header} className={cn("px-4 py-3", c.className)}>
                        {c.header}
                      </th>
                    ))}
                    <th className="w-24 px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-100">
                  {data?.map((r) => (
                    <tr key={r.id} className={cn("transition-colors hover:bg-cacao-50/40", conActivo && !r.activo && "text-stone-400")}>
                      {columnas.map((c) => (
                        <td key={c.header} className={cn("px-4 py-3 align-middle", c.className)}>
                          {c.cell(r)}
                        </td>
                      ))}
                      <td className="px-4 py-3">{acciones(r)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Celular: tarjetas */}
            <ul className="divide-y divide-stone-100 md:hidden">
              {data?.map((r) => (
                <li key={r.id} className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">{columnas[0].cell(r)}</div>
                    {acciones(r)}
                  </div>
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    {columnas.slice(1).map((c) => (
                      <div key={c.header}>
                        <dt className="text-xs text-stone-500">{c.header}</dt>
                        <dd className="mt-0.5">{c.cell(r)}</dd>
                      </div>
                    ))}
                  </dl>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      <Modal
        abierto={abierto}
        onCerrar={() => setAbierto(false)}
        titulo={editando ? `Editar ${p.singular}` : `${art} ${p.singular}`}
        descripcion={editando ? p.nombreFila(editando) : undefined}
        ancho={p.anchoModal ?? "md"}
        pie={
          <>
            <Button variante="secundario" type="button" onClick={() => setAbierto(false)}>
              Cancelar
            </Button>
            <Button type="submit" form="form-recurso" cargando={guardando}>
              {editando ? "Guardar cambios" : "Crear"}
            </Button>
          </>
        }
      >
        <form id="form-recurso" onSubmit={guardar} className="grid gap-4 sm:grid-cols-2" noValidate>
          {p.campos
            .filter((c) => (!c.visible || c.visible(form)) && !(c.soloCrear && editando))
            .map((c) => (
              <CampoForm
                key={c.name}
                campo={c}
                valor={form[c.name]}
                error={errores[c.name]}
                editando={!!editando}
                onChange={(v) => set(c.name, v)}
              />
            ))}
        </form>
      </Modal>

      <ConfirmDialog
        abierto={!!borrar}
        titulo={`Eliminar ${p.singular}`}
        texto={
          <>
            ¿Seguro que quieres eliminar <b className="text-stone-900">«{borrar && p.nombreFila(borrar)}»</b>? Esta acción no se puede
            deshacer.
            {conActivo && <p className="mt-2 text-stone-500">Si solo quieres ocultarlo, desactívalo en su lugar.</p>}
          </>
        }
        cargando={borrando}
        onConfirmar={confirmarBorrado}
        onCerrar={() => setBorrar(null)}
      />
    </>
  );
}

function CampoForm({
  campo: c,
  valor,
  error,
  editando,
  onChange,
}: {
  campo: Campo;
  valor: any;
  error?: string;
  editando: boolean;
  onChange: (v: any) => void;
}) {
  const id = `campo-${c.name}`;
  const ancho = c.completo || ["area", "tags", "colores", "imagenes", "imagen", "switch"].includes(c.tipo) ? "sm:col-span-2" : "";
  const ayuda = editando && c.ayudaEditar ? c.ayudaEditar : c.ayuda;

  if (c.tipo === "switch")
    return (
      <div className={ancho}>
        <Switch checked={!!valor} onChange={onChange} label={c.label} descripcion={c.ayuda} />
      </div>
    );

  let control: ReactNode;
  switch (c.tipo) {
    case "area":
      control = <Textarea id={id} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={c.placeholder} invalido={!!error} />;
      break;
    case "select":
      control = (
        <Select id={id} value={valor ?? ""} onChange={(e) => onChange(e.target.value)} invalido={!!error}>
          {(c.vacio !== undefined || !c.requerido) && <option value="">{c.vacio ?? "— Ninguno —"}</option>}
          {c.opciones?.map((o) => (
            <option key={o.valor} value={o.valor}>
              {o.label}
            </option>
          ))}
        </Select>
      );
      break;
    case "tags":
    case "colores":
      control = <TagsInput value={valor ?? []} onChange={onChange} colores={c.tipo === "colores"} placeholder={c.placeholder} />;
      break;
    case "imagenes":
      control = <ImagesInput value={valor ?? []} onChange={onChange} />;
      break;
    case "imagen":
      control = <ImageInput value={valor} onChange={onChange} />;
      break;
    default:
      control = (
        <Input
          id={id}
          type={c.tipo === "dinero" || c.tipo === "numero" ? "number" : c.tipo === "texto" ? "text" : c.tipo}
          inputMode={c.tipo === "dinero" ? "decimal" : undefined}
          step={c.step ?? (c.tipo === "dinero" ? "0.01" : undefined)}
          min={c.min ?? (c.tipo === "dinero" ? 0 : undefined)}
          prefijo={c.tipo === "dinero" ? "$" : undefined}
          value={valor ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={c.placeholder}
          invalido={!!error}
          autoComplete={c.tipo === "password" ? "new-password" : undefined}
        />
      );
  }
  return (
    <Field label={c.label} error={error} ayuda={ayuda} requerido={c.requerido && !(c.tipo === "password" && editando)} htmlFor={id} className={ancho}>
      {control}
    </Field>
  );
}
