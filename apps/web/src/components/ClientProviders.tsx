"use client";

import type { ReactNode } from "react";
import { DemoModeRibbon } from "@bluecup/ui";
import { ToastProvider } from "./Toast";

export function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <DemoModeRibbon />
      {children}
    </ToastProvider>
  );
}
