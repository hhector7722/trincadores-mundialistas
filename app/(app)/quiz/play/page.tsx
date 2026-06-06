import { redirect } from "next/navigation";
import { QuizPlaySession } from "@/components/quiz/QuizPlaySession";
import { getLatestSubmittedAttemptId, getQuizDayHub } from "@/lib/quiz/queries";
import { canOpenQuizPlay, getQuizSlotStatus } from "@/lib/quiz/slot-status";
import type { QuizKind } from "@/lib/quiz/types";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizPlayPageProps = {
  searchParams: Promise<{ kind?: string }>;
};

export default async function QuizPlayPage({ searchParams }: QuizPlayPageProps) {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const kind: QuizKind = params.kind === "bonus" ? "bonus" : "official";

  const hub = await getQuizDayHub(ctx.activePoolId, user!.id);
  const slot = kind === "bonus" ? hub.bonus : hub.official;

  if (!slot) {
    redirect("/quiz");
  }

  const status = getQuizSlotStatus(slot);
  if (status === "completed") {
    const attemptId = getLatestSubmittedAttemptId(slot);
    redirect(attemptId ? `/quiz/result?attempt=${attemptId}` : "/quiz");
  }

  if (!canOpenQuizPlay(slot)) {
    redirect("/quiz");
  }

  return (
    <div className="space-y-4 p-4 pb-8">
      <QuizPlaySession
        poolId={ctx.activePoolId}
        quizId={slot.quiz.id}
        kind={kind}
      />
    </div>
  );
}
