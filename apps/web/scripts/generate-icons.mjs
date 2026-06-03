import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, "..", "public", "icons");
const svgPath = path.join(iconsDir, "icon.svg");

async function main() {
  let sharp;
  try {
    sharp = (await import("sharp")).default;
  } catch {
    console.error("Install sharp first: pnpm add -D sharp --filter @bluecup/web");
    process.exit(1);
  }

  await mkdir(iconsDir, { recursive: true });
  const svg = await readFile(svgPath);

  const sizes = [
    { name: "icon-192.png", size: 192 },
    { name: "icon-512.png", size: 512 },
    { name: "apple-touch-icon.png", size: 180 },
    { name: "favicon-32.png", size: 32 }
  ];

  for (const { name, size } of sizes) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconsDir, name));
    console.log(`Wrote ${name}`);
  }

  await sharp(svg).resize(16, 16).png().toFile(path.join(iconsDir, "favicon-16.png"));
  console.log("Wrote favicon-16.png");
}

void main();
