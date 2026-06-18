"use client";

import { createContext, useContext } from "react";
import type { AdminAuthMode } from "../../lib/admin-auth";

type AdminAuthContextValue = {
  logout: () => void;
  adminEmail: string | null;
  authMode: AdminAuthMode;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  logout,
  adminEmail,
  authMode,
  children
}: {
  logout: () => void;
  adminEmail: string | null;
  authMode: AdminAuthMode;
  children: React.ReactNode;
}) {
  return (
    <AdminAuthContext.Provider value={{ logout, adminEmail, authMode }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminGate");
  }
  return ctx;
}
