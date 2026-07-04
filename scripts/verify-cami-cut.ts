import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const teams = ['argentina', 'francia', 'usa'];
const publicDir = path.join(process.cwd(), 'public');
const outDir = path.join(process.cwd(), 'scratch', 'cami-previews');

async function verifyCut() {
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  for (const team of teams) {
    const inputPath = path.join(publicDir, 'camis', `${team}-cami.png`);
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

    const halfWidth = Math.floor(metadata.width / 2);

    // Extract right half (back of shirt)
    await image
      .clone()
      .extract({ left: halfWidth, top: 0, width: metadata.width - halfWidth, height: metadata.height })
      .toFile(path.join(outDir, `${team}-back.png`));

    // Extract left half (front of shirt)
    await image
      .clone()
      .extract({ left: 0, top: 0, width: halfWidth, height: metadata.height })
      .toFile(path.join(outDir, `${team}-front.png`));

    console.log(`Verified ${team}: ${metadata.width}x${metadata.height}. Cut at ${halfWidth}. Previews saved to scratch/cami-previews/`);
  }
}

verifyCut().catch(console.error);
