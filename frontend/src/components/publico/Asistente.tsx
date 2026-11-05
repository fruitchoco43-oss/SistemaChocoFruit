"use client";

import { MessageCircleQuestion, RotateCcw, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Isotipo } from "@/components/Logo";
import { cn } from "@/components/ui";
import { MARCA } from "@/lib/marca";
import { enlaceWhatsApp, MENSAJE_GENERAL } from "@/lib/publico";
import type { ChatbotNodo } from "@/lib/types";
import { IconoWhatsApp } from "./IconoWhatsApp";

interface Mensaje {
  de: "bot" | "cliente";
  texto: string;
  whatsapp?: string;
}

/** Respuestas por defecto mientras no se configure el chatbot en el panel. */
function nodosPorDefecto(): ChatbotNodo[] {
  const base = { padre_id: null, accion_whatsapp: false, mensaje_whatsapp: null, activo: true, palabras_clave: [] as string[] };
  return [
    { ...base, id: -1, orden: 1, etiqueta: "¿Qué productos tienen?", respuesta: "Preparamos fresas con chocolate, pasteles, gelatinas artísticas y bocaditos. Puedes verlos en el catálogo y personalizarlos.", palabras_clave: ["producto", "venden", "catálogo", "catalogo"] },
    { ...base, id: -2, orden: 2, etiqueta: "Entregas", respuesta: "Entregamos a domicilio en Quito y los valles mediante Uber; el costo depende de tu sector. También puedes retirar en nuestro local.", palabras_clave: ["entrega", "envío", "envio", "domicilio", "uber", "delivery"] },
    { ...base, id: -3, orden: 3, etiqueta: "Formas de pago", respuesta: "Aceptamos transferencia, tarjeta de crédito y efectivo. Para registrar tu pedido se requiere el 50% de anticipo.", palabras_clave: ["pago", "pagar", "transferencia", "tarjeta", "anticipo", "efectivo"] },
    { ...base, id: -4, orden: 4, etiqueta: "Hacer un pedido", respuesta: "Con gusto. Escríbenos por WhatsApp y te ayudamos a armar tu pedido.", accion_whatsapp: true, mensaje_whatsapp: MENSAJE_GENERAL, palabras_clave: ["pedido", "comprar", "pedir", "quiero"] },
  ];
}

const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

