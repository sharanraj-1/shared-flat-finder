// One-off script: generates a pool of demo apartment photos with the
// Gemini image model. 1000+ listings will cycle through this pool rather
// than generating one image per listing (impractical on quota/time/cost),
// so variety comes from ~40 distinct AI-generated photos across exteriors,
// living rooms, bedrooms, kitchens and balconies, Bengaluru-styled.
//
// Usage: node scripts/generateImages.mjs
// Requires GEMINI_API_KEY in .env (loaded via --env-file when run through npm).

import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set. Run via `npm run gen:images`.");
  process.exit(1);
}

const OUT_DIR = path.join(process.cwd(), "public", "listings", "gen");
await mkdir(OUT_DIR, { recursive: true });

const STYLES = ["modern minimalist", "warm and cozy", "premium luxury", "simple budget-friendly"];

const SHOTS = [
  (style) =>
    `A photorealistic exterior photo of a ${style} mid-rise apartment building in Bengaluru, India, with balconies, greenery, and a clear blue sky, shot from street level, real estate listing photography style.`,
  (style) =>
    `A photorealistic interior photo of a ${style} living room in a Bengaluru apartment, natural daylight through large windows, real estate listing photography style, no people.`,
  (style) =>
    `A photorealistic interior photo of a ${style} bedroom in an Indian apartment in Bengaluru, tidy bed, soft daylight, real estate listing photography style, no people.`,
  (style) =>
    `A photorealistic interior photo of a ${style} modular kitchen in an Indian apartment, clean countertops, real estate listing photography style, no people.`,
  (style) =>
    `A photorealistic photo taken from an apartment balcony in Bengaluru, India, overlooking a green tree-lined residential neighborhood with other apartment buildings in the distance, golden hour lighting.`,
  (style) =>
    `A photorealistic exterior photo of a ${style} gated apartment society entrance in Bengaluru, India, with a security cabin, landscaped garden, and paved driveway, real estate listing photography style.`,
];

const prompts = [];
for (const style of STYLES) {
  for (const shot of SHOTS) {
    prompts.push(shot(style));
  }
}

console.log(`Generating ${prompts.length} images…`);

let saved = 0;
for (let i = 0; i < prompts.length; i++) {
  const prompt = prompts[i];
  const filename = `listing-${String(i + 1).padStart(3, "0")}.png`;
  const outPath = path.join(OUT_DIR, filename);

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      }
    );

    if (!res.ok) {
      console.error(`[${i + 1}/${prompts.length}] HTTP ${res.status}: ${await res.text()}`);
      continue;
    }

    const json = await res.json();
    const parts = json.candidates?.[0]?.content?.parts ?? [];
    const imagePart = parts.find((p) => p.inlineData?.data);

    if (!imagePart) {
      console.error(`[${i + 1}/${prompts.length}] No image data returned for: ${prompt.slice(0, 60)}...`);
      continue;
    }

    const buffer = Buffer.from(imagePart.inlineData.data, "base64");
    await writeFile(outPath, buffer);
    saved++;
    console.log(`[${i + 1}/${prompts.length}] Saved ${filename} (${(buffer.length / 1024).toFixed(0)} KB)`);
  } catch (err) {
    console.error(`[${i + 1}/${prompts.length}] Failed:`, err.message);
  }

  // Be gentle with rate limits.
  await new Promise((r) => setTimeout(r, 800));
}

console.log(`Done. Saved ${saved}/${prompts.length} images to ${OUT_DIR}`);
