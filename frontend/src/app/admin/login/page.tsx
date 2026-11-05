"use client";

import { LogIn } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/Logo";
import { Button, Field, Input } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { useAuth } from "@/lib/auth";

function LoginForm() {
  const { login, user, cargando } = useAuth();
  const router = useRouter();
  const expirada = useSearchParams().get("expirada");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(expirada ? "Tu sesión expiró. Vuelve a ingresar." : null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    if (!cargando && user) router.replace("/admin");
  }, [user, cargando, router]);

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setEnviando(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError && err.status === 401 ? "Correo o contraseña incorrectos" : (err as Error).message);
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={enviar} className="space-y-4">
      <Field label="Correo" htmlFor="email">
        <Input id="email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
      </Field>
      <Field label="Contraseña" htmlFor="password">
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </Field>
      {error && <p className="rounded-xl bg-fresa-50 px-3 py-2 text-sm font-medium text-fresa-700 ring-1 ring-fresa-100">{error}</p>}
      <Button type="submit" cargando={enviando} className="w-full" icono={<LogIn className="size-4" />}>
        Ingresar
      </Button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh lg:grid-cols-2">
      <section className="relative hidden overflow-hidden bg-cacao-900 lg:block">
        <div className="absolute -left-24 -top-24 size-96 rounded-full bg-fresa-600/30 blur-3xl" />
        <div className="absolute -bottom-32 right-0 size-[28rem] rounded-full bg-cacao-500/40 blur-3xl" />
        <div className="relative flex h-full flex-col justify-between p-12">
          <Logo claro />
          <div>
            <p className="text-4xl font-bold leading-tight tracking-tight text-white">
              Pedidos, inventario
              <br />y finanzas en un
              <br />
              <span className="text-fresa-500">solo lugar.</span>
            </p>
            <p className="mt-4 max-w-sm text-cacao-200">Panel administrativo de ChocoFruit Daferson.</p>
          </div>
          <p className="text-xs text-cacao-300">© {new Date().getFullYear()} ChocoFruit Daferson</p>
        </div>
      </section>
      <section className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-bold tracking-tight text-stone-900">Bienvenido de vuelta</h1>
          <p className="mb-8 mt-1 text-sm text-stone-500">Ingresa con tu cuenta para administrar la tienda.</p>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
