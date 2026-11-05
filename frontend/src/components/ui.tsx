"use client";

import { ImageOff, ImagePlus, Loader2, Search, X } from "lucide-react";
import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { createPortal } from "react-dom";
import { toast } from "sonner";
import { subirImagen, urlImagen } from "@/lib/imagenes";

export function cn(...c: (string | false | null | undefined)[]) {
  return c.filter(Boolean).join(" ");
}

/* ------------------------------------------------------------------ Botón */

type Variante = "primario" | "secundario" | "fantasma" | "peligro";
const VARIANTES: Record<Variante, string> = {
  primario: "bg-cacao-700 text-white shadow-sm hover:bg-cacao-800 active:bg-cacao-900",
  secundario: "bg-white text-stone-700 ring-1 ring-stone-200 shadow-sm hover:bg-stone-50 hover:ring-stone-300",
  fantasma: "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
  peligro: "bg-fresa-600 text-white shadow-sm hover:bg-fresa-700",
};

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variante?: Variante; cargando?: boolean; tam?: "sm" | "md"; icono?: ReactNode }
>(function Button({ variante = "primario", cargando, tam = "md", icono, className, children, disabled, ...p }, ref) {
  return (
    <button
      ref={ref}
      disabled={disabled || cargando}
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cacao-500",
        "disabled:cursor-not-allowed disabled:opacity-60",
        tam === "sm" ? "h-8 px-3 text-sm" : "h-10 px-4 text-sm",
        VARIANTES[variante],
        className,
      )}
      {...p}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" /> : icono}
      {children}
    </button>
  );
});

export function IconButton({
  label,
  className,
  children,
  ...p
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg text-stone-500 transition-colors",
        "hover:bg-stone-100 hover:text-stone-900 focus-visible:outline-2 focus-visible:outline-cacao-500",
        className,
      )}
      {...p}
    >
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ Campos */

const baseCampo =
  "w-full rounded-xl border-0 bg-white px-3 text-sm text-stone-900 ring-1 ring-stone-200 transition-shadow placeholder:text-stone-400 " +
  "focus:outline-none focus:ring-2 focus:ring-cacao-400 disabled:bg-stone-50 disabled:text-stone-500";

