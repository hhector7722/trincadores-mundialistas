import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizPlaySession } from "@/components/quiz/QuizPlaySession";
import { addQuizDays, todayQuizDate } from "@/lib/quiz/date";
import { createClient } from "@/lib/supabase/server";
import { requireActivePoolContext } from "@/lib/pool/require-context";

export const dynamic = "force-dynamic";

export default async function HectorYesterdayQuizPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Get user profile to check if it's hector
  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();

  // Only allow hector
  if (!profile || profile.username?.toLowerCase() !== "hector") {
    return (
      <QuizPageShell variant="play">
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <p className="text-center text-[var(--tm-muted)]">Acceso no autorizado</p>
        </div>
      </QuizPageShell>
    );
  }

  // Get yesterday's quiz dynamically
  const yesterdayDate = addQuizDays(todayQuizDate(), -1);
  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id")
    .eq("quiz_date", yesterdayDate)
    .eq("pool_id", ctx.activePoolId)
    .maybeSingle();

  if (!quiz) {
    return (
      <QuizPageShell variant="play">
        <div className="flex min-h-0 flex-1 items-center justify-center p-4">
          <p className="text-center text-[var(--tm-muted)]">Quiz no encontrado</p>
        </div>
      </QuizPageShell>
    );
  }

  return (
    <QuizPageShell variant="play">
      <QuizPlaySession
        poolId={ctx.activePoolId}
        quizId={quiz.id}
        skipIntro={false}
        drill={false}
      />
    </QuizPageShell>
  );
}
