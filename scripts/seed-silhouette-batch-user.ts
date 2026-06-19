/**
 * Instala las 10 siluetas del lote manual (ChatGPT) — reveal + pregunta.
 * npm run quiz:seed-silhouette-batch-user
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
    momentId: "wc1994-bebeto-celebration",
    historic: "public/images/quiz/historic/1994/wc1994-bebeto-celebration.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1994-bebeto-celebration-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_bebeto-fd0b85d0-32c6-477a-85d8-50f4af0e14b9.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_bebeto-silueta-3ad5a289-c26f-45c4-8da6-42cd63d8af82.png",
  },
  {
    momentId: "wc2014-suarez-bite",
    historic: "public/images/quiz/historic/2014/wc2014-suarez-bite.jpg",
    silhouette: "public/images/quiz/lab/generated/wc2014-suarez-bite-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_chiellini-7089e899-818b-4a73-9011-828a2d9b84e2.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_chiellini-silueta-edbc9272-6738-49ca-a236-b80e19d75e1e.png",
  },
  {
    momentId: "wc1990-rijkaard-voller",
    historic: "public/images/quiz/historic/1990/wc1990-rijkaard-voller.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1990-rijkaard-voller-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_frank-c7efe968-941d-4702-b59b-5042a54f2a45.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_frank-silueta-698a7b77-55ee-4108-8c61-af8c8e7d759c.png",
  },
  {
    momentId: "wc1970-rivelino-kick",
    historic: "public/images/quiz/historic/1970/wc1970-rivelino-kick.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1970-rivelino-kick-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_rivelino-af39efb3-7084-4cad-a84f-89842c3dacb2.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_rivelino-silueta-4d761251-4ecd-4be7-b34b-71a1035f81f6.png",
  },
  {
    momentId: "wc2014-gotze-goal",
    historic: "public/images/quiz/historic/2014/wc2014-gotze-goal.jpg",
    silhouette: "public/images/quiz/lab/generated/wc2014-gotze-goal-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_demichelis-1cec99fd-3ec2-4bbb-91db-33792e464cc4.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_demichelis-silueta-28c29f1d-48fd-48d6-a81c-c6219295e840.png",
  },
  {
    momentId: "wc1994-luis-enrique-blood",
    historic: "public/images/quiz/historic/1994/wc1994-luis-enrique-blood.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1994-luis-enrique-blood-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_hierro-a74f29d8-bbbf-4008-b722-fb482e77a76c.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_hierro-silueta-845e900c-3801-4770-a286-3fc8a81a9116.png",
  },
  {
    momentId: "wc1997-ronaldo-maldini-tackle",
    historic: "public/images/quiz/historic/1997/wc1997-ronaldo-maldini-tackle.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1997-ronaldo-maldini-tackle-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_ronaldo-f94ea7d5-e04a-4fde-95e3-348ad670740b.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_ronaldo-silueta-b4a9bb2c-3bcc-4efd-86c6-91345b8c223f.png",
  },
  {
    momentId: "wc2006-zidane-headbutt",
    historic: "public/images/quiz/historic/2006/wc2006-zidane-headbutt.jpg",
    silhouette: "public/images/quiz/lab/generated/wc2006-zidane-headbutt-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_materazzi-2ba85b3f-c2a5-476d-b571-12157fc935cd.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_materazzi-silueta-47457241-1d31-452d-af13-1ac878e7718d.png",
  },
  {
    momentId: "wc1970-pele-jairzinho-celebration",
    historic: "public/images/quiz/historic/1970/wc1970-pele-jairzinho-celebration.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1970-pele-jairzinho-celebration-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_jairzinho-ae9f8b7f-e9b1-4741-a1a9-61bda6f6d613.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_jairzinho-silueta-c69a34f3-14b7-4998-82cb-00986bca9ac2.png",
  },
  {
    momentId: "wc1994-baggio-penalty",
    historic: "public/images/quiz/historic/1994/wc1994-baggio-penalty.jpg",
    silhouette: "public/images/quiz/lab/generated/wc1994-baggio-penalty-silhouette.jpg",
    sourceHistoric:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_baggio-f046542e-0ed1-46fa-872b-91f519adf97b.png",
    sourceSilhouette:
      "c__Users_hhect_AppData_Roaming_Cursor_User_workspaceStorage_d54bb331fada77eb3d566fde83608481_images_baggio-silueta-c94f7ef8-4e5e-482a-973f-14561bbf9e59.png",
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
    await writeJpegFromSource(item.sourceSilhouette, item.silhouette);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
