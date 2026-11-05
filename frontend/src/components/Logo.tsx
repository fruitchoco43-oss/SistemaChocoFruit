import { cn } from "@/lib/cn";

/**
 * Identidad de ChocoFruit Daferson.
 *  - <Logo />      versión web (vectorial), basada en el logo original: cursiva rosada con sombra
 *                  negra + "DAFERSON" condensado. Para encabezados y tamaños pequeños.
 *  - <Sello />     logo original (foto) recortado en círculo. Para lugares grandes y destacados.
 *  - <Isotipo />   fresa con chocolate simplificada. Para íconos y avatares.
 */

export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#ec2a8c" />
      <path d="M24 40c-7.6-3.5-12-10-12-16.6a12 12 0 0 1 24 0C36 30 31.6 36.5 24 40Z" fill="#ff4d6d" />
      <path d="M12.6 21.6c3.6 2.4 7.4 3.5 11.4 3.5s7.8-1.1 11.4-3.5a12 12 0 0 0-22.8 0Z" fill="#4b2a1c" />
      <path d="M13 26.2c2.4 1.7 5 1 7.4 1.8s5.6 1.3 8 .3 4.6-1 6.6-2.2" stroke="#4b2a1c" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M15.5 18.8c3 1.4 5.6-.8 8.6.4s5.4.8 8.4-.6" stroke="#fff4e6" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="32" r="0.9" fill="#ffd3dc" />
      <circle cx="27.5" cy="33" r="0.9" fill="#ffd3dc" />
      <circle cx="24" cy="36.5" r="0.9" fill="#ffd3dc" />
      <path d="M24 11.4V7.6M24 11.4c-2-2.2-4.6-2.8-6.6-2.2M24 11.4c2-2.2 4.6-2.8 6.6-2.2" stroke="#3fa34d" strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
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
