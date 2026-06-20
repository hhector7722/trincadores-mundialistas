import { QuizHub } from "@/components/quiz/QuizHub";
import { getQuizDayHub, getQuizLeaderboard } from "@/lib/quiz/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function QuizPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [hub, leaderboardRows] = await Promise.all([
    getQuizDayHub(ctx.activePoolId, user!.id),
    getQuizLeaderboard(ctx.activePoolId),
  ]);

  return (
    <div className="tm-ranking-page">
      <QuizHub
        hub={hub}
        leaderboardRows={leaderboardRows}
        currentProfileId={user!.id}
      />
    </div>
  );
}
