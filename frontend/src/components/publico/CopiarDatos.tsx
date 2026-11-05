"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopiarDatos({ texto }: { texto: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setCopiado(true);
          setTimeout(() => setCopiado(false), 2000);
        } catch {}
      }}
      className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-rosa-700 ring-1 ring-rosa-200 transition hover:bg-rosa-600 hover:text-white"
    >
      {copiado ? <Check className="size-4" /> : <Copy className="size-4" />}
      {copiado ? "Copiado" : "Copiar datos"}
    </button>
  );
}
