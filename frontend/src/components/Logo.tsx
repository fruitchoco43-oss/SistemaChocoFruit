import { cn } from "@/lib/cn";

/** Isotipo: fresa bañada en chocolate. */
export function Isotipo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <circle cx="24" cy="24" r="24" fill="#f04a88" />
      <path d="M24 39c-7.3-3.4-11.5-9.6-11.5-16a11.5 11.5 0 0 1 23 0c0 6.4-4.2 12.6-11.5 16Z" fill="#fff4f8" />
      <path d="M13.1 19.4c3.4 2.2 7 3.2 10.9 3.2s7.5-1 10.9-3.2a11.5 11.5 0 0 0-21.8 0Z" fill="#4b2f22" />
      <path d="M15.5 23.5c2.6 1.4 5.4 2 8.5 2s5.9-.6 8.5-2" stroke="#4b2f22" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <circle cx="20" cy="30" r="0.9" fill="#f04a88" />
      <circle cx="27.5" cy="31.5" r="0.9" fill="#f04a88" />
      <circle cx="24" cy="35" r="0.9" fill="#f04a88" />
      <path d="M24 11.5V8.5M24 11.5c1.6-2 3.8-2.6 5.5-2.2M24 11.5c-1.6-2-3.8-2.6-5.5-2.2" stroke="#fff4f8" strokeWidth="1.8" strokeLinecap="round" fill="none" />
    </svg>
  );
}

/** Logo provisional hasta tener el archivo original del cliente. */
export function Logo({ className, claro, compacto }: { className?: string; claro?: boolean; compacto?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <Isotipo className="size-9 shrink-0 drop-shadow-sm" />
      <div className="leading-none">
        <span className={cn("block font-display text-xl font-semibold italic tracking-tight", claro ? "text-white" : "text-stone-900")}>
          Choco<span className={claro ? "text-rosa-300" : "text-rosa-600"}>Fruit</span>
        </span>
        {!compacto && (
          <span className={cn("mt-0.5 block text-[10px] font-semibold uppercase tracking-[0.32em]", claro ? "text-rosa-200" : "text-rosa-500")}>
            Daferson
          </span>
        )}
      </div>
    </div>
  );
}
