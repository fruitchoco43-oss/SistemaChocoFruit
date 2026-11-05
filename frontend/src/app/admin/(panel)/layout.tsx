"use client";

import {
  ClipboardList,
  Cog,
  ExternalLink,
  Gift,
  Images,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  MessageCircleQuestion,
  Package,
  PartyPopper,
  Receipt,
  Repeat,
  Sparkles,
  Tags,
  Truck,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/Logo";
import { cn, IconButton, Skeleton } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { fmtDinero } from "@/lib/format";
import { EnVivoProvider, useEnVivo, useEstadoVivo } from "@/lib/vivo";
import { toast } from "sonner";

const NAV = [
  {
    grupo: "General",
    items: [
      { href: "/admin", label: "Resumen", icono: LayoutDashboard },
      { href: "/admin/pedidos", label: "Pedidos", icono: ClipboardList },
    ],
  },
  {
    grupo: "Catálogo",
    items: [
      { href: "/admin/productos", label: "Productos", icono: Gift },
      { href: "/admin/categorias", label: "Categorías", icono: Tags },
      { href: "/admin/complementos", label: "Complementos", icono: Sparkles },
      { href: "/admin/alquiler", label: "Alquiler", icono: PartyPopper },
      { href: "/admin/galeria", label: "Galería", icono: Images },
      { href: "/admin/zonas", label: "Zonas de entrega", icono: MapIcon },
    ],
  },
  {
    grupo: "Materia prima",
    items: [
      { href: "/admin/insumos", label: "Insumos", icono: Package },
      { href: "/admin/compras", label: "Compras", icono: Receipt },
      { href: "/admin/movimientos", label: "Movimientos", icono: Repeat },
      { href: "/admin/proveedores", label: "Proveedores", icono: Truck },
    ],
  },
  {
    grupo: "Ajustes",
    items: [
      { href: "/admin/chatbot", label: "Chatbot", icono: MessageCircleQuestion },
      { href: "/admin/negocio", label: "Datos del negocio", icono: Cog },
      { href: "/admin/usuarios", label: "Usuarios", icono: Users, soloAdmin: true },
    ],
  },
];

function Navegacion({ esAdmin, onNavegar }: { esAdmin: boolean; onNavegar?: () => void }) {
  const ruta = usePathname();
  return (
    <nav className="space-y-6">
      {NAV.map((g) => (
        <div key={g.grupo}>
          <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-stone-400">{g.grupo}</p>
          <ul className="space-y-0.5">
            {g.items
              .filter((i) => !("soloAdmin" in i && i.soloAdmin) || esAdmin)
              .map((i) => {
                const activo = i.href === "/admin" ? ruta === "/admin" : ruta.startsWith(i.href);
                return (
                  <li key={i.href}>
                    <Link
                      href={i.href}
                      onClick={onNavegar}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors",
                        activo ? "bg-rosa-600 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                      )}
                    >
                      <i.icono className={cn("size-4", activo ? "text-rosa-100" : "text-stone-400")} />
                      {i.label}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/** Indicador de conexión en tiempo real. */
function IndicadorVivo() {
  const estado = useEstadoVivo();
  if (!estado) return null;
  const enVivo = estado === "en_vivo";
  return (
    <span
      title={enVivo ? "Los cambios se actualizan solos" : "Reconectando con el servidor"}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-semibold ring-1",
        enVivo ? "bg-emerald-50 text-emerald-700 ring-emerald-200" : "bg-amber-50 text-amber-700 ring-amber-200",
      )}
    >
      <span className="relative flex size-1.5">
        {enVivo && <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-75" />}
        <span className={cn("relative inline-flex size-1.5 rounded-full", enVivo ? "bg-emerald-500" : "bg-amber-500")} />
      </span>
      {enVivo ? "En vivo" : estado === "conectando" ? "Conectando" : "Reconectando"}
    </span>
  );
}

/** Avisa de pedidos nuevos registrados desde otro dispositivo o pestaña. */
function AvisosPedidos() {
  const router = useRouter();
  useEnVivo(["pedidos"], (e) => {
    if (e.propio || e.accion !== "crear") return;
    toast.info(`Nuevo pedido #${e.id}${e.cliente ? ` de ${e.cliente}` : ""}`, {
      description: e.total !== undefined ? `Total ${fmtDinero(e.total)}` : undefined,
      action: { label: "Ver", onClick: () => router.push("/admin/pedidos") },
      duration: 8000,
    });
  });
  return null;
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const { user, cargando, logout } = useAuth();
  const router = useRouter();
  const ruta = usePathname();
  // El menú móvil queda abierto solo para la ruta donde se abrió: al navegar se cierra solo.
  const [menuEn, setMenuEn] = useState<string | null>(null);
  const menu = menuEn === ruta;
  const setMenu = (abrir: boolean) => setMenuEn(abrir ? ruta : null);

  useEffect(() => {
    if (!cargando && !user) router.replace("/admin/login");
  }, [cargando, user, router]);

  if (cargando || !user)
    return (
      <div className="flex min-h-dvh">
        <div className="hidden w-64 border-r border-stone-200 bg-white p-4 lg:block">
          <Skeleton className="mb-8 h-9 w-36" />
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="mb-2 h-8" />
          ))}
        </div>
        <div className="flex-1 p-8">
          <Skeleton className="mb-6 h-8 w-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );

  const esAdmin = user.rol === "admin";
  const pieUsuario = (
    <div className="border-t border-stone-100 p-3">
      <div className="flex items-center gap-3 rounded-xl p-2">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-fresa-100 text-sm font-bold text-fresa-700">
          {user.nombre.slice(0, 1).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-stone-900">{user.nombre}</p>
          <p className="truncate text-xs capitalize text-stone-500">{user.rol}</p>
        </div>
        <IconButton label="Cerrar sesión" onClick={logout}>
          <LogOut className="size-4" />
        </IconButton>
      </div>
    </div>
  );

  return (
    <EnVivoProvider>
    <AvisosPedidos />
    <div className="min-h-dvh lg:pl-64">
      {/* Sidebar escritorio */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-stone-200/80 bg-white lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link href="/admin">
            <Logo />
          </Link>
        </div>
        <div className="scroll-fino flex-1 overflow-y-auto px-3 py-4">
          <Navegacion esAdmin={esAdmin} />
        </div>
        <div className="mx-3 mb-2 flex items-center justify-between gap-2">
          <Link href="/" target="_blank" className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-stone-500 hover:bg-stone-100">
            <ExternalLink className="size-3.5" /> Ver página pública
          </Link>
          <IndicadorVivo />
        </div>
        {pieUsuario}
      </aside>

      {/* Barra superior celular */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <div className="flex items-center gap-2">
          <IndicadorVivo />
          <IconButton label="Abrir menú" onClick={() => setMenu(true)}>
            <Menu className="size-5" />
          </IconButton>
        </div>
      </header>

      {menu && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="animate-entrar absolute inset-0 bg-stone-900/40" onClick={() => setMenu(false)} />
          <aside className="animate-subir absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <div className="flex h-14 items-center justify-between px-4">
              <Logo />
              <IconButton label="Cerrar menú" onClick={() => setMenu(false)}>
                <X className="size-5" />
              </IconButton>
            </div>
            <div className="scroll-fino flex-1 overflow-y-auto px-3 py-2">
              <Navegacion esAdmin={esAdmin} onNavegar={() => setMenu(false)} />
            </div>
            {pieUsuario}
          </aside>
        </div>
      )}

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
    </div>
    </EnVivoProvider>
  );
}

