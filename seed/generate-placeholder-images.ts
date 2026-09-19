// One-off helper: generates placeholder product images so `pnpm seed` can run
// fully before the real photos (see README "Seeding Mock Data") are downloaded.
// Safe to delete once seed/data/images has real files.
import "dotenv/config";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";

import sharp from "sharp";

const WIDTH = 800;
const HEIGHT = 800;

const COLORS = [
  "#1f2937",
  "#7c2d12",
  "#14532d",
  "#1e3a8a",
  "#581c87",
  "#831843",
  "#134e4a",
  "#78350f",
];

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

async function main() {
  const dataDir = resolve(process.cwd(), "seed", "data");
  const imagesDir = join(dataDir, "images");
  await mkdir(imagesDir, { recursive: true });

  const mockData = JSON.parse(
    await readFile(join(dataDir, "mock-data-en.json"), "utf8"),
  );

  let created = 0;
  let skipped = 0;

  for (const product of mockData.products as Array<{
    image_name: string;
    images: number;
    title: string;
  }>) {
    const imageCount = Number(product.images) || 0;

    for (let i = 1; i <= imageCount; i++) {
      const filename = `${product.image_name}_${i}.webp`;
      const outPath = join(imagesDir, filename);

      try {
        await readFile(outPath);
        skipped++;
        continue;
      } catch {
        // file doesn't exist yet, generate it
      }

      const color = COLORS[hashString(`${product.image_name}-${i}`) % COLORS.length];
      const label = product.title.replace(/&/g, "&amp;");

      const svg = `
        <svg width="${WIDTH}" height="${HEIGHT}" xmlns="http://www.w3.org/2000/svg">
          <rect width="100%" height="100%" fill="${color}" />
          <text x="50%" y="50%" font-family="sans-serif" font-size="42" fill="white"
                text-anchor="middle" dominant-baseline="middle">${label}</text>
          <text x="50%" y="58%" font-family="sans-serif" font-size="24" fill="white"
                fill-opacity="0.7" text-anchor="middle" dominant-baseline="middle">Placeholder ${i}</text>
        </svg>
      `;

      const buf = await sharp(Buffer.from(svg)).webp().toBuffer();
      await writeFile(outPath, buf);
      created++;
    }
  }

  console.log(`Placeholder images: created=${created} skipped=${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
