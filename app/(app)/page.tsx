import { HomeHero } from "@/components/home/HomeHero";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeViewportShell } from "@/components/home/HomeViewportShell";
import { getMatchHighlightsForPool } from "@/lib/highlights/queries";
import { getDailyFactForToday } from "@/lib/home/daily-fact";
import { getQuizDayHub } from "@/lib/quiz/queries";
import {
  getPoolMatchesWithPredictions,
} from "@/lib/predictions/queries";
import { getPoolLeaderboard } from "@/lib/ranking/queries";
import {
  getPoolTournamentGeneralPredictionsBoard,
  getTournamentGeneralPredictions,
} from "@/lib/tournament-predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    matchCarouselMatches,
    leaderboard,
    quizHub,
    generalPredictionsBundle,
    generalPredictionsBoard,
    matchHighlights,
  ] = await Promise.all([
    getPoolMatchesWithPredictions(ctx.activePoolId, user!.id),
    getPoolLeaderboard(ctx.activePoolId),
    getQuizDayHub(ctx.activePoolId, user!.id),
    getTournamentGeneralPredictions(ctx.activePoolId, user!.id),
    getPoolTournamentGeneralPredictionsBoard(ctx.activePoolId),
    getMatchHighlightsForPool(ctx.activePoolId),
  ]);

  const dailyFact = getDailyFactForToday();

  return (
    <HomeViewportShell
      hero={
        <HomeHero matchHighlights={matchHighlights} />
      }
      body={
        <HomeStandingCard
          leaderboardRows={leaderboard.rows}
          currentProfileId={user!.id}
          poolId={ctx.activePoolId}
          generalPredictions={generalPredictionsBundle.predictions}
          generalPredictionsEditable={generalPredictionsBundle.editable}
          generalPredictionsBoard={generalPredictionsBoard}
          dailyFact={dailyFact}
          quizHub={quizHub}
          matchCarouselMatches={matchCarouselMatches}
        />
      }
    />
  );
}
