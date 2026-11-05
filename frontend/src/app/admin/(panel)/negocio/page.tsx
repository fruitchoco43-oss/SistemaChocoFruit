"use client";

import { Landmark, MessageCircle, Save, Share2, Store } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button, Card, Field, Input, PageHeader, Skeleton, Textarea } from "@/components/ui";
import { api, ApiError } from "@/lib/api";
import { linkWhatsApp } from "@/lib/format";
import { useApi } from "@/lib/hooks";
import type { InfoNegocio } from "@/lib/types";

const VACIO: InfoNegocio = {
  whatsapp: "",
  datos_transferencia: "",
  horario: "",
  direccion: "",
  instagram: "",
  facebook: "",
  tiktok: "",
  texto_inicio: "",
};

function Seccion({ icono, titulo, texto, children }: { icono: ReactNode; titulo: string; texto: string; children: ReactNode }) {
  return (
    <Card className="grid gap-6 p-6 lg:grid-cols-[260px_1fr]">
      <div>
        <div className="mb-2 flex size-9 items-center justify-center rounded-xl bg-cacao-50 text-cacao-700 ring-1 ring-cacao-100">{icono}</div>
        <h2 className="font-semibold text-stone-900">{titulo}</h2>
        <p className="mt-1 text-sm text-stone-500">{texto}</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </Card>
  );
}

export default function NegocioPage() {
  const { data, cargando } = useApi<InfoNegocio | null>("/api/negocio");
  if (cargando)
    return (
      <>
        <Skeleton className="mb-6 h-8 w-64" />
        <Skeleton className="mb-4 h-48" />
        <Skeleton className="h-48" />
      </>
    );
  return <FormularioNegocio inicial={data} />;
}

function FormularioNegocio({ inicial }: { inicial: InfoNegocio | null }) {
  const [f, setF] = useState<InfoNegocio>(
    () => Object.fromEntries(Object.entries({ ...VACIO, ...(inicial ?? {}) }).map(([k, v]) => [k, v ?? ""])) as unknown as InfoNegocio,
  );
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [guardando, setGuardando] = useState(false);

  const set = (k: keyof InfoNegocio) => (e: { target: { value: string } }) => setF((x) => ({ ...x, [k]: e.target.value }));

  async function guardar(e: FormEvent) {
    e.preventDefault();
    setGuardando(true);
    setErrores({});
    try {
      const body = Object.fromEntries(Object.entries(f).map(([k, v]) => [k, typeof v === "string" && v.trim() === "" ? null : v?.trim()]));
      body.whatsapp = (f.whatsapp || "").replace(/\D/g, "");
      await api("/api/negocio", { method: "PUT", body });
      toast.success("Datos guardados");
    } catch (err) {
      if (err instanceof ApiError) {
        setErrores(err.fieldErrors);
        toast.error(err.fieldErrors.whatsapp ? "Revisa el número de WhatsApp" : err.message);
      }
    } finally {
      setGuardando(false);
    }
  }

  return (
    <form onSubmit={guardar}>
      <PageHeader
        titulo="Datos del negocio"
        descripcion="Información que aparece en la página pública y en los mensajes de WhatsApp."
        acciones={
          <Button type="submit" cargando={guardando} icono={<Save className="size-4" />}>
            Guardar
          </Button>
        }
      />
      <div className="space-y-4">
        <Seccion icono={<MessageCircle className="size-5" />} titulo="WhatsApp" texto="Número donde llegan los pedidos de la página.">
          <Field
            label="Número de WhatsApp"
            requerido
            error={errores.whatsapp && "Escribe solo números con código de país, ej.: 593991234567"}
            ayuda="Con código de país, sin + ni espacios. Ej.: 593991234567"
            htmlFor="wa"
          >
            <Input id="wa" inputMode="numeric" value={f.whatsapp} onChange={set("whatsapp")} placeholder="593991234567" invalido={!!errores.whatsapp} />
          </Field>
          <div className="flex items-end">
            {f.whatsapp.replace(/\D/g, "").length >= 8 && (
              <a href={linkWhatsApp(f.whatsapp, "Hola, prueba desde el panel")} target="_blank" rel="noreferrer" className="mb-2 text-sm font-medium text-emerald-700 hover:underline">
                Probar enlace →
              </a>
            )}
          </div>
        </Seccion>

        <Seccion icono={<Store className="size-5" />} titulo="Tienda" texto="Horario, ubicación y el texto de bienvenida de la página.">
          <Field label="Horario de atención" htmlFor="horario">
            <Input id="horario" value={f.horario ?? ""} onChange={set("horario")} placeholder="Lun a Sáb, 9:00 – 19:00" />
          </Field>
          <Field label="Dirección" htmlFor="dir">
            <Input id="dir" value={f.direccion ?? ""} onChange={set("direccion")} placeholder="Solo entregas a domicilio" />
          </Field>
          <Field label="Texto de bienvenida" className="sm:col-span-2" htmlFor="ini">
            <Textarea id="ini" rows={3} value={f.texto_inicio ?? ""} onChange={set("texto_inicio")} placeholder="Regalos que endulzan cualquier momento…" />
          </Field>
        </Seccion>

        <Seccion icono={<Landmark className="size-5" />} titulo="Pagos" texto="Se muestran al cliente para que haga la transferencia.">
          <Field label="Datos para transferencia" className="sm:col-span-2" htmlFor="tr">
            <Textarea
              id="tr"
              rows={5}
              value={f.datos_transferencia ?? ""}
              onChange={set("datos_transferencia")}
              placeholder={"Banco Pichincha\nCuenta de ahorros: 2200000000\nA nombre de: …\nCédula: …"}
            />
          </Field>
        </Seccion>

        <Seccion icono={<Share2 className="size-5" />} titulo="Redes sociales" texto="Enlaces completos a los perfiles.">
          <Field label="Instagram" htmlFor="ig">
            <Input id="ig" value={f.instagram ?? ""} onChange={set("instagram")} placeholder="https://instagram.com/…" />
          </Field>
          <Field label="Facebook" htmlFor="fb">
            <Input id="fb" value={f.facebook ?? ""} onChange={set("facebook")} placeholder="https://facebook.com/…" />
          </Field>
          <Field label="TikTok" htmlFor="tt">
            <Input id="tt" value={f.tiktok ?? ""} onChange={set("tiktok")} placeholder="https://tiktok.com/@…" />
          </Field>
        </Seccion>
      </div>
    </form>
  );
}
