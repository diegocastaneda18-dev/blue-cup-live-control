import { access, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
const logoPath = path.join(__dirname, "..", "public", "las-marias", "logo.png");

/** Deep forest — matches `theme_color` in manifest. */
const ICON_BG = { r: 8, g: 40, b: 32, alpha: 1 };

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp first: pnpm add -D sharp --filter @bluecup/web");
    process.exit(1);
  }

  try {
    await access(logoPath);
  } catch {
    console.error(`Logo not found: ${logoPath}`);
    console.error("Add public/las-marias/logo.png before running pnpm icons.");
    process.exit(1);
  }

  await mkdir(iconsDir, { recursive: true });
  const logo = await readFile(logoPath);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32.png", size: 32 }
  ];

  for (const { name, size } of sizes) {
    await sharp(logo)
      .resize(size, size, { fit: "contain", background: ICON_BG })
      .png()
      .toFile(path.join(iconsDir, name));
    console.log(`Wrote ${name}`);
  }

  await sharp(logo)
    .resize(16, 16, { fit: "contain", background: ICON_BG })
    .png()
    .toFile(path.join(iconsDir, "favicon-16.png"));
  console.log("Wrote favicon-16.png");
}

void main();
