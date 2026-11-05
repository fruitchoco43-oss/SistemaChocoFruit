"use client";

import { useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, SESION_EXPIRADA, tokenStore } from "./api";
import type { Usuario } from "./types";

interface AuthCtx {
  user: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Usuario | null>(null);
  // Solo hay algo que cargar si existe un token guardado.
  const [cargando, setCargando] = useState(() => typeof window !== "undefined" && !!tokenStore.get());
  const router = useRouter();

  useEffect(() => {
    if (!tokenStore.get()) return;
    api<Usuario>("/api/auth/me")
      .then(setUser)
      .catch(() => tokenStore.clear())
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const expirada = () => {
      setUser(null);
      router.replace("/admin/login?expirada=1");
    };
    window.addEventListener(SESION_EXPIRADA, expirada);
    return () => window.removeEventListener(SESION_EXPIRADA, expirada);
  }, [router]);

  const login = useCallback(async (email: string, password: string) => {
    const { access_token } = await api<{ access_token: string }>("/api/auth/login", {
      method: "POST",
      auth: false,
      body: new URLSearchParams({ username: email, password }),
    });
    tokenStore.set(access_token);
    setUser(await api<Usuario>("/api/auth/me"));
  }, []);

  const logout = useCallback(() => {
    tokenStore.clear();
    setUser(null);
    router.replace("/admin/login");
  }, [router]);

  return <Ctx.Provider value={{ user, cargando, login, logout }}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
}
