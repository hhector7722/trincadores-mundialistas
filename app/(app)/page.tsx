import { HomeHero } from "@/components/home/HomeHero";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeViewportShell } from "@/components/home/HomeViewportShell";
import { getLatestMatchHighlightForPool } from "@/lib/highlights/queries";
import { getDailyFactForToday } from "@/lib/home/daily-fact";
import { homeQuizSlideFromHub } from "@/lib/quiz/home-teaser";
import { getQuizDayHub } from "@/lib/quiz/queries";
import {
  countPendingPredictions,
  getMatchPredictionDetail,
  getMatchPredictionsBoard,
} from "@/lib/predictions/queries";
import { getPoolMatches } from "@/lib/pool/queries";
import { getPoolLeaderboard } from "@/lib/ranking/queries";
import { getTournamentGeneralPredictions } from "@/lib/tournament-predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [matches, pending, leaderboard, quizHub, generalPredictionsBundle, lastMatchHighlight] =
    await Promise.all([
      getPoolMatches(ctx.activePoolId),
      countPendingPredictions(ctx.activePoolId, user!.id),
      getPoolLeaderboard(ctx.activePoolId),
      getQuizDayHub(ctx.activePoolId, user!.id),
      getTournamentGeneralPredictions(ctx.activePoolId, user!.id),
      getLatestMatchHighlightForPool(ctx.activePoolId),
    ]);

  const quizSlide = homeQuizSlideFromHub(quizHub);

  const live = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const liveFocus = live[0] ?? null;
  const nextScheduled = scheduled[0] ?? null;

  const [liveMatch, nextMatch, livePredictionsBoard] = await Promise.all([
    liveFocus
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, liveFocus.id)
      : Promise.resolve(null),
    nextScheduled
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, nextScheduled.id)
      : Promise.resolve(null),
    liveFocus
      ? getMatchPredictionsBoard(ctx.activePoolId, liveFocus.id)
      : Promise.resolve(null),
  ]);

  const dailyFact = getDailyFactForToday();

  return (
    <HomeViewportShell
      hero={
        <HomeHero
          pendingCount={pending}
          quizSlide={quizSlide}
          lastMatchHighlight={lastMatchHighlight}
        />
      }
      body={
        <HomeStandingCard
          leaderboardRows={leaderboard.rows}
          currentProfileId={user!.id}
          poolId={ctx.activePoolId}
          generalPredictions={generalPredictionsBundle.predictions}
          generalPredictionsEditable={generalPredictionsBundle.editable}
          dailyFact={dailyFact}
          quizHub={quizHub}
          liveMatch={liveMatch}
          nextMatch={nextMatch}
          livePredictionsBoard={livePredictionsBoard}
        />
      }
    />
  );
}
