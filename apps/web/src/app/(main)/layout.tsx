import type { ReactNode } from "react";
import MainAppShell from "./MainAppShell";

/** Authenticated app shell — live session/API; never prerender at build time. */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

export default function MainLayout({ children }: { children: ReactNode }) {
  return <MainAppShell>{children}</MainAppShell>;
}
