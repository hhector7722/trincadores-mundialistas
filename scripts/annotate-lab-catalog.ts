/**

 * Anota lab_suitability y face_focus en momentos player del catálogo.

 * Siluetas: solo pool fácil (sin Martínez).

 */

import { readFile, writeFile } from "node:fs/promises";

import { join } from "node:path";

import { SILHOUETTE_LAB_MOMENT_ID_SET } from "@/lib/quiz/lab/silhouette-lab-pool";



type MomentRow = {

  id: string;

  moment_type: string;

  quiz: { answer_type: string; blur_start_px?: number };

  lab_suitability?: string[];

  face_focus?: { x: number; y: number };

};



const HAIR_EYES_IDS = new Set([

  "wc1978-kempes-celebration",

  "wc1990-schillaci-celebration",

  "wc1994-bebeto-celebration",

  "wc1998-thuram-celebration",

  "wc2014-gotze-goal",

  "wc2018-pavard-volley",

  "wc2022-messi-cup",

  "wc1986-maradona-goal",

  "wc1970-jairzinho-goal",

  "wc2006-grosso-penalty",

  "wc2010-iniesta-final-goal",

  "wc1982-tardelli-goal",

]);



const FACE_FOCUS_OVERRIDES: Record<string, { x: number; y: number }> = {

  "wc2014-gotze-goal": { x: 0.52, y: 0.22 },

  "wc2018-pavard-volley": { x: 0.48, y: 0.24 },

  "wc2022-messi-cup": { x: 0.5, y: 0.18 },

  "wc1986-maradona-goal": { x: 0.45, y: 0.2 },

  "wc2010-iniesta-final-goal": { x: 0.55, y: 0.2 },

  "wc2014-james-volley": { x: 0.5, y: 0.28 },

};



function defaultFaceFocus(moment: MomentRow): { x: number; y: number } {

  const override = FACE_FOCUS_OVERRIDES[moment.id];

  if (override) return override;

  const blur = moment.quiz.blur_start_px ?? 28;

  return { x: 0.5, y: Math.min(0.45, Math.max(0.12, blur / 100)) };

}



const catalogPath = join(process.cwd(), "data/quiz/images/world-cup-moments.json");



async function main() {

  const raw = JSON.parse(await readFile(catalogPath, "utf8")) as {

    version: number;

    moments: MomentRow[];

  };



  let updated = 0;

  for (const moment of raw.moments) {

    if (moment.quiz.answer_type !== "player") continue;



    const inSilhouettePool = SILHOUETTE_LAB_MOMENT_ID_SET.has(moment.id);

    const hairEyes =

      HAIR_EYES_IDS.has(moment.id) ||

      moment.moment_type === "celebration" ||

      moment.moment_type === "iconic";



    if (hairEyes) {

      moment.lab_suitability = inSilhouettePool

        ? ["hair", "eyes", "silhouette"]

        : ["hair", "eyes"];

      moment.face_focus = defaultFaceFocus(moment);

    } else if (inSilhouettePool) {

      moment.lab_suitability = ["silhouette"];

      delete moment.face_focus;

    } else {

      delete moment.lab_suitability;

      delete moment.face_focus;

    }

    updated += 1;

  }



  await writeFile(catalogPath, `${JSON.stringify(raw, null, 2)}\n`, "utf8");

  console.log(`Anotados ${updated} momentos player en ${catalogPath}`);

}



main().catch((error) => {

  console.error(error);

  process.exit(1);

});


