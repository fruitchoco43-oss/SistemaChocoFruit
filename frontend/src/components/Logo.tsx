import { cn } from "@/lib/cn";
import { Fresa } from "./publico/Fresa";

/**
 * Identidad de ChocoFruit Daferson.
 *  - <Logo />      versión web (vectorial), basada en el logo original: cursiva rosada con sombra
 *                  negra + "DAFERSON" condensado. Para encabezados y tamaños pequeños.
 *  - <Sello />     logo original (foto) recortado en círculo. Para lugares grandes y destacados.
 *  - <Isotipo />   fresa con chocolate minimalista (la misma del inicio). Para íconos y avatares.
 */

export function Isotipo({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center justify-center rounded-full bg-rosa-100 ring-1 ring-rosa-200", className)} aria-hidden>
      <Fresa idBase="fresa-isotipo" className="w-[60%] translate-y-[2%]" />
    </span>
  );
}

export function Logo({ className, claro, compacto, sinIsotipo }: { className?: string; claro?: boolean; compacto?: boolean; sinIsotipo?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      {!sinIsotipo && <Isotipo className="size-9 shrink-0 drop-shadow-sm" />}
      <div className="-rotate-3 leading-none">
        <span
          className={cn("block font-marca text-[1.7rem] leading-[0.95]", claro ? "text-white" : "text-rosa-600")}
          style={{ textShadow: claro ? "2px 2px 0 rgba(95,17,49,0.6)" : "1.5px 1.5px 0 #1c1917" }}
        >
          ChocoFruit
        </span>
        {!compacto && (
          <span className={cn("mt-0.5 block pl-6 font-marca2 text-[10px] tracking-[0.34em]", claro ? "text-white" : "text-stone-900")}>
            DAF<span className={claro ? "text-rosa-200" : "text-rosa-600"}>ERSON</span>
          </span>
        )}
      </div>
    </div>
  );
}

/** Logo original de la clienta (foto), recortado en círculo con borde blanco. */
export function Sello({ className, prioridad }: { className?: string; prioridad?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/marca/sello.webp"
      alt="ChocoFruit Daferson"
      width={800}
      height={800}
      loading={prioridad ? "eager" : "lazy"}
      fetchPriority={prioridad ? "high" : undefined}
      className={cn("aspect-square h-auto rounded-full object-cover", className)}
    />
  );
}
