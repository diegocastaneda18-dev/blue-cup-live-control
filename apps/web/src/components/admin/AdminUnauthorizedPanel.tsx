"use client";

import { ADMIN_UNAUTHORIZED_MESSAGE } from "../../lib/admin-auth";
import { useAdminAuth } from "./AdminAuthContext";

export function AdminUnauthorizedPanel() {
  const { logout } = useAdminAuth();

  return (
    <div className="rounded-2xl border border-maria-sunset/30 bg-maria-sunset/10 px-5 py-6 text-sm text-maria-sunset-light">
      <p>{ADMIN_UNAUTHORIZED_MESSAGE}</p>
      <button
        type="button"
        onClick={logout}
        className="mt-4 inline-flex min-h-10 items-center rounded-full border border-maria-pearl/20 bg-maria-forest-dark/80 px-5 text-xs font-semibold text-maria-pearl hover:bg-maria-forest-dark"
      >
        Cerrar sesión / volver a ingresar
      </button>
    </div>
  );
}
