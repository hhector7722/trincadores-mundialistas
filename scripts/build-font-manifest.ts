import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const TEAMS = [
  'argentina', 'belgica', 'brasil', 'canada', 'colombia', 
  'egipto', 'españa', 'francia', 'inglaterra', 'marruecos', 
  'mejico', 'noruega', 'paraguay', 'potugal', 'suiza', 'usa'
];

const FALLBACK_TEAMS = ['canada', 'francia', 'noruega', 'potugal', 'suiza'];
const PUBLIC_DIR = path.join(process.cwd(), 'public');
const FONTS_DIR = path.join(PUBLIC_DIR, 'fonts');

// Normalization mapping for filenames with typos or special characters
const getFontFileName = (team: string) => {
  if (team === 'españa') return 'españa-font.png';
  if (team === 'potugal') return 'portugal-font.png';
  if (team === 'usa') return 'USA-font.png';
  return `${team}-font.png`;
};

async function processFont(team: string) {
  const isFallback = FALLBACK_TEAMS.includes(team);
  const outDir = path.join(FONTS_DIR, team);
  const glyphsDir = path.join(outDir, 'glyphs');
  
  if (!fs.existsSync(glyphsDir)) {
    fs.mkdirSync(glyphsDir, { recursive: true });
  }

  const manifest = {
    team,
    font_source: isFallback ? 'shared_fallback' : 'own',
    font_used: isFallback ? 'marruecos' : team,
    note: "Letters (names) are out of scope for this iteration as a permanent product decision. Only digits are processed.",
    digits: {} as Record<string, { width: number, height: number }>
  };

  if (isFallback) {
    // For fallbacks, we don't process their own image, we just copy the manifest from marruecos
    // Wait, the instructions said: "generar su manifest apuntando a los glifos físicos de marruecos (copia, no symlink)"
    // We will just copy the marruecos glyphs later, or we can just point the generate script to read from marruecos directly?
    // "apuntando a los glifos físicos de marruecos (copia, no symlink)" -> meaning copy the PNGs into their glyphs folder.
    const sourceGlyphs = path.join(FONTS_DIR, 'marruecos', 'glyphs');
    if (fs.existsSync(sourceGlyphs)) {
      for (let i = 0; i <= 9; i++) {
        fs.copyFileSync(path.join(sourceGlyphs, `${i}.png`), path.join(glyphsDir, `${i}.png`));
      }
      const marruecosManifest = JSON.parse(fs.readFileSync(path.join(FONTS_DIR, 'marruecos', 'manifest.json'), 'utf-8'));
      manifest.digits = marruecosManifest.digits;
    }
    fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    console.log(`[${team}] Created fallback manifest (copied from marruecos)`);
    return;
  }

  const fileName = getFontFileName(team);
  const filePath = path.join(FONTS_DIR, fileName);
  
  if (!fs.existsSync(filePath)) {
    console.warn(`[${team}] Font file not found: ${filePath}`);
    return;
  }

  const image = sharp(filePath);
  const metadata = await image.metadata();
  
  if (!metadata.width || !metadata.height) throw new Error("No metadata");

  // The digits are in the second row. We assume height / 2.
  const rowHeight = Math.floor(metadata.height / 2);
  const digitsBuffer = await image
    .clone()
    .extract({ left: 0, top: rowHeight, width: metadata.width, height: metadata.height - rowHeight })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const { data, info } = digitsBuffer;
  const { width, height, channels } = info;

  // Edge detection by column to find the 10 digits
  // Background is white, so we look for non-white pixels (RGB < 250)
  // Instead of global projection (which fails if digits touch or have noise between them),
  // we divide the image into 10 equal grid cells, and then use edge detection
  // within each cell to find the exact width of the digit (not monospaced).
  const cellWidth = Math.floor(width / 10);
  
  for (let i = 0; i < 10; i++) {
    const startX = i * cellWidth;
    const endX = (i + 1) * cellWidth;
    
    // Find left and right bounds of ink in this cell
    let firstInkX = -1;
    let lastInkX = -1;
    
    for (let x = startX; x < endX; x++) {
      let hasInk = false;
      for (let y = 0; y < height; y++) {
        const idx = (y * width + x) * channels;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = channels === 4 ? data[idx + 3] : 255;
        
        if (a > 10 && (r < 220 || g < 220 || b < 220)) {
          hasInk = true;
          break;
        }
      }
      if (hasInk) {
        if (firstInkX === -1) firstInkX = x;
        lastInkX = x;
      }
    }
    
    // If no ink found (e.g. empty cell), just use the center or the whole cell
    if (firstInkX === -1) {
      firstInkX = startX;
      lastInkX = endX - 1;
    }
    
    const segWidth = lastInkX - firstInkX + 1;
    
    // Extract just this cropped segment
    const digitImg = sharp(digitsBuffer.data, { raw: digitsBuffer.info })
      .extract({ left: firstInkX, top: 0, width: segWidth, height });

    // Make white transparent so it can be composited later
    const rawDigit = await digitImg.raw().toBuffer({ resolveWithObject: true });
    for (let p = 0; p < rawDigit.data.length; p += rawDigit.info.channels) {
      const r = rawDigit.data[p];
      const g = rawDigit.data[p + 1];
      const b = rawDigit.data[p + 2];
      if (r > 240 && g > 240 && b > 240) {
        rawDigit.data[p + 3] = 0; // Alpha to 0
      }
    }

    // Do not trim vertically! We need to keep the full row height to maintain the baseline.
    const finalBuffer = await sharp(rawDigit.data, { raw: rawDigit.info }).png().toBuffer({ resolveWithObject: true });
    
    const outPath = path.join(glyphsDir, `${i}.png`);
    fs.writeFileSync(outPath, finalBuffer.data);

    manifest.digits[i.toString()] = {
      width: finalBuffer.info.width,
      height: finalBuffer.info.height
    };
  }

  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`[${team}] Processed 10 digits using grid-based edge detection.`);
}

async function run() {
  // Process real fonts first
  for (const team of TEAMS) {
    if (!FALLBACK_TEAMS.includes(team)) {
      await processFont(team);
    }
  }
  // Process fallbacks next (so marruecos is already done)
  for (const team of FALLBACK_TEAMS) {
    await processFont(team);
  }
}

run().catch(console.error);
