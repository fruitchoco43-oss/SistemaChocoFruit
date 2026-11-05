import {
  ArrowRight,
  Banknote,
  CalendarHeart,
  Clock,
  CreditCard,
  Gift,
  HandHeart,
  Heart,
  Landmark,
  MapPin,
  MessageSquareHeart,
  Palette,
  PartyPopper,
  Store,
  Truck,
  WalletCards,
} from "lucide-react";
import type { ReactNode } from "react";
import { Isotipo, Logo } from "@/components/Logo";
import { ActualizarEnVivo } from "@/components/publico/ActualizarEnVivo";
import { Asistente } from "@/components/publico/Asistente";
import { Catalogo } from "@/components/publico/Catalogo";
import { CopiarDatos } from "@/components/publico/CopiarDatos";
import { Encabezado } from "@/components/publico/Encabezado";
import { IconoWhatsApp } from "@/components/publico/IconoWhatsApp";
import { FresaIlustracion } from "@/components/publico/Ilustracion";
import { Thumb } from "@/components/ui";
import { fmtDinero } from "@/lib/format";
import { MARCA } from "@/lib/marca";
import { cargarCatalogo, cargarChatbot, enlaceWhatsApp, MENSAJE_GENERAL, numeroWhatsApp } from "@/lib/publico";

// Siempre con datos frescos; además <ActualizarEnVivo /> refresca sin F5 cuando cambia algo en el panel.
export const dynamic = "force-dynamic";

const OCASIONES = ["Cumpleaños", "Aniversarios", "San Valentín", "Día de la Madre", "Graduaciones", "Baby showers", "Agradecimientos", "Solo porque sí"];

function Titulo({ etiqueta, titulo, texto, centro = true }: { etiqueta: string; titulo: ReactNode; texto?: string; centro?: boolean }) {
  return (
    <div className={centro ? "mx-auto mb-12 max-w-2xl text-center" : "mb-10 max-w-xl"}>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rosa-500">{etiqueta}</p>
      <h2 className="mt-3 font-display text-4xl font-semibold leading-tight tracking-tight text-stone-900 sm:text-5xl">{titulo}</h2>
      {texto && <p className="mt-4 text-lg text-stone-600">{texto}</p>}
    </div>
  );
}

