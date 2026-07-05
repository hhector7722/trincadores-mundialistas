import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const dir = 'public/camis';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.png'));

async function processImages() {
  for (const file of files) {
    const p = path.join(dir, file);
    const temp = path.join(dir, 'tmp_' + file);
    
    // Resize to max 300x300 and convert to a smaller png
    await sharp(p)
      .resize({ width: 300, height: 300, fit: 'inside' })
      .png({ quality: 80, compressionLevel: 9 })
      .toFile(temp);
      
    // Overwrite the original
    fs.renameSync(temp, p);
    console.log(`Optimized ${file}`);
  }
}

processImages().catch(console.error);
