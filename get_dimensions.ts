import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function main() {
  const dir = path.join(process.cwd(), 'public', 'images', 'equipaciones');
  const files = fs.readdirSync(dir);
  for (const f of files) {
    if (f.endsWith('.png')) {
      const meta = await sharp(path.join(dir, f)).metadata();
      console.log(File:  -> x);
    }
  }
}
main();
