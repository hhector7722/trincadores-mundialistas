/**
 * Instala siluetas ChatGPT: Di María, Stoichkov, Zidane.
 * npm run quiz:seed-silhouette-batch-2
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

const INSTALL = [
  {
    generated: "public/images/quiz/lab/generated/wc2022-dimaria-cup-kiss-silhouette.jpg",
    source:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_cf6f215b-78b5-4da8-8f95-59fbdb8e3490-bb9edefb-8530-4b93-9f2f-e521a9c6df1b.png",
  },
  {
    generated: "public/images/quiz/lab/generated/wc1994-stoichkov-greece-silhouette.jpg",
    source:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_291d891c-2aed-4ade-af69-8e82a3871807-c6ba896c-d7b3-47a9-a6f4-079a818bff2a.png",
  },
  {
    generated: "public/images/quiz/lab/generated/wc2006-zidane-trophy-walk-silhouette.jpg",
    source:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_image-87407d60-f972-47ee-8343-9799eb1b7ccb.png",
  },
] as const;

async function writeJpeg(sourceFile: string, targetFile: string): Promise<void> {
  const input = join(ASSETS, sourceFile);
  const output = resolve(process.cwd(), targetFile);
  mkdirSync(dirname(output), { recursive: true });
  await sharp(input).jpeg({ quality: 90 }).toFile(output);
  console.log(`OK ${targetFile}`);
}

async function main() {
  for (const item of INSTALL) {
    await writeJpeg(item.source, item.generated);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
