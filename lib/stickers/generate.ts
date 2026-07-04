import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Generates a sticker (back of shirt with squad number) for a player.
 * @param team Team name (normalized for files, e.g. 'españa')
 * @param squadNumber Number to print on the back
 * @returns PNG buffer of the sticker
 */
export async function generateSticker(team: string, squadNumber: number): Promise<Buffer> {
  // Fix naming typos / conventions if passed raw team name
  let camiFileName = `${team}-cami.png`;
  if (team === 'españa') camiFileName = 'españa-cami.png';
  if (team === 'potugal') camiFileName = 'potugal-cami.png';
  if (team === 'suiza') camiFileName = 'suiza.cami.png';
  if (team === 'usa') camiFileName = 'usa-cami.png';
  
  const camiPath = path.join(PUBLIC_DIR, 'camis', camiFileName);
  const camiImage = sharp(camiPath);
  const camiMeta = await camiImage.metadata();
  
  if (!camiMeta.width || !camiMeta.height) {
    throw new Error(`Invalid cami image for team ${team}`);
  }

  // 1. Extract the back of the shirt (right half)
  const halfWidth = Math.floor(camiMeta.width / 2);
  const shirtBack = await camiImage
    .extract({ left: halfWidth, top: 0, width: camiMeta.width - halfWidth, height: camiMeta.height })
    .toBuffer();

  // 2. Load the font manifest and glyphs
  const manifestPath = path.join(PUBLIC_DIR, 'fonts', team, 'manifest.json');
  const manifestRaw = await fs.readFile(manifestPath, 'utf-8');
  const manifest = JSON.parse(manifestRaw);
  
  const squadNumStr = squadNumber.toString();
  const digits = squadNumStr.split('');
  
  // 3. Prepare the composite digits
  const digitBuffers = await Promise.all(
    digits.map(async (d) => {
      const glyphPath = path.join(PUBLIC_DIR, 'fonts', team, 'glyphs', `${d}.png`);
      const buf = await fs.readFile(glyphPath);
      const meta = await sharp(buf).metadata();
      return {
        buffer: buf,
        width: meta.width || 0,
        height: meta.height || 0
      };
    })
  );

  // 4. Calculate total width of the combined digits and spacing
  // Use a small spacing gap between digits, e.g., 5% of a digit's width
  const gap = digitBuffers.length > 1 ? Math.floor(digitBuffers[0].width * 0.05) : 0;
  const totalDigitsWidth = digitBuffers.reduce((sum, d) => sum + d.width, 0) + gap * (digits.length - 1);
  const maxDigitHeight = Math.max(...digitBuffers.map(d => d.height));

  // Create a transparent canvas to hold the combined number
  const numberCanvas = sharp({
    create: {
      width: totalDigitsWidth,
      height: maxDigitHeight,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  });

  const numberComposites: sharp.OverlayOptions[] = [];
  let currentX = 0;
  for (const digit of digitBuffers) {
    numberComposites.push({
      input: digit.buffer,
      left: currentX,
      top: 0
    });
    currentX += digit.width + gap;
  }

  const combinedNumberBuf = await numberCanvas
    .composite(numberComposites)
    .png()
    .toBuffer();

  // 5. Center the combined number on the shirt back
  // Vertically, we place it roughly at the upper-middle section (e.g. 35% from the top)
  const shirtHalfWidth = camiMeta.width - halfWidth;
  const overlayX = Math.floor((shirtHalfWidth - totalDigitsWidth) / 2);
  const overlayY = Math.floor(camiMeta.height * 0.35);

  const finalSticker = await sharp(shirtBack)
    .composite([
      {
        input: combinedNumberBuf,
        left: overlayX,
        top: overlayY,
        // Since fonts were black-on-white and we made white transparent,
        // we can apply them directly. Depending on the team colors, some fonts might be light.
        // We assume the font image colors are correct as provided.
      }
    ])
    .png()
    .toBuffer();

  return finalSticker;
}
