import { access } from "node:fs/promises";
import path from "node:path";
import { ExperienceFooter } from "./ExperienceFooter";
import { ExperienceHeader } from "./ExperienceHeader";
import { ExperienceHero } from "./ExperienceHero";
import { ExperienceSections } from "./ExperienceSections";
import { InquiryWizard } from "./InquiryWizard";

async function reelExists(): Promise<boolean> {
  try {
    await access(path.join(process.cwd(), "public", "las-marias", "reel-islas-marias.mp4"));
    return true;
  } catch {
    return false;
  }
}

export async function ExperienceOnePager() {
  const videoAvailable = await reelExists();

  return (
    <>
      <ExperienceHeader />
      <ExperienceHero videoAvailable={videoAvailable} />
      <ExperienceSections />

      <section id="reservar" className="bg-maria-sand px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-maria-ocean">
              Reservar
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-maria-forest-dark sm:text-4xl">
              Diseña tu experiencia privada
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-maria-forest/75">
              Cuatro pasos sencillos. Un concierge dedicado se pondrá en contacto para afinar cada
              detalle de tu viaje.
            </p>
          </div>
          <div className="mt-12">
            <InquiryWizard />
          </div>
        </div>
      </section>

      <ExperienceFooter />
    </>
  );
}
