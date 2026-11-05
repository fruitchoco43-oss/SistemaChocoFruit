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
                        activo ? "bg-cacao-700 text-white shadow-sm" : "text-stone-600 hover:bg-stone-100 hover:text-stone-900",
                      )}
                    >
                      <i.icono className={cn("size-4", activo ? "text-cacao-100" : "text-stone-400")} />
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
        <Link
          href="/"
          target="_blank"
          className="mx-3 mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium text-stone-500 hover:bg-stone-100"
        >
          <ExternalLink className="size-3.5" /> Ver página pública
        </Link>
        {pieUsuario}
      </aside>

      {/* Barra superior celular */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-stone-200/80 bg-white/90 px-4 backdrop-blur lg:hidden">
        <Logo />
        <IconButton label="Abrir menú" onClick={() => setMenu(true)}>
          <Menu className="size-5" />
        </IconButton>
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
  );
}

