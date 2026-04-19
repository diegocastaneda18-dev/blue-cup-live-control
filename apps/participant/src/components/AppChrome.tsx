"use client";

import { DemoModeRibbon } from "@bluecup/ui";
import type { ReactNode } from "react";

export function AppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <DemoModeRibbon />
      {children}
    </>
  );
}