export default async function Inicio() {
  const [cat, chatbot] = await Promise.all([cargarCatalogo(), cargarChatbot()]);
  const wa = numeroWhatsApp(cat.negocio);
  const destacados = cat.productos.filter((p) => p.destacado && p.imagenes[0]).slice(0, 3);
  const datosBanco = cat.negocio?.datos_transferencia || MARCA.transferencia;
  const negocio = cat.negocio;

  return (
    <>
      <Encabezado whatsapp={wa} conEventos conGaleria={cat.galeria.length > 0} />

      <main id="inicio" className="overflow-x-clip bg-white">
        {/* ============================== HERO */}
        <section className="relative isolate pt-28 sm:pt-32 lg:pt-36">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(60rem_40rem_at_85%_0%,var(--color-rosa-100),transparent_60%),radial-gradient(40rem_30rem_at_0%_30%,var(--color-rosa-50),transparent_70%)]" />
          <div
            className="absolute inset-0 -z-10 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
            style={{ backgroundImage: "radial-gradient(var(--color-rosa-200) 1px, transparent 1px)", backgroundSize: "22px 22px" }}
          />
          <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:px-8 lg:pb-28">
            <div className="animate-aparecer text-center lg:text-left">
              <p className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-rosa-700 shadow-sm ring-1 ring-rosa-100">
                <Heart className="size-4 fill-rosa-500 text-rosa-500" /> Regalos dulces hechos a mano en Quito
              </p>
              <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-stone-900 sm:text-6xl lg:text-7xl">
                Somos tus <span className="italic text-rosa-600">cómplices</span>
              </h1>
              <p className="mt-4 font-display text-2xl leading-snug text-stone-700 sm:text-3xl">al momento de sorprender a las personas que más amas.</p>
              <p className="mx-auto mt-6 max-w-xl text-lg text-stone-600 lg:mx-0">
                Fresas con chocolate, pasteles, gelatinas artísticas y bocaditos personalizados para cada ocasión, con entrega a domicilio en {MARCA.ciudad}.
              </p>
              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                <a
                  href="#catalogo"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-rosa-600 px-7 py-4 text-base font-semibold text-white shadow-xl shadow-rosa-600/30 transition hover:-translate-y-0.5 hover:bg-rosa-700"
                >
                  Ver catálogo <ArrowRight className="size-5" />
                </a>
                <a
                  href={enlaceWhatsApp(wa, MENSAJE_GENERAL)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-7 py-4 text-base font-semibold text-rosa-700 ring-2 ring-rosa-200 transition hover:-translate-y-0.5 hover:ring-rosa-400"
                >
                  <IconoWhatsApp className="size-5" /> Pedir por WhatsApp
                </a>
              </div>
              <dl className="mx-auto mt-12 grid max-w-lg grid-cols-3 gap-4 lg:mx-0">
                {[
                  { icono: Palette, t: "100% personalizado" },
                  { icono: HandHeart, t: "Hecho a mano" },
                  { icono: Truck, t: "Entrega a domicilio" },
                ].map((x) => (
                  <div key={x.t} className="flex flex-col items-center gap-2 text-center lg:items-start lg:text-left">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-rosa-50 text-rosa-600 ring-1 ring-rosa-100">
                      <x.icono className="size-5" />
                    </span>
                    <dt className="text-sm font-semibold text-stone-800">{x.t}</dt>
                  </div>
                ))}
              </dl>
            </div>

            {/* Visual */}
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              <div className="absolute inset-[6%] -z-10 rounded-full bg-gradient-to-br from-rosa-300 via-rosa-400 to-rosa-600 opacity-90 blur-[2px]" />
              <div className="absolute inset-[2%] -z-20 rounded-full border-2 border-dashed border-rosa-200" />
              {destacados.length >= 2 ? (
                <div className="relative aspect-square">
                  {destacados.map((p, i) => (
                    <div
                      key={p.id}
                      className={[
                        "absolute overflow-hidden rounded-[2rem] bg-white p-2 shadow-2xl shadow-rosa-900/20",
                        i === 0 ? "left-[14%] top-[10%] w-[58%] rotate-[-4deg]" : i === 1 ? "bottom-[6%] right-[4%] w-[46%] rotate-[5deg]" : "bottom-[14%] left-[4%] w-[34%] rotate-[-8deg]",
                      ].join(" ")}
                    >
                      <Thumb src={p.imagenes[0]} alt={p.nombre} className="aspect-square w-full rounded-[1.5rem]" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="relative flex aspect-square items-center justify-center">
                  <FresaIlustracion className="animate-flotar w-[62%] drop-shadow-[0_30px_40px_rgba(95,17,49,0.35)]" />
                </div>
              )}
              <div className="animate-flotar absolute left-0 top-[12%] flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-rosa-900/10 ring-1 ring-rosa-100 backdrop-blur [animation-delay:-2s]">
                <span className="flex size-10 items-center justify-center rounded-xl bg-rosa-100 text-rosa-600">
                  <Gift className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Con nombre y dedicatoria</p>
                  <p className="text-xs text-stone-500">Tú eliges cada detalle</p>
                </div>
              </div>
              <div className="animate-flotar absolute bottom-[8%] right-0 flex items-center gap-3 rounded-2xl bg-white/95 px-4 py-3 shadow-xl shadow-rosa-900/10 ring-1 ring-rosa-100 backdrop-blur [animation-delay:-4s]">
                <span className="flex size-10 items-center justify-center rounded-xl bg-rosa-100 text-rosa-600">
                  <MapPin className="size-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-stone-900">Quito y los valles</p>
                  <p className="text-xs text-stone-500">Entrega a domicilio</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================== OCASIONES */}
        <section aria-label="Ocasiones" className="bg-gradient-to-r from-rosa-600 via-rosa-500 to-rosa-600 py-5">
          <ul className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 font-display text-lg italic text-white sm:text-xl">
            {OCASIONES.map((o, i) => (
              <li key={o} className="flex items-center gap-6">
                {o}
                {i < OCASIONES.length - 1 && <Heart className="size-3.5 fill-white/70 text-white/70" aria-hidden />}
              </li>
            ))}
          </ul>
        </section>

        {/* ============================== CATÁLOGO */}
        <section id="catalogo" className="relative bg-gradient-to-b from-rosa-50/70 to-white py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Titulo
              etiqueta="Nuestro catálogo"
              titulo={
                <>
                  Detalles que <span className="italic text-rosa-600">enamoran</span>
                </>
              }
              texto="Elige tu favorito, personalízalo y envíanos tu pedido por WhatsApp en un solo paso."
            />
            <Catalogo productos={cat.productos} categorias={cat.categorias} complementos={cat.complementos} whatsapp={wa} />
          </div>
        </section>

        {/* ============================== CÓMO PEDIR */}
        <section id="como-pedir" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Titulo etiqueta="Así de fácil" titulo="¿Cómo hago mi pedido?" />
            <ol className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icono: Gift, t: "Elige", d: "Escoge tu producto favorito del catálogo." },
                { icono: Palette, t: "Personaliza", d: "Colores, nombre, dedicatoria y complementos." },
                { icono: MessageSquareHeart, t: "Envía por WhatsApp", d: "Tu pedido llega listo a nuestro chat. Te confirmamos disponibilidad y envío." },
                { icono: WalletCards, t: "Confirma con el 50%", d: "Con el anticipo registramos tu pedido y empezamos a prepararlo." },
              ].map((p, i) => (
                <li key={p.t} className="relative rounded-3xl bg-white p-7 shadow-sm ring-1 ring-rosa-100">
                  <span className="absolute right-6 top-5 font-display text-6xl font-semibold text-rosa-100">{i + 1}</span>
                  <span className="relative flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rosa-500 to-rosa-600 text-white shadow-lg shadow-rosa-500/30">
                    <p.icono className="size-6" />
                  </span>
                  <h3 className="relative mt-6 font-display text-2xl font-semibold text-stone-900">{p.t}</h3>
                  <p className="relative mt-2 text-stone-600">{p.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ============================== EVENTOS */}
        <section id="eventos" className="relative overflow-hidden bg-rosa-900 py-24 text-white">
          <div className="absolute -right-32 -top-32 size-[28rem] rounded-full bg-rosa-600/40 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 size-[26rem] rounded-full bg-rosa-500/30 blur-3xl" />
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-rosa-300">Eventos</p>
              <h2 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
                Endulzamos tu <span className="italic text-rosa-300">celebración</span>
              </h2>
              <p className="mt-4 text-lg text-rosa-100">Alquiler de máquinas y mesas de postres para cumpleaños, bodas, empresas y más.</p>
            </div>
            {cat.maquinas.length > 0 ? (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {cat.maquinas.map((m) => (
                  <article key={m.id} className="flex flex-col overflow-hidden rounded-3xl bg-white/[0.06] ring-1 ring-white/15 backdrop-blur">
                    <Thumb src={m.imagenes[0]} alt={m.nombre} className="aspect-[16/10] w-full rounded-none bg-white/10" />
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="font-display text-2xl font-semibold">{m.nombre}</h3>
                      <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-rosa-200">
                        <Clock className="size-4" /> {m.duracion_horas} horas de servicio
                      </p>
                      {m.descripcion && <p className="mt-3 text-sm text-rosa-50/90">{m.descripcion}</p>}
                      {m.condiciones && <p className="mt-3 text-xs text-rosa-200/80">{m.condiciones}</p>}
                      <div className="mt-auto flex items-end justify-between gap-3 pt-6">
                        <p className="font-display text-3xl font-semibold">{fmtDinero(m.precio)}</p>
                        <a
                          href={enlaceWhatsApp(wa, `Hola, ${MARCA.nombre}. Quiero cotizar el alquiler de: ${m.nombre}. Fecha del evento: `)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rosa-800 transition hover:bg-rosa-100"
                        >
                          <IconoWhatsApp className="size-4" /> Reservar
                        </a>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 rounded-3xl bg-white/[0.06] p-10 text-center ring-1 ring-white/15 backdrop-blur sm:flex-row sm:text-left">
                <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-rosa-500/30 text-rosa-100">
                  <PartyPopper className="size-8" />
                </span>
                <div className="flex-1">
                  <h3 className="font-display text-2xl font-semibold">¿Tienes un evento?</h3>
                  <p className="mt-1 text-rosa-100">Cuéntanos la fecha y el número de invitados y te armamos una propuesta a tu medida.</p>
                </div>
                <a
                  href={enlaceWhatsApp(wa, `Hola, ${MARCA.nombre}. Quiero cotizar para un evento. Fecha: `)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white px-6 py-3 font-semibold text-rosa-800 transition hover:bg-rosa-100"
                >
                  <CalendarHeart className="size-5" /> Cotizar evento
                </a>
              </div>
            )}
          </div>
        </section>

        {/* ============================== ENTREGAS Y PAGOS */}
        <section id="entregas" className="py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Titulo etiqueta="Entregas y pagos" titulo="Todo claro desde el inicio" />
            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-3xl bg-rosa-50 p-7 ring-1 ring-rosa-100">
                <Truck className="size-8 text-rosa-600" />
                <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">Entrega a domicilio</h3>
                <p className="mt-2 text-stone-600">
                  Llevamos tu pedido en {MARCA.ciudad} mediante Uber. El costo del envío depende de tu sector y te lo confirmamos al momento de tu pedido.
                </p>
                {cat.zonas.length > 0 && (
                  <ul className="mt-5 space-y-2 text-sm">
                    {cat.zonas.map((z) => (
                      <li key={z.id} className="flex justify-between gap-3 border-b border-rosa-100 pb-2 last:border-0">
                        <span className="text-stone-700">{z.nombre}</span>
                        <span className="font-semibold text-stone-900">{z.costo_envio ? `desde ${fmtDinero(z.costo_envio)}` : "Gratis"}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="rounded-3xl bg-rosa-50 p-7 ring-1 ring-rosa-100">
                <Store className="size-8 text-rosa-600" />
                <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">Retiro en el local</h3>
                <p className="mt-2 text-stone-600">¿Prefieres pasar por tu pedido? Puedes retirarlo en nuestro local el día acordado.</p>
                <ul className="mt-5 space-y-3 text-sm text-stone-700">
                  {negocio?.direccion && (
                    <li className="flex gap-2">
                      <MapPin className="size-4 shrink-0 text-rosa-500" /> {negocio.direccion}
                    </li>
                  )}
                  {negocio?.horario && (
                    <li className="flex gap-2">
                      <Clock className="size-4 shrink-0 text-rosa-500" /> {negocio.horario}
                    </li>
                  )}
                </ul>
              </div>
              <div className="rounded-3xl bg-rosa-50 p-7 ring-1 ring-rosa-100">
                <WalletCards className="size-8 text-rosa-600" />
                <h3 className="mt-5 font-display text-2xl font-semibold text-stone-900">Formas de pago</h3>
                <ul className="mt-4 space-y-3 text-stone-700">
                  {[
                    { icono: Landmark, t: "Transferencia bancaria" },
                    { icono: CreditCard, t: "Tarjeta de crédito" },
                    { icono: Banknote, t: "Efectivo" },
                  ].map((f) => (
                    <li key={f.t} className="flex items-center gap-3">
                      <f.icono className="size-5 text-rosa-500" /> {f.t}
                    </li>
                  ))}
                </ul>
                <p className="mt-5 rounded-2xl bg-white px-4 py-3 text-sm text-stone-700 ring-1 ring-rosa-100">
                  Para registrar tu pedido se requiere el <b className="text-rosa-700">50% de anticipo</b>.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col items-start justify-between gap-6 rounded-3xl bg-gradient-to-br from-rosa-600 to-rosa-700 p-8 text-white shadow-xl shadow-rosa-600/20 sm:flex-row sm:items-center">
              <div className="flex items-start gap-5">
                <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                  <Landmark className="size-7" />
                </span>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wider text-rosa-200">Datos para transferencia</p>
                  <p className="mt-2 whitespace-pre-line text-lg leading-relaxed">{datosBanco}</p>
                </div>
              </div>
              <CopiarDatos texto={datosBanco} />
            </div>
          </div>
        </section>

        {/* ============================== GALERÍA */}
        {cat.galeria.length > 0 && (
          <section id="galeria" className="bg-gradient-to-b from-white to-rosa-50/70 py-24">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
              <Titulo
                etiqueta="Galería"
                titulo={
                  <>
                    Sorpresas que ya <span className="italic text-rosa-600">entregamos</span>
                  </>
                }
              />
              <div className="columns-2 gap-4 md:columns-3 lg:columns-4">
                {cat.galeria.map((g) => (
                  <figure key={g.id} className="group relative mb-4 break-inside-avoid overflow-hidden rounded-3xl ring-1 ring-rosa-100">
                    <Thumb src={g.imagen} alt={g.titulo ?? "Trabajo realizado"} className="w-full rounded-none transition duration-500 group-hover:scale-105" />
                    {g.titulo && (
                      <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-sm font-semibold text-white">
                        {g.titulo}
                      </figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ============================== LLAMADO FINAL */}
        <section className="px-4 py-24 sm:px-6 lg:px-8">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rosa-500 via-rosa-600 to-rosa-700 px-6 py-16 text-center text-white shadow-2xl shadow-rosa-600/30 sm:px-12">
            <div className="absolute -left-10 -top-10 size-48 rounded-full bg-white/10" />
            <div className="absolute -bottom-16 -right-10 size-64 rounded-full bg-white/10" />
            <Isotipo className="relative mx-auto size-16 drop-shadow-lg" />
            <h2 className="relative mt-6 font-display text-4xl font-semibold leading-tight sm:text-5xl">¿Lista la sorpresa?</h2>
            <p className="relative mx-auto mt-4 max-w-xl text-lg text-rosa-50">Escríbenos y la preparamos juntos. Nosotros nos encargamos de que sea inolvidable.</p>
            <a
              href={enlaceWhatsApp(wa, MENSAJE_GENERAL)}
              target="_blank"
              rel="noreferrer"
              className="relative mt-9 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-rosa-700 shadow-xl transition hover:-translate-y-0.5 hover:bg-rosa-50"
            >
              <IconoWhatsApp className="size-5" /> Escríbenos por WhatsApp
            </a>
          </div>
        </section>
      </main>

      {/* ============================== PIE */}
      <footer className="border-t border-rosa-100 bg-rosa-50/60">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:px-8">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-sm text-stone-600">{MARCA.lema}.</p>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-stone-900">Contacto</p>
            <ul className="mt-3 space-y-2 text-stone-600">
              <li>
                <a href={enlaceWhatsApp(wa, MENSAJE_GENERAL)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 hover:text-rosa-700">
                  <IconoWhatsApp className="size-4" /> WhatsApp
                </a>
              </li>
              <li>
                <a href={`mailto:${MARCA.correo}`} className="hover:text-rosa-700">
                  {MARCA.correo}
                </a>
              </li>
              {negocio?.direccion && <li>{negocio.direccion}</li>}
              {negocio?.horario && <li>{negocio.horario}</li>}
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-semibold text-stone-900">Síguenos</p>
            <ul className="mt-3 space-y-2 text-stone-600">
              {negocio?.instagram && (
                <li>
                  <a href={negocio.instagram} target="_blank" rel="noreferrer" className="hover:text-rosa-700">
                    Instagram
                  </a>
                </li>
              )}
              {negocio?.facebook && (
                <li>
                  <a href={negocio.facebook} target="_blank" rel="noreferrer" className="hover:text-rosa-700">
                    Facebook
                  </a>
                </li>
              )}
              {negocio?.tiktok && (
                <li>
                  <a href={negocio.tiktok} target="_blank" rel="noreferrer" className="hover:text-rosa-700">
                    TikTok
                  </a>
                </li>
              )}
              {!negocio?.instagram && !negocio?.facebook && !negocio?.tiktok && <li>Muy pronto en redes sociales.</li>}
            </ul>
          </div>
        </div>
        <div className="border-t border-rosa-100 py-6 text-center text-xs text-stone-500">
          © {new Date().getFullYear()} {MARCA.nombre}. Todos los derechos reservados.
        </div>
      </footer>

      <Asistente nodos={chatbot} whatsapp={wa} />
      <ActualizarEnVivo />
    </>
  );
}
