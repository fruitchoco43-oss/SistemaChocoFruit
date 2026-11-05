import { cn } from "./ui";

/** Logo provisional hasta tener el del cliente. */
export function Logo({ className, claro }: { className?: string; claro?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-cacao-600 to-cacao-800 shadow-sm">
        <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
          <path d="M12 21c-4.5-2.2-7-6-7-10a7 7 0 0 1 14 0c0 4-2.5 7.8-7 10Z" fill="#f0405e" />
          <path d="M5.2 9.5c2.3 1.4 4.6 2 6.8 2s4.5-.6 6.8-2A7 7 0 0 0 5.2 9.5Z" fill="#4b2f22" />
          <path d="M12 4V2.5M12 4c1-1.2 2.5-1.6 3.5-1" stroke="#7fb069" strokeWidth="1.6" strokeLinecap="round" fill="none" />
        </svg>
      </div>
      <span className={cn("text-lg font-bold tracking-tight", claro ? "text-white" : "text-stone-900")}>
        Choco<span className="text-fresa-600">Fruit</span>
      </span>
    </div>
  );
}
