const sharp = require('sharp');
const fs = require('fs');

async function getBoundingBox(imagePath, isRightHalf) {
  const metadata = await sharp(imagePath).metadata();
  const width = metadata.width;
  const height = metadata.height;
  
  // Extraer la mitad correspondiente
  const left = isRightHalf ? Math.floor(width / 2) : 0;
  const extractWidth = Math.floor(width / 2);
  
  const { data, info } = await sharp(imagePath)
    .extract({ left: left, top: 0, width: extractWidth, height: height })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let minX = extractWidth;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < extractWidth; x++) {
      const alpha = data[(y * extractWidth + x) * 4 + 3];
      if (alpha > 10) { // Umbral de opacidad
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  
  return {
    left: minX + left,
    top: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1
  };
}

async function processTeams() {
  const teams = ['inglaterra', 'españa', 'potugal'];
  const results = {};
  
  for (const team of teams) {
    const filePath = `public/camis/${team}-cami.png`;
    if (!fs.existsSync(filePath)) {
      console.log(`No se encontro ${filePath}`);
      continue;
    }
    const front = await getBoundingBox(filePath, false);
    const back = await getBoundingBox(filePath, true);
    
    results[team] = {
      back: { left: back.left, top: back.top, width: back.width, height: back.height },
      front: { left: front.left, top: front.top, width: front.width, height: front.height }
    };
  }
  
  console.log(JSON.stringify(results, null, 2));
}

processTeams().catch(console.error);
