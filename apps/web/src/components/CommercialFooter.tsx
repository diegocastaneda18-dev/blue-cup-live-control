"use client";

import { BrandingImage } from "./branding/BrandingImage";

const WOODWARD_LOGO_SRC = "/branding/woodward-diamond.png";

type DiamondSponsor = {
  name: string;
  logoSrc: string;
  logoAlt: string;
};

const DIAMOND_SPONSORS: DiamondSponsor[] = [
  {
    name: "Logística Woodward",
    logoSrc: WOODWARD_LOGO_SRC,
    logoAlt: "Logística Woodward"
  }
];

function SponsorMark({ sponsor }: { sponsor: DiamondSponsor }) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-2.5 sm:flex-row sm:gap-4">
      <BrandingImage
        src={sponsor.logoSrc}
        alt={sponsor.logoAlt}
        width={180}
        height={48}
        className="h-8 w-auto max-w-[9rem] object-contain opacity-90 sm:h-9 sm:max-w-[10rem]"
        fallback={
          <span className="text-sm font-medium tracking-tight text-slate-300">{sponsor.name}</span>
        }
      />
      <span className="hidden text-sm text-slate-500 sm:inline" aria-hidden>
        ·
      </span>
      <span className="text-center text-xs font-medium text-slate-400 sm:text-left sm:text-sm">{sponsor.name}</span>
    </div>
  );
}

export function CommercialFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-white/[0.06] bg-[#040810]/90 ${className}`.trim()}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-7">
        <div className="flex flex-col gap-5 sm:gap-6">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between sm:gap-6">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Patrocinador Diamante
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:justify-end">
              {DIAMOND_SPONSORS.map((sponsor) => (
                <SponsorMark key={sponsor.name} sponsor={sponsor} />
              ))}
            </div>
          </div>

          <div className="h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" aria-hidden />

          <div className="flex flex-col items-center gap-1 text-center text-[11px] text-slate-500 sm:flex-row sm:justify-between sm:text-left">
            <p>
              <span className="font-medium text-slate-400">Blue Cup Live Control</span>
              <span className="mx-1.5 text-slate-600" aria-hidden>
                ·
              </span>
              Las Marías Blue Cup
            </p>
            <p className="text-slate-600">Official tournament operations platform</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
