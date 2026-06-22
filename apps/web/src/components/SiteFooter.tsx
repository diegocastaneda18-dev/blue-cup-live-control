import type { ReactNode } from "react";
import { ExperienceBrand } from "./ExperienceBrand";

export function SiteFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-maria-pearl/10 bg-maria-forest-dark px-4 py-10 sm:px-6 lg:py-12 ${className}`.trim()}
    >
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 text-center">
        <ExperienceBrand variant="footer" />
        <p className="max-w-md text-xs leading-relaxed text-maria-sand/60">
          Reserva natural · yates · bodas · pesca deportiva · surf · buceo · experiencias privadas
        </p>
      </div>
    </footer>
  );
}

export function SiteFooterSlot({ children }: { children?: ReactNode }) {
  return children ?? <SiteFooter className="hidden lg:block" />;
}
