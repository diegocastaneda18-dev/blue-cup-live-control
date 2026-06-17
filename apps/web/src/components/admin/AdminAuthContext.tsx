"use client";

import { createContext, useContext } from "react";

type AdminAuthContextValue = {
  logout: () => void;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({
  logout,
  children
}: {
  logout: () => void;
  children: React.ReactNode;
}) {
  return <AdminAuthContext.Provider value={{ logout }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) {
    throw new Error("useAdminAuth must be used within AdminGate");
  }
  return ctx;
}
