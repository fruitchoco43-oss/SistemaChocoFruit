"use client";

import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { cn } from "@/components/ui";
import { enlaceWhatsApp, MENSAJE_GENERAL } from "@/lib/publico";
import { IconoWhatsApp } from "./IconoWhatsApp";

const ENLACES = [
  { href: "#catalogo", label: "Catálogo" },
  { href: "#eventos", label: "Eventos" },
  { href: "#como-pedir", label: "Cómo pedir" },
  { href: "#entregas", label: "Entregas y pagos" },
  { href: "#galeria", label: "Galería" },
];

export function Encabezado({ whatsapp, conEventos, conGaleria }: { whatsapp: string; conEventos: boolean; conGaleria: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const onScroll = () => setScroll(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const enlaces = ENLACES.filter((e) => (e.href !== "#eventos" || conEventos) && (e.href !== "#galeria" || conGaleria));

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-40 transition-all duration-300",
        scroll || abierto ? "bg-white/90 shadow-[0_1px_0_rgba(0,0,0,0.04),0_8px_24px_-12px_rgba(240,74,136,0.25)] backdrop-blur-md" : "bg-transparent",
      )}
    >
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <a href="#inicio" aria-label="ChocoFruit Daferson, inicio">
          <Logo />
        </a>
        <nav className="hidden items-center gap-1 lg:flex" aria-label="Principal">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} className="rounded-full px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:bg-rosa-50 hover:text-rosa-700">
              {e.label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <a
            href={enlaceWhatsApp(whatsapp, MENSAJE_GENERAL)}
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-2 rounded-full bg-rosa-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rosa-600/25 transition hover:-translate-y-0.5 hover:bg-rosa-700 sm:inline-flex"
          >
            <IconoWhatsApp className="size-4" /> Pedir ahora
          </a>
          <button
            type="button"
            aria-label={abierto ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={abierto}
            onClick={() => setAbierto(!abierto)}
            className="inline-flex size-10 items-center justify-center rounded-full text-stone-700 hover:bg-rosa-50 lg:hidden"
          >
            {abierto ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>
      {abierto && (
        <nav className="animate-entrar border-t border-rosa-100 bg-white px-4 pb-6 pt-2 lg:hidden" aria-label="Principal móvil">
          {enlaces.map((e) => (
            <a key={e.href} href={e.href} onClick={() => setAbierto(false)} className="block rounded-xl px-3 py-3 text-base font-medium text-stone-800 hover:bg-rosa-50">
              {e.label}
            </a>
          ))}
          <a
            href={enlaceWhatsApp(whatsapp, MENSAJE_GENERAL)}
            target="_blank"
            rel="noreferrer"
            className="mt-3 flex items-center justify-center gap-2 rounded-full bg-rosa-600 px-5 py-3 font-semibold text-white"
          >
            <IconoWhatsApp className="size-5" /> Pedir por WhatsApp
          </a>
        </nav>
      )}
    </header>
  );
}
