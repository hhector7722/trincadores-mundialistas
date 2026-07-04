import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { TEAM_CUT_CONFIGS } from '../lib/stickers/teamCutConfig';

const teams = ['belgica', 'colombia', 'inglaterra'];
const publicDir = path.join(process.cwd(), 'public');
const outDir = path.join(process.cwd(), 'scratch', 'trim-isolated');

const thresholds = [10]; // Sharp default is 10

async function run() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const team of teams) {
    let fileName = `${team}-cami.png`;
    if (team === 'españa') fileName = 'españa-cami.png';
    const inputPath = path.join(publicDir, 'camis', fileName);
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    const halfWidth = Math.floor((metadata.width || 0) / 2);
    
    const config = TEAM_CUT_CONFIGS[team];
    const backBox = config?.back || { left: halfWidth, top: 0, width: (metadata.width || 0) - halfWidth, height: metadata.height || 0 };

    const extracted = await image.clone().extract(backBox).toBuffer();

    for (const threshold of thresholds) {
      const { data: trimmed, info } = await sharp(extracted)
        .trim({ threshold, background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .toBuffer({ resolveWithObject: true });

      await sharp(trimmed).toFile(path.join(outDir, `back-trim-${team}.png`));
      console.log(`${team} (Threshold ${threshold}): ${info.width}x${info.height}`);
    }
  }
}

run().catch(console.error);
