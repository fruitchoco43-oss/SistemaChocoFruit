import { API_URL } from "@/lib/api";

// Página temporal: confirma que el frontend se comunica con la API.
// Se reemplaza por la landing real cuando lleguen los requerimientos.
async function estadoApi(): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/health`, { cache: "no-store" });
    const data = await res.json();
    return data.status === "ok" && data.db === "ok" ? "API y base de datos conectadas" : "API respondió con error";
  } catch {
    return "No se pudo conectar con la API";
  }
}

export default async function Home() {
  const estado = await estadoApi();
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl font-bold">ChocoFruit</h1>
      <p className="text-lg">{estado}</p>
      <p className="text-sm opacity-60">{API_URL}</p>
    </main>
  );
}
