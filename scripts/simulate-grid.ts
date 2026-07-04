import sharp from 'sharp';
import path from 'path';

const outDir = path.join(process.cwd(), 'scratch');
const previewOut = path.join(outDir, 'grid-preview.png');

async function generateGridPreview() {
  const teams = ['colombia', 'españa', 'argentina'];
  
  // Simulated CSS container: w-[3.4rem] = 54.4px, h-[4.5rem] = 72px
  const containerW = 54;
  const containerH = 72;
  const gap = 20;
  
  const canvasW = (containerW * 3) + (gap * 4);
  const canvasH = containerH + (gap * 2);

  // We load the normalized 600x800 previews from scratch/cami-previews/
  const composites: sharp.OverlayOptions[] = [];
  
  for (let i = 0; i < teams.length; i++) {
    const team = teams[i];
    const imgPath = path.join(outDir, 'cami-previews', `${team}-back.png`);
    
    const resized = await sharp(imgPath)
      .resize(containerW, containerH, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0.1 } })
      .toBuffer();
      
    // Add a border to simulate the bounding box in the UI
    const bordered = await sharp({
      create: { width: containerW + 2, height: containerH + 2, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } }
    })
      .composite([
        {
          input: await sharp({
            create: { width: containerW, height: containerH, channels: 4, background: { r: 40, g: 40, b: 40, alpha: 1 } }
          }).png().toBuffer(),
          left: 1, top: 1
        },
        { input: resized, left: 1, top: 1 }
      ])
      .png()
      .toBuffer();

    composites.push({
      input: bordered,
      left: gap + (i * (containerW + 2 + gap)),
      top: gap
    });
  }

  // Create a pitch-colored background to simulate the lineup graphic
  await sharp({
    create: { width: canvasW, height: canvasH, channels: 4, background: { r: 52, g: 168, b: 83, alpha: 1 } }
  })
    .composite(composites)
    .toFile(previewOut);

  console.log(`Grid preview generated at ${previewOut}`);
}

generateGridPreview().catch(console.error);
