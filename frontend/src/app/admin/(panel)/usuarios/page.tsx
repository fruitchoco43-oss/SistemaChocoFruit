"use client";

import { ShieldCheck, Users } from "lucide-react";
import { ResourcePage } from "@/components/ResourcePage";
import { Badge, Card, EmptyState } from "@/components/ui";
import { useAuth } from "@/lib/auth";
import { fmtFecha } from "@/lib/format";
import type { Usuario } from "@/lib/types";

export default function UsuariosPage() {
  const { user } = useAuth();
  if (user?.rol !== "admin")
    return (
      <Card>
        <EmptyState icono={<ShieldCheck className="size-6" />} titulo="Solo administradores" texto="No tienes permiso para gestionar usuarios." />
      </Card>
    );

  return (
    <ResourcePage<Usuario>
      titulo="Usuarios"
      descripcion="Personas que pueden entrar al panel. Los empleados no ven esta sección."
      endpoint="/api/usuarios"
      singular="usuario"
      icono={<Users className="size-6" />}
      columnas={[
        {
          header: "Usuario",
          cell: (u) => (
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-cacao-100 text-sm font-bold text-cacao-800">
                {u.nombre.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-stone-900">
                  {u.nombre} {u.id === user.id && <span className="text-xs font-normal text-stone-500">(tú)</span>}
                </p>
                <p className="truncate text-xs text-stone-500">{u.email}</p>
              </div>
            </div>
          ),
        },
        { header: "Rol", cell: (u) => <Badge tono={u.rol === "admin" ? "cacao" : "gris"}>{u.rol === "admin" ? "Administrador" : "Empleado"}</Badge> },
        { header: "Creado", cell: (u) => <span className="text-stone-600">{fmtFecha(u.creado_en)}</span> },
      ]}
      campos={[
        { name: "nombre", label: "Nombre", tipo: "texto", requerido: true },
        { name: "email", label: "Correo", tipo: "email", requerido: true },
        {
          name: "rol",
          label: "Rol",
          tipo: "select",
          requerido: true,
          opciones: [
            { valor: "empleado", label: "Empleado — pedidos, catálogo e inventario" },
            { valor: "admin", label: "Administrador — todo, incluido usuarios" },
          ],
        },
        {
          name: "password",
          label: "Contraseña",
          tipo: "password",
          requerido: true,
          ayuda: "Mínimo 8 caracteres.",
          ayudaEditar: "Déjala vacía para mantener la actual.",
        },
        { name: "activo", label: "Puede ingresar", tipo: "switch" },
      ]}
      defaults={{ nombre: "", email: "", rol: "empleado", password: "", activo: true }}
      aForm={(u) => ({ ...u, password: "" })}
      nombreFila={(u) => u.nombre}
      buscar="Buscar"
    />
  );
}