export function Field({
  label,
  error,
  ayuda,
  children,
  className,
  requerido,
  htmlFor,
}: {
  label?: string;
  error?: string;
  ayuda?: string;
  children: ReactNode;
  className?: string;
  requerido?: boolean;
  htmlFor?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-sm font-medium text-stone-700">
          {label}
          {requerido && <span className="ml-0.5 text-fresa-600">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-fresa-600">{error}</p>
      ) : ayuda ? (
        <p className="text-xs text-stone-500">{ayuda}</p>
      ) : null}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean; prefijo?: string }>(
  function Input({ className, invalido, prefijo, ...p }, ref) {
    const input = (
      <input
        ref={ref}
        className={cn(baseCampo, "h-10", prefijo && "pl-7", invalido && "ring-fresa-500 focus:ring-fresa-500", className)}
        {...p}
      />
    );
    if (!prefijo) return input;
    return (
      <div className="relative">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">{prefijo}</span>
        {input}
      </div>
    );
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean }>(
  function Textarea({ className, invalido, ...p }, ref) {
    return (
      <textarea
        ref={ref}
        rows={3}
        className={cn(baseCampo, "resize-y py-2.5", invalido && "ring-fresa-500", className)}
        {...p}
      />
    );
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalido?: boolean }>(
  function Select({ className, invalido, children, ...p }, ref) {
    return (
      <select ref={ref} className={cn(baseCampo, "h-10 pr-8", invalido && "ring-fresa-500", className)} {...p}>
        {children}
      </select>
    );
  },
);

export function Switch({
  checked,
  onChange,
  label,
  descripcion,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
  descripcion?: string;
  disabled?: boolean;
  /** Nombre accesible sin texto visible (p. ej. en tablas). */
  ariaLabel?: string;
}) {
  const id = useId();
  return (
    <div className="flex items-start gap-3">
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cacao-500 disabled:opacity-50",
          checked ? "bg-cacao-600" : "bg-stone-300",
        )}
      >
        <span
          className={cn(
            "inline-block size-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-[18px]" : "translate-x-0.5",
          )}
        />
      </button>
      {(label || descripcion) && (
        <label htmlFor={id} className="cursor-pointer select-none">
          {label && <span className="block text-sm font-medium text-stone-700">{label}</span>}
          {descripcion && <span className="block text-xs text-stone-500">{descripcion}</span>}
        </label>
      )}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Buscar…",
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn("relative", className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-stone-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(baseCampo, "h-10 pl-9 pr-8")}
      />
      {value && (
        <button
          type="button"
          aria-label="Limpiar búsqueda"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-stone-400 hover:text-stone-700"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

/** Lista de textos (palabras clave, colores…). Enter o coma agrega. */
export function TagsInput({
  value,
  onChange,
  placeholder = "Escribe y presiona Enter",
  colores,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  colores?: boolean;
}) {
  const [txt, setTxt] = useState("");
  const agregar = () => {
    const t = txt.trim().replace(/,$/, "");
    if (t && !value.includes(t)) onChange([...value, t]);
    setTxt("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl bg-white px-2 py-1.5 ring-1 ring-stone-200 focus-within:ring-2 focus-within:ring-cacao-400">
      {value.map((t) => (
        <span key={t} className="inline-flex items-center gap-1 rounded-lg bg-cacao-50 py-0.5 pl-2 pr-1 text-xs font-medium text-cacao-800 ring-1 ring-cacao-100">
          {colores && <span className="size-3 rounded-full ring-1 ring-black/10" style={{ background: t }} />}
          {t}
          <button type="button" aria-label={`Quitar ${t}`} onClick={() => onChange(value.filter((x) => x !== t))} className="rounded p-0.5 hover:bg-cacao-100">
            <X className="size-3" />
          </button>
        </span>
      ))}
      <input
        value={txt}
        onChange={(e) => setTxt(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            agregar();
          } else if (e.key === "Backspace" && !txt && value.length) {
            onChange(value.slice(0, -1));
          }
        }}
        onBlur={agregar}
        placeholder={value.length ? "" : placeholder}
        className="min-w-24 flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-stone-400"
      />
    </div>
  );
}

export function Thumb({ src, alt, className }: { src?: string | null; alt: string; className?: string }) {
  // Se recuerda qué URL falló: si cambia `src`, se vuelve a intentar sin efectos.
  const [fallida, setFallida] = useState<string | null>(null);
  const roto = !!src && fallida === src;
  if (!src || roto)
    return (
      <div className={cn("flex items-center justify-center rounded-lg bg-stone-100 text-stone-400", className)}>
        <ImageOff className="size-4" />
      </div>
    );
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={urlImagen(src)} alt={alt} loading="lazy" onError={() => setFallida(src)} className={cn("rounded-lg object-cover", className)} />
  );
}

/**
 * Cargador de fotos: clic, arrastrar y soltar o pegar (Ctrl+V).
 * Las fotos se comprimen en el navegador antes de subirse. La primera es la portada.
 */
export function ImagesInput({ value, onChange, max = 6 }: { value: string[]; onChange: (v: string[]) => void; max?: number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const actual = useRef(value);
  useEffect(() => {
    actual.current = value;
  });
  const [subiendo, setSubiendo] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const disponibles = max - value.length - subiendo;

  async function procesar(lista: FileList | File[]) {
    const archivos = Array.from(lista).filter((f) => f.type.startsWith("image/"));
    if (!archivos.length) return;
    const tomar = archivos.slice(0, Math.max(0, disponibles));
    if (tomar.length < archivos.length) toast.warning(max === 1 ? "Solo se permite una imagen." : `Máximo ${max} fotos.`);
    if (!tomar.length) return;
    setSubiendo((n) => n + tomar.length);
    const resultados = await Promise.allSettled(tomar.map((f) => subirImagen(f)));
    setSubiendo((n) => n - tomar.length);
    const urls: string[] = [];
    for (const r of resultados) {
      if (r.status === "fulfilled") urls.push(r.value);
      else toast.error(r.reason instanceof Error ? r.reason.message : "No se pudo subir una imagen");
    }
    if (urls.length) onChange([...actual.current, ...urls]);
  }

  const portada = (u: string) => onChange([u, ...value.filter((x) => x !== u)]);
  const quitar = (u: string) => onChange(value.filter((x) => x !== u));

  return (
    <div
      onPaste={(e) => {
        if (e.clipboardData.files.length) {
          e.preventDefault();
          procesar(e.clipboardData.files);
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        setArrastrando(true);
      }}
      onDragLeave={() => setArrastrando(false)}
      onDrop={(e) => {
        e.preventDefault();
        setArrastrando(false);
        procesar(e.dataTransfer.files);
      }}
      className={cn("rounded-2xl transition-colors", arrastrando && "bg-cacao-50 ring-2 ring-cacao-300")}
    >
      <div className="flex flex-wrap gap-3">
        {value.map((u, i) => (
          <div key={u} className="group relative size-24 sm:size-28">
            <Thumb src={u} alt={`Foto ${i + 1}`} className="size-full ring-1 ring-stone-200" />
            {i === 0 && max > 1 && (
              <span className="absolute bottom-1.5 left-1.5 rounded-md bg-stone-900/70 px-1.5 py-0.5 text-[10px] font-semibold text-white">Portada</span>
            )}
            {i > 0 && (
              <button
                type="button"
                onClick={() => portada(u)}
                className="absolute bottom-1.5 left-1.5 rounded-md bg-white/90 px-1.5 py-0.5 text-[10px] font-semibold text-stone-700 shadow-sm ring-1 ring-stone-200 hover:bg-white sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100"
              >
                Usar de portada
              </button>
            )}
            <button
              type="button"
              aria-label={`Quitar foto ${i + 1}`}
              onClick={() => quitar(u)}
              className="absolute -right-2 -top-2 rounded-full bg-white p-1 text-stone-600 shadow ring-1 ring-stone-200 hover:text-fresa-600"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}

        {Array.from({ length: subiendo }).map((_, i) => (
          <div key={`sub-${i}`} className="flex size-24 flex-col items-center justify-center gap-1.5 rounded-lg bg-stone-50 text-stone-500 ring-1 ring-stone-200 sm:size-28">
            <Loader2 className="size-5 animate-spin text-cacao-500" />
            <span className="text-[11px] font-medium">Subiendo…</span>
          </div>
        ))}

        {disponibles > 0 && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className={cn(
              "flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-stone-300 px-3 text-center text-stone-500 transition-colors",
              "hover:border-cacao-400 hover:bg-cacao-50/60 hover:text-cacao-700 focus-visible:outline-2 focus-visible:outline-cacao-500",
              value.length || subiendo ? "size-24 sm:size-28" : "h-28 w-full",
            )}
          >
            <ImagePlus className="size-6" />
            <span className="text-xs font-semibold">{value.length ? "Agregar" : max === 1 ? "Subir imagen" : "Subir fotos"}</span>
            {!value.length && !subiendo && <span className="text-[11px] text-stone-400">Haz clic, arrastra o pega una imagen. JPG, PNG o WebP.</span>}
          </button>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple={max > 1}
        hidden
        onChange={(e) => {
          if (e.target.files) procesar(e.target.files);
          e.target.value = "";
        }}
      />
    </div>
  );
}

/** Variante de una sola imagen (guarda un string). */
export function ImageInput({ value, onChange }: { value: string | null | undefined; onChange: (v: string) => void }) {
  return <ImagesInput value={value ? [value] : []} onChange={(v) => onChange(v[0] ?? "")} max={1} />;
}

/* ------------------------------------------------------------------ Badges, tarjetas */

const TONOS = {
  gris: "bg-stone-100 text-stone-700 ring-stone-200",
  ambar: "bg-amber-50 text-amber-800 ring-amber-200",
  azul: "bg-sky-50 text-sky-800 ring-sky-200",
  violeta: "bg-violet-50 text-violet-800 ring-violet-200",
  verde: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  rojo: "bg-fresa-50 text-fresa-700 ring-fresa-100",
  cacao: "bg-cacao-50 text-cacao-800 ring-cacao-200",
} as const;
const PUNTOS = {
  gris: "bg-stone-400",
  ambar: "bg-amber-500",
  azul: "bg-sky-500",
  violeta: "bg-violet-500",
  verde: "bg-emerald-500",
  rojo: "bg-fresa-500",
  cacao: "bg-cacao-500",
} as const;
export type Tono = keyof typeof TONOS;

export function Badge({ tono = "gris", children, punto }: { tono?: Tono; children: ReactNode; punto?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset", TONOS[tono])}>
      {punto && <span className={cn("size-1.5 rounded-full", PUNTOS[tono])} />}
      {children}
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-2xl bg-white shadow-sm ring-1 ring-stone-200/70", className)}>{children}</div>;
}

export function PageHeader({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-stone-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-stone-500">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2">{acciones}</div>}
    </div>
  );
}

export function EmptyState({ icono, titulo, texto, accion }: { icono: ReactNode; titulo: string; texto?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-cacao-50 text-cacao-600 ring-1 ring-cacao-100">{icono}</div>
      <h3 className="font-semibold text-stone-900">{titulo}</h3>
      {texto && <p className="mt-1 max-w-sm text-sm text-stone-500">{texto}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-lg bg-stone-200/70", className)} />;
}

export function Segmentado<T extends string>({
  opciones,
  valor,
  onChange,
}: {
  opciones: { valor: T; label: string; cuenta?: number }[];
  valor: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="scroll-fino flex max-w-full gap-1 overflow-x-auto rounded-xl bg-stone-100 p-1">
      {opciones.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => onChange(o.valor)}
          className={cn(
            "flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
            valor === o.valor ? "bg-white text-stone-900 shadow-sm" : "text-stone-500 hover:text-stone-800",
          )}
        >
          {o.label}
          {o.cuenta !== undefined && (
            <span className={cn("rounded-full px-1.5 text-xs", valor === o.valor ? "bg-cacao-100 text-cacao-800" : "bg-stone-200 text-stone-600")}>
              {o.cuenta}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ Modal */

export function Modal({
  abierto,
  onCerrar,
  titulo,
  descripcion,
  children,
  pie,
  ancho = "md",
}: {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: "sm" | "md" | "lg" | "xl";
}) {
  const panel = useRef<HTMLDivElement>(null);
  const cerrarRef = useRef(onCerrar);
  useEffect(() => {
    cerrarRef.current = onCerrar;
  });

  useEffect(() => {
    if (!abierto) return;
    const previo = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && cerrarRef.current();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    setTimeout(() => panel.current?.querySelector<HTMLElement>("input,select,textarea")?.focus(), 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previo?.focus();
    };
  }, [abierto]);

  if (!abierto) return null;
  const anchos = { sm: "sm:max-w-md", md: "sm:max-w-xl", lg: "sm:max-w-3xl", xl: "sm:max-w-5xl" };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div className="animate-entrar absolute inset-0 bg-stone-900/40 backdrop-blur-[2px]" onClick={onCerrar} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        className={cn(
          "animate-subir relative flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:rounded-2xl",
          anchos[ancho],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-stone-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-stone-900">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-stone-500">{descripcion}</p>}
          </div>
          <IconButton label="Cerrar" onClick={onCerrar} className="-mr-2">
            <X className="size-5" />
          </IconButton>
        </div>
        <div className="scroll-fino flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {pie && <div className="flex justify-end gap-2 border-t border-stone-100 bg-stone-50/60 px-6 py-3 sm:rounded-b-2xl">{pie}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function ConfirmDialog({
  abierto,
  titulo,
  texto,
  confirmar = "Eliminar",
  cargando,
  onConfirmar,
  onCerrar,
}: {
  abierto: boolean;
  titulo: string;
  texto: ReactNode;
  confirmar?: string;
  cargando?: boolean;
  onConfirmar: () => void;
  onCerrar: () => void;
}) {
  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={titulo}
      ancho="sm"
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button variante="peligro" cargando={cargando} onClick={onConfirmar}>
            {confirmar}
          </Button>
        </>
      }
    >
      <div className="text-sm text-stone-600">{texto}</div>
    </Modal>
  );
}
