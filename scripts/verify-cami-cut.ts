import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { TEAM_CUT_CONFIGS, NORMALIZED_CANVAS } from '../lib/stickers/teamCutConfig';

const teams = [
  'argentina', 'belgica', 'brasil', 'canada', 'colombia',
  'egipto', 'españa', 'francia', 'inglaterra', 'marruecos',
  'mejico', 'noruega', 'paraguay', 'potugal', 'suiza', 'usa'
];

const getCamiFileName = (team: string) => {
  if (team === 'españa') return 'españa-cami.png';
  if (team === 'potugal') return 'potugal-cami.png';
  if (team === 'suiza') return 'suiza.cami.png';
  if (team === 'usa') return 'usa-cami.png';
  return `${team}-cami.png`;
};
const publicDir = path.join(process.cwd(), 'public');
const outDir = path.join(process.cwd(), 'scratch', 'cami-previews');

async function processHalf(
  image: sharp.Sharp,
  box: { left: number; top: number; width: number; height: number },
  type: 'back' | 'front',
  targetHeight: number,
  outputPath: string
) {
  // 1. Extract half
  const extractedBuffer = await image.clone().extract(box).toBuffer();
  
  // 2. Trim transparent pixels to get exact bounding box of the shirt
  const { data: trimmedBuffer, info: trimInfo } = await sharp(extractedBuffer)
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .toBuffer({ resolveWithObject: true });

  // 3. Scale the bounding box to match targetHeight
  const scale = targetHeight / trimInfo.height;
  const resizedHeight = Math.round(targetHeight);
  const resizedWidth = Math.round(trimInfo.width * scale);

  const resizedBuffer = await sharp(trimmedBuffer)
    .resize(resizedWidth, resizedHeight)
    .toBuffer();

  // 4. Center inside the normalized canvas
  await sharp({
    create: {
      width: NORMALIZED_CANVAS.width,
      height: NORMALIZED_CANVAS.height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite([{ input: resizedBuffer, gravity: 'center' }])
    .toFile(outputPath);

  return {
    trimBox: `${trimInfo.width}x${trimInfo.height}`,
    scale: scale.toFixed(3)
  };
}

async function verifyCut() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const tableData = [];
  const targetHeight = NORMALIZED_CANVAS.height * 0.85;

  for (const team of teams) {
    const fileName = getCamiFileName(team);
    const inputPath = path.join(publicDir, 'camis', fileName);
    if (!fs.existsSync(inputPath)) {
      console.error(`File not found: ${inputPath}`);
      continue;
    }

    const image = sharp(inputPath);
    const metadata = await image.metadata();

    if (!metadata.width || !metadata.height) {
      console.error(`Failed to read metadata for ${team}`);
      continue;
    }

    const config = TEAM_CUT_CONFIGS[team];
    const halfWidth = Math.floor(metadata.width / 2);
    
    const backBox = config?.back || { left: halfWidth, top: 0, width: metadata.width - halfWidth, height: metadata.height };
    const frontBox = config?.front || { left: 0, top: 0, width: halfWidth, height: metadata.height };

    const backInfo = await processHalf(image, backBox, 'back', targetHeight, path.join(outDir, `${team}-back.png`));
    const frontInfo = await processHalf(image, frontBox, 'front', targetHeight, path.join(outDir, `${team}-front.png`));

    tableData.push({
      Team: team,
      'Native Dim': `${metadata.width}x${metadata.height}`,
      'Back Trim Box': backInfo.trimBox,
      'Back Scale': backInfo.scale,
      'Front Trim Box': frontInfo.trimBox,
      'Front Scale': frontInfo.scale
    });
  }

  console.table(tableData);
}

verifyCut().catch(console.error);
