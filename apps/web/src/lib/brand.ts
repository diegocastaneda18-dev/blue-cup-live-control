/** Las Marías Experience — brand tokens and static asset paths. */
export const lasMariasAssets = {
  logo: "/las-marias/logo.png",
  heroSunset: "/las-marias/hero-sunset.jpg",
  fishingDock: "/las-marias/fishing-dock.jpg",
  teamNight: "/las-marias/team-night.jpg",
  /** Premium dining — falls back to team-night until group-dinner.jpg is added. */
  groupDinner: "/las-marias/team-night.jpg",
  familyNight: "/las-marias/family-night.jpg",
  reel: "/las-marias/reel-islas-marias.mp4"
} as const;

export const brandAssets = {
  logo: lasMariasAssets.logo,
  logoHorizontal: lasMariasAssets.logo,
  logoWhite: lasMariasAssets.logo,
  isotipo: lasMariasAssets.logo,
  ...lasMariasAssets
} as const;

export const brandColors = {
  /** Deep green — nature & reserve */
  forest: {
    DEFAULT: "#0F3D32",
    light: "#1B5A4A",
    dark: "#082820"
  },
  /** Ocean turquoise — navigation & water */
  ocean: {
    DEFAULT: "#2AABB8",
    light: "#4BC4CF",
    dark: "#1E8A94"
  },
  /** Warm sand — premium backgrounds */
  sand: {
    DEFAULT: "#E8DCC8",
    light: "#F5EDD6",
    dark: "#D4C4A8"
  },
  /** Sunset orange — accent */
  sunset: {
    DEFAULT: "#E8773A",
    light: "#F0945E",
    dark: "#C85F28"
  },
  /** Clean white — luxury & clarity */
  pearl: "#FFFFFF"
} as const;

export const brandName = "Las Marías Experience";

export const experienceTypes = [
  { id: "yacht", label: "Yates & navegación privada", icon: "⛵" },
  { id: "fishing", label: "Pesca deportiva", icon: "🎣" },
  { id: "surf", label: "Surf", icon: "🏄" },
  { id: "dive", label: "Buceo", icon: "🤿" },
  { id: "wedding", label: "Bodas & celebraciones", icon: "💍" },
  { id: "agency", label: "Agencias & grupos", icon: "🌐" },
  { id: "private", label: "Experiencia privada a medida", icon: "✦" }
] as const;

export type ExperienceTypeId = (typeof experienceTypes)[number]["id"];
