import satori from 'satori';
import sharp from 'sharp';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;
export const FONT = 'Inter';

const WEIGHTS = [400, 600, 700];

let fonts = null;
let logo = null;

/* Satori reads WOFF but not WOFF2, so the fonts come from the WOFF
   files @fontsource/inter ships. */
async function loadFonts() {
  if (fonts) return fonts;
  const dir = join(process.cwd(), 'node_modules', '@fontsource', 'inter', 'files');
  fonts = await Promise.all(
    WEIGHTS.map(async (weight) => ({
      name: FONT,
      data: await readFile(join(dir, `inter-latin-${weight}-normal.woff`)),
      weight,
      style: 'normal',
    }))
  );
  return fonts;
}

/* The site logo as a data URI, downsized to the largest size a
   template draws it at. */
export async function loadLogo() {
  if (logo) return logo;
  const png = await sharp(join(process.cwd(), 'public', 'doggo.png')).resize(128, 128).png().toBuffer();
  logo = `data:image/png;base64,${png.toString('base64')}`;
  return logo;
}

export async function generateOgImage(element) {
  const svg = await satori(element, {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
