import { ExperienceBrand } from "../ExperienceBrand";

export function ExperienceFooter() {
  return (
    <footer className="border-t border-maria-pearl/10 bg-maria-forest-dark px-4 py-14 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
        <ExperienceBrand variant="footer" href="/" />
        <p className="max-w-lg text-sm leading-relaxed text-maria-sand/65">
          Las Marías Experience · Reserva natural del Pacífico central · Yates · Pesca · Surf ·
          Buceo · Bodas · Experiencias privadas
        </p>
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-maria-sand/50">
          <a href="#experiencias" className="transition hover:text-maria-ocean-light">
            Experiencias
          </a>
          <a href="#comunidad" className="transition hover:text-maria-ocean-light">
            Comunidad
          </a>
          <a href="#reservar" className="transition hover:text-maria-ocean-light">
            Reservar
          </a>
          <a href="/login" className="transition hover:text-maria-ocean-light">
            Acceso privado
          </a>
        </div>
        <p className="text-xs text-maria-sand/40">
          © {new Date().getFullYear()} Las Marías Experience. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
