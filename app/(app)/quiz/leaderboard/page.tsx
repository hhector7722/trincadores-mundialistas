import Link from "next/link";
import { QuizLeaderboardTable } from "@/components/quiz/QuizLeaderboardTable";
import { Card } from "@/components/ui/card";
import { getQuizLeaderboard } from "@/lib/quiz/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuizLeaderboardPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rows = await getQuizLeaderboard(ctx.activePoolId);

  return (
    <div className="flex h-[calc(100dvh-var(--tm-tabbar-height)-3.25rem)] flex-col gap-2 p-3 pb-2">
      <div className="shrink-0">
        <h1 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
          Ranking del quiz
        </h1>
        <Link href="/quiz" className="text-xs text-[var(--tm-muted)]">
          Volver al quiz
        </Link>
      </div>
      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden p-0">
        <QuizLeaderboardTable rows={rows} currentProfileId={user!.id} />
      </Card>
      <p className="shrink-0 text-center text-[10px] text-[var(--tm-muted)]">
        Solo cuenta el quiz oficial en modo competitivo.
      </p>
    </div>
  );
}
