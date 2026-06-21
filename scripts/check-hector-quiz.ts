import { createAdminClient } from "../lib/scripts/supabase-admin";

async function main() {
  const admin = await createAdminClient();

  // Get hector's profile
  const { data: profile, error: profileError } = await admin
    .from("profiles")
    .select("id, username, display_name")
    .eq("username", "hector")
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error(profileError?.message ?? "Perfil hector no encontrado.");
  }

  console.log(`\n=== Perfil ===`);
  console.log(`Usuario: ${profile.display_name} (@${profile.username})`);
  console.log(`ID: ${profile.id}`);

  // Get hector's recent quiz attempts
  const { data: attempts, error: attemptsError } = await admin
    .from("quiz_attempts")
    .select(`
      id,
      quiz_id,
      status,
      score,
      started_at,
      submitted_at,
      counts_for_score,
      quiz:quizzes(
        id,
        title,
        quiz_date,
        kind,
        scoring_mode,
        opens_at,
        closes_at
      )
    `)
    .eq("profile_id", profile.id)
    .order("started_at", { ascending: false })
    .limit(5);

  if (attemptsError) throw attemptsError;

  console.log(`\n=== Intentos de quiz recientes ===`);
  if (!attempts || attempts.length === 0) {
    console.log("No hay intentos de quiz.");
  } else {
    for (const attempt of attempts) {
      const quiz = attempt.quiz as any;
      console.log(`\nQuiz: ${quiz?.title} (${quiz?.quiz_date})`);
      console.log(`  ID intento: ${attempt.id}`);
      console.log(`  Estado: ${attempt.status}`);
      console.log(`  Puntuación: ${attempt.score}`);
      console.log(`  Iniciado: ${attempt.started_at}`);
      console.log(`  Enviado: ${attempt.submitted_at ?? "No enviado"}`);
      console.log(`  Cuenta para puntuación: ${attempt.counts_for_score}`);
    }
  }

  // Check if quiz for 2026-06-22 exists
  const { data: quizToday, error: quizTodayError } = await admin
    .from("quizzes")
    .select("*")
    .eq("quiz_date", "2026-06-22")
    .maybeSingle();

  console.log(`\n=== Quiz de hoy (2026-06-22) ===`);
  if (quizTodayError) throw quizTodayError;

  if (!quizToday) {
    console.log("❌ No existe quiz para hoy (2026-06-22)");
  } else {
    console.log("✅ Quiz encontrado:");
    console.log(`  ID: ${quizToday.id}`);
    console.log(`  Título: ${quizToday.title}`);
    console.log(`  Fecha: ${quizToday.quiz_date}`);
    console.log(`  Tipo: ${quizToday.kind}`);
    console.log(`  Modo de puntuación: ${quizToday.scoring_mode}`);
    console.log(`  Abre: ${quizToday.opens_at}`);
    console.log(`  Cierra: ${quizToday.closes_at}`);
    console.log(`  Puntos máximos: ${quizToday.max_points}`);
  }

  // Check if quiz for 2026-06-21 exists
  const { data: quizYesterday, error: quizYesterdayError } = await admin
    .from("quizzes")
    .select("*")
    .eq("quiz_date", "2026-06-21")
    .maybeSingle();

  console.log(`\n=== Quiz de ayer (2026-06-21) ===`);
  if (quizYesterdayError) throw quizYesterdayError;

  if (!quizYesterday) {
    console.log("❌ No existe quiz para ayer (2026-06-21)");
  } else {
    console.log("✅ Quiz encontrado:");
    console.log(`  ID: ${quizYesterday.id}`);
    console.log(`  Título: ${quizYesterday.title}`);
    console.log(`  Fecha: ${quizYesterday.quiz_date}`);
    console.log(`  Tipo: ${quizYesterday.kind}`);
    console.log(`  Modo de puntuación: ${quizYesterday.scoring_mode}`);
    console.log(`  Abre: ${quizYesterday.opens_at}`);
    console.log(`  Cierra: ${quizYesterday.closes_at}`);
    console.log(`  Puntos máximos: ${quizYesterday.max_points}`);
  }

  // Check if hector has already played today's quiz
  if (quizToday) {
    const { data: todayAttempt, error: todayAttemptError } = await admin
      .from("quiz_attempts")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("quiz_id", quizToday.id)
      .maybeSingle();

    console.log(`\n=== Intento de hector en quiz de hoy ===`);
    if (todayAttemptError) throw todayAttemptError;

    if (!todayAttempt) {
      console.log("❌ Hector no ha jugado el quiz de hoy aún");
    } else {
      console.log("✅ Hector ya ha jugado el quiz de hoy:");
      console.log(`  Estado: ${todayAttempt.status}`);
      console.log(`  Puntuación: ${todayAttempt.score}`);
      console.log(`  Cuenta para puntuación: ${todayAttempt.counts_for_score}`);
    }
  }

  // Check if hector has already played yesterday's quiz
  if (quizYesterday) {
    const { data: yesterdayAttempt, error: yesterdayAttemptError } = await admin
      .from("quiz_attempts")
      .select("*")
      .eq("profile_id", profile.id)
      .eq("quiz_id", quizYesterday.id)
      .maybeSingle();

    console.log(`\n=== Intento de hector en quiz de ayer ===`);
    if (yesterdayAttemptError) throw yesterdayAttemptError;

    if (!yesterdayAttempt) {
      console.log("❌ Hector no ha jugado el quiz de ayer aún");
    } else {
      console.log("✅ Hector ya ha jugado el quiz de ayer:");
      console.log(`  Estado: ${yesterdayAttempt.status}`);
      console.log(`  Puntuación: ${yesterdayAttempt.score}`);
      console.log(`  Cuenta para puntuación: ${yesterdayAttempt.counts_for_score}`);
    }
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
