import { lasMariasAssets } from "../../lib/brand";

function SectionIntro({
  kicker,
  title,
  description,
  align = "left"
}: {
  kicker: string;
  title: string;
  description: string;
  align?: "left" | "center";
}) {
  return (
    <div className={align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-maria-ocean">{kicker}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-maria-forest-dark sm:text-4xl">
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-maria-forest/80">{description}</p>
    </div>
  );
}

function ImageCard({
  src,
  alt,
  title,
  description,
  reverse = false
}: {
  src: string;
  alt: string;
  title: string;
  description: string;
  reverse?: boolean;
}) {
  return (
    <article
      className={`grid items-center gap-8 lg:grid-cols-2 lg:gap-12 ${reverse ? "lg:[&>img]:order-2 lg:[&>div]:order-1" : ""}`}
    >
      <img
        src={src}
        alt={alt}
        className="aspect-[4/3] w-full rounded-2xl object-cover shadow-maria"
        loading="lazy"
      />
      <div>
        <h3 className="font-display text-2xl font-semibold text-maria-forest-dark sm:text-3xl">{title}</h3>
        <p className="mt-4 text-base leading-relaxed text-maria-forest/75">{description}</p>
      </div>
    </article>
  );
}

const EXPERIENCES = [
  {
    title: "Yates & aguas abiertas",
    body: "Navegación privada, traslados exclusivos y días completos en el mar con tripulación local de confianza."
  },
  {
    title: "Surf & buceo",
    body: "Breaks seleccionados, arrecifes vírgenes y guías certificados para todos los niveles."
  },
  {
    title: "Bodas & celebraciones",
    body: "Atardeceres íntimos, cenas en la playa y logística integral para grupos premium."
  },
  {
    title: "Agencias & corporativo",
    body: "Itinerarios white-label, tarifas netas y coordinación bilingüe para operadores internacionales."
  }
] as const;

export function ExperienceSections() {
  return (
    <>
      <section id="experiencias" className="bg-maria-sand-light px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <SectionIntro
            kicker="Experiencias"
            title="Cada amanecer, una historia distinta"
            description="Diseñamos viajes privados con estándares internacionales: naturaleza intacta, servicio impecable y la calidez costarricense en cada detalle."
          />

          <div className="mt-16">
            <ImageCard
              src={lasMariasAssets.fishingDock}
              alt="Pesca deportiva al amanecer en el muelle"
              title="Pesca deportiva de clase mundial"
              description="Salidas al amanecer con capitanes locales, especies de pez vela y marlin, equipamiento premium y captura responsable. Ideal para aficionados exigentes y grupos privados."
            />
          </div>

          <div className="mt-20 grid gap-6 sm:grid-cols-2">
            {EXPERIENCES.map(({ title, body }) => (
              <div
                key={title}
                className="rounded-2xl border border-maria-sand-dark/30 bg-maria-pearl/80 p-6 shadow-maria-soft"
              >
                <h3 className="font-display text-xl font-semibold text-maria-forest-dark">{title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-maria-forest/75">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="comunidad" className="bg-maria-pearl px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-6xl space-y-20">
          <SectionIntro
            kicker="Comunidad"
            title="Donde el lujo se siente humano"
            description="Equipos locales, cenas bajo las estrellas y la energía de quienes viven y protegen esta reserva."
            align="center"
          />

          <ImageCard
            src={lasMariasAssets.teamNight}
            alt="Equipo y huéspedes compartiendo la noche"
            title="Espíritu de equipo, estándar internacional"
            description="Nuestro crew conoce cada rincón del archipiélago. Coordinación impecable, seguridad primero y la hospitalidad tica que convierte cada grupo en familia."
          />

          <ImageCard
            src={lasMariasAssets.groupDinner}
            alt="Cena premium al aire libre"
            title="Gastronomía y momentos premium"
            description="Mesas largas frente al mar, mariscos frescos, mixología de autor y ambientación íntima para agencias, retiros ejecutivos y celebraciones privadas."
            reverse
          />
        </div>
      </section>

      <section id="familia" className="relative overflow-hidden bg-maria-forest-dark px-4 py-20 sm:px-6 sm:py-28">
        <div className="absolute inset-0 opacity-30">
          <img
            src={lasMariasAssets.familyNight}
            alt=""
            className="h-full w-full object-cover"
            loading="lazy"
            aria-hidden
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-r from-maria-forest-dark via-maria-forest-dark/92 to-maria-forest-dark/75" />

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <img
            src={lasMariasAssets.familyNight}
            alt="Familia disfrutando la noche en Las Marías"
            className="aspect-[4/5] w-full rounded-2xl object-cover shadow-2xl shadow-black/40 lg:max-w-md"
            loading="lazy"
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-maria-ocean-light">
              Momentos que permanecen
            </p>
            <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight text-maria-pearl sm:text-4xl">
              Para familias que buscan conexión real
            </h2>
            <p className="mt-5 text-base leading-relaxed text-maria-sand/85">
              No es solo un viaje de lujo: es despertar juntos, compartir fogatas, enseñar a los
              más pequeños el valor del océano y crear recuerdos que cruzan generaciones.
            </p>
            <p className="mt-4 text-base leading-relaxed text-maria-sand/70">
              Diseñamos ritmos suaves, actividades para todas las edades y espacios de calma lejos
              del ruido del mundo.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
