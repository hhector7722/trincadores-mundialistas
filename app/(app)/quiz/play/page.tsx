import { redirect } from "next/navigation";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizPlaySession } from "@/components/quiz/QuizPlaySession";
import { getLatestSubmittedAttemptId, getQuizDayHub } from "@/lib/quiz/queries";
import { isQuizPlayResume } from "@/lib/quiz/play-routes";
import { canOpenQuizPlay, getQuizSlotStatus } from "@/lib/quiz/slot-status";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizPlayPageProps = {
  searchParams: Promise<{ resume?: string }>;
};

export default async function QuizPlayPage({ searchParams }: QuizPlayPageProps) {
  const params = await searchParams;
  const resume = isQuizPlayResume(params);
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hub = await getQuizDayHub(ctx.activePoolId, user!.id);
  const slot = hub.official;

  if (!slot) {
    redirect("/quiz");
  }

  const status = getQuizSlotStatus(slot);
  const isCompetitive = slot.quiz.scoring_mode === "competitive";

  if (status === "completed" && isCompetitive && !hub.isOwner) {
    const attemptId = getLatestSubmittedAttemptId(slot);
    redirect(attemptId ? `/quiz/result?attempt=${attemptId}` : "/quiz");
  }

  if (!canOpenQuizPlay(slot, undefined, { isOwner: hub.isOwner })) {
    redirect("/quiz");
  }

  return (
    <QuizPageShell variant="play">
      <QuizPlaySession
        poolId={ctx.activePoolId}
        quizId={slot.quiz.id}
        skipIntro={resume}
      />
    </QuizPageShell>
  );
}
