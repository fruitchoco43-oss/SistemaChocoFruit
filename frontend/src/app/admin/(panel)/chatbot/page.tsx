"use client";

import { Bot, CornerDownRight, MessageCircle, MessageCircleQuestion } from "lucide-react";
import { useMemo, useState } from "react";
import { ResourcePage } from "@/components/ResourcePage";
import { Badge, Card, cn } from "@/components/ui";
import { useApi } from "@/lib/hooks";
import type { ChatbotNodo } from "@/lib/types";

/** Ordena los nodos como árbol (padre seguido de sus hijos) y devuelve su profundidad. */
function aplanar(nodos: ChatbotNodo[]) {
  // Si el padre no está en la lista (p. ej. por una búsqueda), el nodo se trata como raíz.
  const ids = new Set(nodos.map((n) => n.id));
  const padreDe = (n: ChatbotNodo) => (n.padre_id !== null && ids.has(n.padre_id) ? n.padre_id : null);
  const hijos = new Map<number | null, ChatbotNodo[]>();
  for (const n of nodos) hijos.set(padreDe(n), [...(hijos.get(padreDe(n)) ?? []), n]);
  const out: { nodo: ChatbotNodo; nivel: number }[] = [];
  const visitar = (padre: number | null, nivel: number) => {
    for (const n of (hijos.get(padre) ?? []).sort((a, b) => a.orden - b.orden || a.etiqueta.localeCompare(b.etiqueta))) {
      out.push({ nodo: n, nivel });
      visitar(n.id, nivel + 1);
    }
  };
  visitar(null, 0);
  return out;
}

const ordenarArbol = (nodos: ChatbotNodo[]) => aplanar(nodos).map((x) => x.nodo);

function Vista({ nodos }: { nodos: ChatbotNodo[] }) {
  const [ruta, setRuta] = useState<ChatbotNodo[]>([]);
  const actual = ruta.at(-1);
  const opciones = nodos.filter((n) => n.activo && n.padre_id === (actual?.id ?? null)).sort((a, b) => a.orden - b.orden);
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 bg-cacao-800 px-4 py-3 text-white">
        <Bot className="size-5" />
        <div>
          <p className="text-sm font-semibold">Vista previa</p>
          <p className="text-xs text-cacao-200">Así lo verá el cliente</p>
        </div>
      </div>
      <div className="space-y-3 bg-cacao-50/50 p-4 text-sm">
        <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-white p-3 shadow-sm ring-1 ring-stone-200/70">
          {actual ? <p className="whitespace-pre-line">{actual.respuesta}</p> : <p>Hola, ¿en qué te podemos ayudar?</p>}
          {actual?.accion_whatsapp && (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white">
              <MessageCircle className="size-3.5" /> Escribir por WhatsApp
            </span>
          )}
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          {opciones.map((o) => (
            <button
              key={o.id}
              onClick={() => setRuta([...ruta, o])}
              className="rounded-full bg-white px-3 py-1.5 text-xs font-medium text-cacao-800 ring-1 ring-cacao-200 hover:bg-cacao-100"
            >
              {o.etiqueta}
            </button>
          ))}
          {ruta.length > 0 && (
            <button onClick={() => setRuta([])} className="rounded-full px-3 py-1.5 text-xs font-medium text-stone-500 hover:bg-stone-100">
              Volver al menú principal
            </button>
          )}
        </div>
        {nodos.length === 0 && <p className="text-center text-xs text-stone-500">Agrega opciones para ver la vista previa.</p>}
      </div>
    </Card>
  );
}

export default function ChatbotPage() {
  const { data, recargar } = useApi<ChatbotNodo[]>("/api/chatbot");
  const nodos = useMemo(() => data ?? [], [data]);
  const niveles = useMemo(() => new Map(aplanar(nodos).map(({ nodo, nivel }) => [nodo.id, nivel])), [nodos]);
  const etiqueta = useMemo(() => new Map(nodos.map((n) => [n.id, n.etiqueta])), [nodos]);
  const opcionesPadre = aplanar(nodos).map(({ nodo, nivel }) => ({ valor: nodo.id, label: `${"— ".repeat(nivel)}${nodo.etiqueta}` }));

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_320px]">
      <div className="min-w-0">
        <ResourcePage<ChatbotNodo>
          titulo="Chatbot"
          descripcion="Menú de preguntas frecuentes. Cada opción muestra una respuesta y puede tener sub-opciones. Sin costo."
          endpoint="/api/chatbot"
          singular="opción"
          femenino
          icono={<MessageCircleQuestion className="size-6" />}
          onCambio={recargar}
          ordenar={ordenarArbol}
          columnas={[
            {
              header: "Opción",
              cell: (n) => {
                const nivel = niveles.get(n.id) ?? 0;
                return (
                  <div className="flex items-start gap-2" style={{ paddingLeft: `${Math.min(nivel, 4) * 16}px` }}>
                    {nivel > 0 && <CornerDownRight className="mt-0.5 size-4 shrink-0 text-stone-300" />}
                    <div className="min-w-0">
                      <p className={cn("font-medium", n.activo ? "text-stone-900" : "text-stone-400")}>{n.etiqueta}</p>
                      <p className="line-clamp-1 text-xs text-stone-500">{n.respuesta}</p>
                    </div>
                  </div>
                );
              },
            },
            { header: "Dentro de", cell: (n) => (n.padre_id ? <Badge>{etiqueta.get(n.padre_id)}</Badge> : <Badge tono="cacao">Menú principal</Badge>) },
            {
              header: "WhatsApp",
              cell: (n) => (n.accion_whatsapp ? <Badge tono="verde">Botón</Badge> : <span className="text-stone-400">—</span>),
            },
          ]}
          campos={[
            { name: "etiqueta", label: "Texto del botón", tipo: "texto", requerido: true, placeholder: "¿Hacen envíos?" },
            { name: "padre_id", label: "Ubicación", tipo: "select", numerico: true, vacio: "Menú principal", opciones: opcionesPadre },
            { name: "respuesta", label: "Respuesta", tipo: "area", requerido: true, placeholder: "Sí, entregamos en todo Quito. El costo depende de la zona…" },
            {
              name: "palabras_clave",
              label: "Palabras clave",
              tipo: "tags",
              placeholder: "envío, delivery, domicilio",
              ayuda: "Si el cliente escribe una de estas palabras, se muestra esta respuesta.",
            },
            { name: "orden", label: "Orden", tipo: "numero", step: "1" },
            { name: "accion_whatsapp", label: "Mostrar botón de WhatsApp", tipo: "switch" },
            {
              name: "mensaje_whatsapp",
              label: "Mensaje prellenado de WhatsApp",
              tipo: "texto",
              completo: true,
              placeholder: "Hola, quiero hacer un pedido",
              visible: (f) => !!f.accion_whatsapp,
            },
            { name: "activo", label: "Activa", tipo: "switch" },
          ]}
          defaults={{ etiqueta: "", padre_id: "", respuesta: "", palabras_clave: [], orden: 0, accion_whatsapp: false, mensaje_whatsapp: "", activo: true }}
          aPayload={(f) => ({ ...f, mensaje_whatsapp: f.accion_whatsapp ? f.mensaje_whatsapp || null : null })}
          nombreFila={(n) => n.etiqueta}
          buscar="Buscar en opciones y respuestas"
          textoVacio="Crea las preguntas frecuentes que el asistente responderá en la página."
        />
      </div>
      <div className="xl:pt-[76px]">
        <div className="xl:sticky xl:top-8">
          <Vista nodos={nodos} />
        </div>
      </div>
    </div>
  );
}
