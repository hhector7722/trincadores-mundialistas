import { loadEnvConfig } from "@next/env";
loadEnvConfig(process.cwd());

import { generateNextJerseyPickQuestion } from "../lib/quiz/lab/generate-jersey-pick-question";
import { createAdminClient } from "../lib/scripts/supabase-admin";

async function main() {
  const targetDate = "2099-01-01";
  console.log(`[Preview] Generando jersey pick para ${targetDate}...`);

  const admin = createAdminClient();

  // Limpiar anterior si existe
  await admin.from("quiz_jersey_pick_bank").delete().eq("target_date", targetDate);

  try {
    await generateNextJerseyPickQuestion(targetDate);
    
    const { data: record, error } = await admin
      .from("quiz_jersey_pick_bank")
      .select("*")
      .eq("target_date", targetDate)
      .single();

    if (error || !record) {
      console.error("[Preview] No se pudo recuperar el registro generado.");
      return;
    }

    console.log("\n--- RESULTADO GENERADO ---");
    console.log("Status:", record.status);
    console.log("Prompt:", record.prompt);
    console.log("\nOpcion correcta:", record.correct_option);
    console.log("\nDistractores:", record.distractor_options);
    console.log("\nFuentes usadas:", record.source_notes);
    console.log("--------------------------\n");

  } catch (err) {
    console.error("[Preview] Fallo en la ejecucion:", err);
  }
}

main().catch(console.error);
