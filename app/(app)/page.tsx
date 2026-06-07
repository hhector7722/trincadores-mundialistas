import { HomeHero } from "@/components/home/HomeHero";
import { HomeNextMatch } from "@/components/home/HomeNextMatch";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeTopThree } from "@/components/home/HomeTopThree";
import { homeQuizSlideFromHub } from "@/lib/quiz/home-teaser";
import { getQuizDayHub } from "@/lib/quiz/queries";
import { countPendingPredictions, getMatchPredictionDetail } from "@/lib/predictions/queries";
import { getPoolMatches } from "@/lib/pool/queries";
import { getPoolLeaderboard, memberStandingFromLeaderboard } from "@/lib/ranking/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, pending, leaderboard, quizHub] = await Promise.all([
    getPoolMatches(ctx.activePoolId),
    countPendingPredictions(ctx.activePoolId, user!.id),
    getPoolLeaderboard(ctx.activePoolId),
    getQuizDayHub(ctx.activePoolId, user!.id),
  ]);

  const quizSlide = homeQuizSlideFromHub(quizHub);

  const live = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const focus = live[0] ?? scheduled[0] ?? null;

  const focusMatch = focus
    ? await getMatchPredictionDetail(ctx.activePoolId, user!.id, focus.id)
    : null;

  const standing = memberStandingFromLeaderboard(leaderboard.rows, user!.id);

  return (
    <div className="relative z-10 space-y-3 p-4 pb-4">
      <HomeHero pendingCount={pending} quizSlide={quizSlide} />
      <HomeStandingCard standing={standing} />
      {focusMatch && <HomeNextMatch poolId={ctx.activePoolId} match={focusMatch} />}
      <HomeTopThree rows={leaderboard.rows} />
    </div>
  );
}
