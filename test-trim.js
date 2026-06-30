const sharp = require('sharp');
const fs = require('fs');

async function testTrim() {
  const imgPath = 'public/images/equipaciones/francia.png';
  const img = sharp(imgPath);
  const metadata = await img.metadata();
  
  const totalRows = 4;
  const cellH = metadata.height / totalRows; // 354
  
  // France 2018 Home
  // col = 2.5
  // center = (713.5 + 983.5) / 2 = 848.5
  const center = 848.5;
  const avgCellW = (983.5 - 158.5) / 3;
  const cropWidth = avgCellW * 0.90;
  const cropX = center - cropWidth / 2;
  
  // Extract FULL cell height (0 to 354, or row*354 to (row+1)*354)
  // row = 3 (2018)
  const cropY = 3 * cellH;
  
  const extracted = img.clone().extract({ 
    left: Math.floor(cropX), 
    top: Math.floor(cropY), 
    width: Math.floor(cropWidth), 
    height: Math.floor(cellH) 
  });
  
  await extracted.trim().toFile('public/test-trim-france-2018.png');
}
testTrim().catch(console.error);
