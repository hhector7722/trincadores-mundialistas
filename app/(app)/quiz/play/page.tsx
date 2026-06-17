import { redirect } from "next/navigation";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizPlaySession } from "@/components/quiz/QuizPlaySession";
import { getLatestSubmittedAttemptId, getQuizDayHub } from "@/lib/quiz/queries";
import {
  isQuizPlayDrill,
  isQuizPlayResume,
  isQuizPlayStartAuthorized,
} from "@/lib/quiz/play-routes";
import { canOpenQuizDrill, canOpenQuizPlay } from "@/lib/quiz/slot-status";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizPlayPageProps = {
  searchParams: Promise<{ resume?: string; start?: string; drill?: string }>;
};

export default async function QuizPlayPage({ searchParams }: QuizPlayPageProps) {
  const params = await searchParams;
  const resume = isQuizPlayResume(params);
  const drill = isQuizPlayDrill(params);

  if (!isQuizPlayStartAuthorized(params)) {
    redirect("/quiz");
  }
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const hub = await getQuizDayHub(ctx.activePoolId, user!.id);
  const slot = hub.official;

  if (hub.publishHeld || !slot) {
    redirect("/quiz");
  }

  if (drill) {
    if (!hub.drillAvailable || !canOpenQuizDrill(slot)) {
      const attemptId = getLatestSubmittedAttemptId(slot);
      redirect(attemptId ? `/quiz/result?attempt=${attemptId}` : "/quiz");
    }
  } else if (!canOpenQuizPlay(slot)) {
    const attemptId = getLatestSubmittedAttemptId(slot);
    redirect(attemptId ? `/quiz/result?attempt=${attemptId}` : "/quiz");
  }

  return (
    <QuizPageShell variant="play">
      <QuizPlaySession
        poolId={ctx.activePoolId}
        quizId={slot.quiz.id}
        skipIntro={resume}
        drill={drill}
      />
    </QuizPageShell>
  );
}
