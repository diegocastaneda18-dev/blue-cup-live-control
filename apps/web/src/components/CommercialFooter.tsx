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
    <div className="flex min-w-0 items-center justify-center rounded-xl border border-white/[0.05] bg-white/[0.02] px-4 py-3 sm:px-5 sm:py-3.5">
      <BrandingImage
        src={sponsor.logoSrc}
        alt={sponsor.logoAlt}
        width={240}
        height={56}
        className="h-9 w-auto max-w-[11rem] object-contain opacity-95 sm:h-11 sm:max-w-[13rem] lg:h-14 lg:max-w-[15rem]"
        fallback={
          <span className="text-sm font-medium tracking-tight text-slate-300 sm:text-base">{sponsor.name}</span>
        }
      />
    </div>
  );
}

export function CommercialFooter({ className = "" }: { className?: string }) {
  return (
    <footer
      className={`border-t border-white/[0.06] bg-[#040810]/90 ${className}`.trim()}
      aria-label="Site footer"
    >
      <div className="mx-auto max-w-6xl px-4 py-7 sm:px-6 sm:py-8">
        <div className="flex flex-col gap-6 sm:gap-7">
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:justify-between sm:gap-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              Patrocinador Diamante
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:justify-end sm:gap-6">
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
