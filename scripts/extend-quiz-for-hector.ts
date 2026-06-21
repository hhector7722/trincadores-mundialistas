import { createAdminClient } from "../lib/scripts/supabase-admin";

async function main() {
  const admin = await createAdminClient();

  // Extender el cierre del quiz de ayer (2026-06-21) para que hector pueda jugarlo
  const newClosesAt = new Date();
  newClosesAt.setDate(newClosesAt.getDate() + 1); // Mañana a esta hora

  const { data: quiz, error: quizError } = await admin
    .from("quizzes")
    .update({ closes_at: newClosesAt.toISOString() })
    .eq("quiz_date", "2026-06-21")
    .select()
    .single();

  if (quizError) throw quizError;

  console.log("✅ Quiz de ayer (2026-06-21) extendido:");
  console.log(`  ID: ${quiz.id}`);
  console.log(`  Nuevo cierre: ${quiz.closes_at}`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
