"use client";

import type { ReactNode } from "react";
import { DemoModeRibbon } from "@bluecup/ui";
import { PwaRegister } from "./PwaRegister";
import { ToastProvider } from "./Toast";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DemoModeRibbon />
      <PwaRegister />
      {children}
    </ToastProvider>
  );
}