export function Asistente({ nodos: nodosApi, whatsapp }: { nodos: ChatbotNodo[]; whatsapp: string }) {
  const nodos = useMemo(() => (nodosApi.length ? nodosApi : nodosPorDefecto()), [nodosApi]);
  const saludo: Mensaje = { de: "bot", texto: `Hola, bienvenido a ${MARCA.nombre}. ¿En qué te podemos ayudar?` };
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([saludo]);
  const [actual, setActual] = useState<number | null>(null);
  const [texto, setTexto] = useState("");
  const fin = useRef<HTMLDivElement>(null);

  const opciones = nodos.filter((n) => n.padre_id === actual).sort((a, b) => a.orden - b.orden);

  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensajes, abierto]);

  function responder(n: ChatbotNodo, pregunta: string) {
    setMensajes((m) => [
      ...m,
      { de: "cliente", texto: pregunta },
      { de: "bot", texto: n.respuesta, whatsapp: n.accion_whatsapp ? n.mensaje_whatsapp || MENSAJE_GENERAL : undefined },
    ]);
    setActual(nodos.some((x) => x.padre_id === n.id) ? n.id : null);
  }

  function preguntar(e: FormEvent) {
    e.preventDefault();
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    const q = normalizar(t);
    const coincide = nodos.find((n) => n.palabras_clave.some((k) => k && q.includes(normalizar(k)))) ?? nodos.find((n) => q.includes(normalizar(n.etiqueta)));
    if (coincide) return responder(coincide, t);
    setMensajes((m) => [
      ...m,
      { de: "cliente", texto: t },
      { de: "bot", texto: "No tengo una respuesta exacta para eso, pero con gusto te atendemos por WhatsApp.", whatsapp: `Hola, ${MARCA.nombre}. Tengo una consulta: ${t}` },
    ]);
  }

  function reiniciar() {
    setMensajes([saludo]);
    setActual(null);
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-3 sm:bottom-6 sm:right-6">
      {abierto && (
        <section
          aria-label="Asistente virtual"
          className="animate-subir flex h-[min(560px,calc(100dvh-7rem))] w-[calc(100vw-2rem)] max-w-sm flex-col overflow-hidden rounded-3xl bg-white shadow-2xl shadow-rosa-900/20 ring-1 ring-rosa-100"
        >
          <header className="flex items-center gap-3 bg-gradient-to-r from-rosa-600 to-rosa-500 px-4 py-3 text-white">
            <Isotipo className="size-9 rounded-full ring-2 ring-white/60" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{MARCA.nombre}</p>
              <p className="text-xs text-rosa-100">Asistente virtual</p>
            </div>
            <button type="button" aria-label="Reiniciar conversación" onClick={reiniciar} className="rounded-full p-2 hover:bg-white/15">
              <RotateCcw className="size-4" />
            </button>
            <button type="button" aria-label="Cerrar asistente" onClick={() => setAbierto(false)} className="rounded-full p-2 hover:bg-white/15">
              <X className="size-5" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-rosa-50/60 p-4" aria-live="polite">
            {mensajes.map((m, i) => (
              <div key={i} className={cn("flex", m.de === "cliente" && "justify-end")}>
                <div
                  className={cn(
                    "max-w-[85%] whitespace-pre-line rounded-2xl px-3.5 py-2.5 text-sm",
                    m.de === "bot" ? "rounded-tl-sm bg-white text-stone-800 shadow-sm ring-1 ring-rosa-100" : "rounded-tr-sm bg-rosa-600 text-white",
                  )}
                >
                  {m.texto}
                  {m.whatsapp && (
                    <a
                      href={enlaceWhatsApp(whatsapp, m.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                    >
                      <IconoWhatsApp className="size-4" /> Escribir por WhatsApp
                    </a>
                  )}
                </div>
              </div>
            ))}
            <div className="flex flex-wrap justify-end gap-1.5 pt-1">
              {opciones.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  onClick={() => responder(o, o.etiqueta)}
                  className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-rosa-700 ring-1 ring-rosa-200 transition hover:bg-rosa-600 hover:text-white"
                >
                  {o.etiqueta}
                </button>
              ))}
              {actual !== null && (
                <button type="button" onClick={() => setActual(null)} className="rounded-full px-3 py-1.5 text-xs font-semibold text-stone-500 hover:bg-white">
                  Volver al menú
                </button>
              )}
            </div>
            <div ref={fin} />
          </div>

          <form onSubmit={preguntar} className="flex items-center gap-2 border-t border-rosa-100 bg-white p-3">
            <input
              value={texto}
              onChange={(e) => setTexto(e.target.value)}
              placeholder="Escribe tu pregunta…"
              aria-label="Escribe tu pregunta"
              className="h-10 flex-1 rounded-full bg-rosa-50 px-4 text-sm outline-none ring-1 ring-rosa-100 placeholder:text-stone-400 focus:ring-2 focus:ring-rosa-400"
            />
            <button type="submit" aria-label="Enviar" className="flex size-10 items-center justify-center rounded-full bg-rosa-600 text-white hover:bg-rosa-700">
              <Send className="size-4" />
            </button>
          </form>
        </section>
      )}

      <div className="flex items-center gap-3">
        <a
          href={enlaceWhatsApp(whatsapp, MENSAJE_GENERAL)}
          target="_blank"
          rel="noreferrer"
          aria-label="Escribir por WhatsApp"
          className="flex size-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-600/30 transition hover:scale-105 hover:bg-emerald-600"
        >
          <IconoWhatsApp className="size-7" />
        </a>
        <button
          type="button"
          onClick={() => setAbierto(!abierto)}
          aria-expanded={abierto}
          aria-label={abierto ? "Cerrar asistente" : "Abrir asistente"}
          className="flex size-14 items-center justify-center rounded-full bg-rosa-600 text-white shadow-xl shadow-rosa-600/30 transition hover:scale-105 hover:bg-rosa-700"
        >
          {abierto ? <X className="size-6" /> : <MessageCircleQuestion className="size-6" />}
        </button>
      </div>
    </div>
  );
}
