import { redirect } from "next/navigation";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizPlaySession } from "@/components/quiz/QuizPlaySession";
import { canAccessQuizBeta } from "@/lib/quiz/access";
import { getLatestSubmittedAttemptId, getQuizDayHub } from "@/lib/quiz/queries";
import { isQuizPlayResume, isQuizPlayStartAuthorized } from "@/lib/quiz/play-routes";
import { canOpenQuizPlay } from "@/lib/quiz/slot-status";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizPlayPageProps = {
  searchParams: Promise<{ resume?: string; start?: string }>;
};

export default async function QuizPlayPage({ searchParams }: QuizPlayPageProps) {
  const params = await searchParams;
  const resume = isQuizPlayResume(params);

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user!.id)
    .maybeSingle();

  if (!canAccessQuizBeta(profile?.username) || hub.publishHeld) {
    redirect("/quiz");
  }

  if (!slot) {
    redirect("/quiz");
  }

  if (!canOpenQuizPlay(slot)) {
    const attemptId = getLatestSubmittedAttemptId(slot);
    redirect(attemptId ? `/quiz/result?attempt=${attemptId}` : "/quiz");
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
