import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { QuizPageShell } from "@/components/quiz/QuizPageShell";
import { QuizResultSummary } from "@/components/quiz/QuizResultSummary";
import { getQuizDayHub, getQuizResult } from "@/lib/quiz/queries";
import { canReplayQuiz } from "@/lib/quiz/slot-status";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type QuizResultPageProps = {
  searchParams: Promise<{ attempt?: string }>;
};

export default async function QuizResultPage({ searchParams }: QuizResultPageProps) {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const params = await searchParams;
  const attemptId = params.attempt?.trim();
  if (!attemptId) {
    redirect("/quiz");
  }

  const [result, hub] = await Promise.all([
    getQuizResult(attemptId, user!.id),
    getQuizDayHub(ctx.activePoolId, user!.id),
  ]);

  if (!result) {
    notFound();
  }

  const canReplay = canReplayQuiz(hub.official, { isOwner: hub.isOwner });

  return (
    <QuizPageShell>
      <div>
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Resultado del quiz
        </h1>
        <Link href="/quiz" className="mt-1 inline-block text-sm text-[var(--tm-muted)]">
          Quiz del dia
        </Link>
      </div>
      <QuizResultSummary
        score={result.score}
        maxPoints={result.maxPoints}
        scoringMode={result.scoringMode}
        kind={result.kind}
        canReplay={canReplay}
      />
    </QuizPageShell>
  );
}
