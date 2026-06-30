import { NextResponse } from "next/server";
import sharp from "sharp";
import path from "path";
import { JERSEY_CROP_MAP, TEAMS_DATA } from "@/lib/quiz/lab/jersey-crop-map";
import fs from "fs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get("key");

  if (!key) {
    return NextResponse.json({ error: "Missing key parameter" }, { status: 400 });
  }

  const crop = JERSEY_CROP_MAP[key];
  if (!crop) {
    return NextResponse.json({ error: "Crop not found" }, { status: 404 });
  }

  const imagePath = path.join(process.cwd(), "public", "images", "equipaciones", crop.file);

  if (!fs.existsSync(imagePath)) {
    return NextResponse.json({ error: "Source image not found" }, { status: 404 });
  }

  try {
    const img = sharp(imagePath);
    const metadata = await img.metadata();

    // Find the team to determine how many rows the grid has
    const teamData = TEAMS_DATA.find((t) => t.name === crop.team);
    if (!teamData) {
      throw new Error("Team data not found for dynamic crop");
    }

    // Determine position based on year index
    const yearIndex = teamData.years.indexOf(crop.year);
    if (yearIndex === -1) {
      throw new Error("Year not found in team data");
    }

    const totalItems = teamData.years.length;
    const totalRows = Math.ceil(totalItems / 4);
    const cellH = metadata.height / totalRows;

    const row = Math.floor(yearIndex / 4);
    const originalCol = yearIndex % 4;

    const itemsLeft = totalItems - row * 4;
    const itemsInThisRow = Math.min(4, itemsLeft);
    const shiftCols = (4 - itemsInThisRow) / 2;
    const col = originalCol + shiftCols;
    
    let center = 0;
    
    // Interpolate the center if `col` is a fractional number (e.g., 0.5, 1.5, 2.5)
    // We get the base column index and check if there's a fractional part
    const colFloor = Math.floor(col);
    const colFraction = col - colFloor;
    
    // The columns are 0-3 for Home, and 4-7 for Away
    const baseIndex = crop.kit === "away" ? colFloor + 4 : colFloor;
    
    if (colFraction === 0) {
      center = teamData.centers[baseIndex];
    } else {
      // It's in between two columns (e.g. 0.5 is between 0 and 1)
      const nextIndex = baseIndex + 1;
      center = (teamData.centers[baseIndex] + teamData.centers[nextIndex]) / 2;
    }
    
    // Calculate cellW based on the average spacing between columns to size the crop window
    const avgCellW = (teamData.centers[3] - teamData.centers[0]) / 3;
    const cropWidth = avgCellW * 0.90;
    const cropX = center - cropWidth / 2;

    // To find the exact Y bounds of the shirt, we scan down the image at x = center
    const targetX = Math.floor(center);
    const { data } = await img.raw().toBuffer({ resolveWithObject: true });
    
    const pixels = new Uint8Array(metadata.height!);
    for (let y = 0; y < metadata.height!; y++) {
      const a = data[(y * metadata.width! + targetX) * 4 + 3];
      pixels[y] = a > 50 ? 1 : 0;
    }
    
    const shirts = [];
    let currentShirt = null;
    for (let y = 0; y < metadata.height!; y++) {
      if (pixels[y] === 1) {
        if (!currentShirt) currentShirt = { top: y, bottom: y };
        else currentShirt.bottom = y;
      } else {
        if (currentShirt) {
          if (currentShirt.bottom - currentShirt.top > 50) shirts.push(currentShirt);
          currentShirt = null;
        }
      }
    }
    if (currentShirt && currentShirt.bottom - currentShirt.top > 50) shirts.push(currentShirt);
    
    // Determine the vertical index of our shirt in this specific column
    function getColForYearIndex(idx: number) {
      const r = Math.floor(idx / 4);
      const origC = idx % 4;
      const itLeft = totalItems - r * 4;
      const itInRow = Math.min(4, itLeft);
      const sCols = (4 - itInRow) / 2;
      return origC + sCols;
    }
    
    let verticalIndex = 0;
    for (let i = 0; i < yearIndex; i++) {
      if (getColForYearIndex(i) === col) verticalIndex++;
    }
    
    if (verticalIndex >= shirts.length) {
      throw new Error(`Vertical index ${verticalIndex} out of bounds (${shirts.length} found)`);
    }
    
    const shirtBounds = shirts[verticalIndex];
    const pad = 10;
    const cropY = Math.max(0, shirtBounds.top - pad);
    const cropHeight = Math.min(metadata.height! - cropY, (shirtBounds.bottom - shirtBounds.top) + pad * 2);

    // We must reinstantiate sharp because .raw().toBuffer() consumes the pipeline
    const imgForCrop = sharp(imagePath);
    const buffer = await imgForCrop
      .extract({ 
        left: Math.floor(cropX), 
        top: Math.floor(cropY), 
        width: Math.floor(cropWidth), 
        height: Math.floor(cropHeight) 
      })
      .toBuffer();

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[jersey-crop] Error processing image:", err);
    return NextResponse.json({ error: "Error processing image" }, { status: 500 });
  }
}
