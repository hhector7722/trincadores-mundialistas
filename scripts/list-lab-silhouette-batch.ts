/**
 * Lista los 25 momentos player para generar siluetas en ChatGPT.
 * npm run quiz:list-lab-silhouette-batch
 */

import { join } from "node:path";
import { buildSilhouetteImagePrompt } from "@/lib/quiz/lab/openai-silhouette.server";
import { listPlayerMomentsForLab } from "@/lib/quiz/lab/materialize-assets.server";
import { resolveMomentImageUrl } from "@/lib/quiz/world-cup-moments";

const moments = listPlayerMomentsForLab().sort((a, b) => a.year - b.year || a.id.localeCompare(b.id));

console.log(`# Lote siluetas laboratorio (${moments.length} momentos)\n`);
console.log("## Flujo por imagen\n");
console.log("1. Abre la foto en `public/...` (ruta abajo)");
console.log("2. Súbela a ChatGPT");
console.log("3. Pega el prompt (o usa `--print-prompt` por id)");
console.log("4. Descarga el JPG → guarda como `{id}-silhouette.jpg`");
console.log("5. Importa: `npm run quiz:import-lab-silhouette -- --id={id} --from=./ruta.jpg`\n");

for (let i = 0; i < moments.length; i += 1) {
  const moment = moments[i];
  const historic = resolveMomentImageUrl(moment);
  const publicRel = historic?.replace(/^\//, "public/") ?? "?";
  const abs = join(process.cwd(), publicRel.replace(/^public\//, "public/"));

  console.log(`---\n`);
  console.log(`### ${i + 1}. ${moment.label} (${moment.year})`);
  console.log(`- **ID:** \`${moment.id}\``);
  console.log(`- **Jugador a siluetear:** ${moment.quiz.correct_option}`);
  console.log(`- **Foto original:** \`${publicRel}\``);
  console.log(`- **Importar:**`);
  console.log(
    `  \`npm run quiz:import-lab-silhouette -- --id=${moment.id} --from=./siluetas/${moment.id}-silhouette.jpg\``
  );
  console.log(`- **Prompt:**`);
  console.log(`\`\`\``);
  console.log(buildSilhouetteImagePrompt(moment));
  console.log(`\`\`\``);
}

console.log(`\n## Al terminar el lote\n`);
console.log("```bash");
console.log("git add public/images/quiz/lab/generated/");
console.log('git commit -m "Materializa siluetas del laboratorio vía ChatGPT"');
console.log("git push");
console.log("```");
