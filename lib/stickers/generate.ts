import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { TEAM_CUT_CONFIGS, NORMALIZED_CANVAS } from './teamCutConfig';

const PUBLIC_DIR = path.join(process.cwd(), 'public');

/**
 * Generates a sticker (back of shirt with squad number) for a player.
 * @param team Team name (normalized for files, e.g. 'españa')
 * @param squadNumber Number to print on the back
 * @returns PNG buffer of the sticker (normalized to 600x800)
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

  // 1. Extract the back of the shirt using config or 50% default
  const config = TEAM_CUT_CONFIGS[team]?.back;
  let extractBox = { left: 0, top: 0, width: 0, height: 0 };
  
  if (config) {
    extractBox = config;
  } else {
    const halfWidth = Math.floor(camiMeta.width / 2);
    extractBox = { left: halfWidth, top: 0, width: camiMeta.width - halfWidth, height: camiMeta.height };
  }

  // Extraer la trasera original
  const extractedBack = await camiImage
    .extract(extractBox)
    .toBuffer();

  // Trim the transparent pixels to get the real bounding box of the shirt
  const { data: trimmedBack, info: trimInfo } = await sharp(extractedBack)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer({ resolveWithObject: true });

  // Scale the bounding box to match targetHeight (85% of normalized canvas)
  const targetHeight = NORMALIZED_CANVAS.height * 0.85;
  const scale = targetHeight / trimInfo.height;
  const resizedHeight = Math.round(targetHeight);
  const resizedWidth = Math.round(trimInfo.width * scale);

  const resizedShirtBack = await sharp(trimmedBack)
    .resize(resizedWidth, resizedHeight)
    .toBuffer();

  // Center the resized shirt inside the normalized canvas
  const shirtBack = await sharp({
    create: {
      width: NORMALIZED_CANVAS.width,
      height: NORMALIZED_CANVAS.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resizedShirtBack, gravity: 'center' }])
    .png()
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
  const gap = digitBuffers.length > 1 ? Math.floor(digitBuffers[0].width * 0.05) : 0;
  const totalDigitsWidth = digitBuffers.reduce((sum, d) => sum + d.width, 0) + gap * (digits.length - 1);
  const maxDigitHeight = Math.max(...digitBuffers.map(d => d.height));

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

  // 5. Scale the combined number to a proportional size relative to the shirt height
  const targetNumberHeight = Math.round(targetHeight * 0.28);
  const numberScale = targetNumberHeight / maxDigitHeight;
  const scaledNumberWidth = Math.round(totalDigitsWidth * numberScale);

  const scaledNumberBuf = await sharp(combinedNumberBuf)
    .resize(scaledNumberWidth, targetNumberHeight)
    .toBuffer();

  // 6. Center the scaled number on the normalized shirt back
  // Now using NORMALIZED_CANVAS dimensions for placing the number
  const overlayX = Math.floor((NORMALIZED_CANVAS.width - scaledNumberWidth) / 2);
  const overlayY = Math.floor(NORMALIZED_CANVAS.height * 0.35);

  const finalSticker = await sharp(shirtBack)
    .composite([
      {
        input: scaledNumberBuf,
        left: overlayX,
        top: overlayY,
      }
    ])
    .png()
    .toBuffer();

  return finalSticker;
}
