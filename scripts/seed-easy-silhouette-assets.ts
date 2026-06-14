/**
 * Instala imágenes históricas + siluetas ChatGPT de los 3 momentos nuevos.
 * npm run quiz:seed-easy-silhouette-assets
 */
import { mkdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import sharp from "sharp";

const ASSETS = resolve(
  process.cwd(),
  "..",
  ".cursor",
  "projects",
  "c-Users-hhect-trincadores-mundialistas",
  "assets"
);

const INSTALL_TARGETS = [
  {
    historic: "public/images/quiz/historic/1997/wc1997-roberto-carlos-freekick.jpg",
    generated: "public/images/quiz/lab/generated/wc1997-roberto-carlos-freekick-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_r.carlos-413c6c4a-478c-4077-a0f9-3deb66855c5c.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_f5f4ea17-12f5-4ea8-be0b-46377a8cb82b-a1a50d72-6da3-40e5-90e1-fe67ec4a5ee5.png",
  },
  {
    historic: "public/images/quiz/historic/2014/wc2014-van-persie-flying-header.jpg",
    generated: "public/images/quiz/lab/generated/wc2014-van-persie-flying-header-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_persie-3ae7dd21-748e-4eae-be43-726af2914715.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_998042c2-4635-46ea-a804-5574e631c332-b04660ab-0c1c-4dec-9106-f39e22ac67ad.png",
  },
  {
    historic: "public/images/quiz/historic/2010/wc2010-spain-xi-silhouette.jpg",
    generated: "public/images/quiz/lab/generated/wc2010-spain-xi-silhouette-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_image-cc35f5b3-0264-4dd8-9831-8ed20cb1864d.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_image-3bbf4203-2ae0-4573-96f6-270d2be6e385.png",
  },
] as const;

async function writeJpegFromSource(sourceFile: string, targetFile: string): Promise<void> {
  const input = join(ASSETS, sourceFile);
  const output = resolve(process.cwd(), targetFile);
  mkdirSync(dirname(output), { recursive: true });
  await sharp(input).jpeg({ quality: 90 }).toFile(output);
  console.log(`OK ${targetFile}`);
}

async function main() {
  for (const item of INSTALL_TARGETS) {
    await writeJpegFromSource(item.sourceHistoric, item.historic);
    await writeJpegFromSource(item.sourceSilhouette, item.generated);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
