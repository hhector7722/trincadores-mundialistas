import { HomeHero } from "@/components/home/HomeHero";
import { HomeStandingCard } from "@/components/home/HomeStandingCard";
import { HomeViewportShell } from "@/components/home/HomeViewportShell";
import { getLatestMatchHighlightForPool } from "@/lib/highlights/queries";
import { getDailyFactForToday } from "@/lib/home/daily-fact";
import { homeQuizSlideFromHub } from "@/lib/quiz/home-teaser";
import { getQuizDayHub } from "@/lib/quiz/queries";
import { countPendingPredictions, getMatchPredictionDetail } from "@/lib/predictions/queries";
import { getPoolMatches } from "@/lib/pool/queries";
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
    matches,
    pending,
    leaderboard,
    quizHub,
    generalPredictionsBundle,
    generalPredictionsBoard,
    lastMatchHighlight,
  ] = await Promise.all([
    getPoolMatches(ctx.activePoolId),
    countPendingPredictions(ctx.activePoolId, user!.id),
    getPoolLeaderboard(ctx.activePoolId),
    getQuizDayHub(ctx.activePoolId, user!.id),
    getTournamentGeneralPredictions(ctx.activePoolId, user!.id),
    getPoolTournamentGeneralPredictionsBoard(ctx.activePoolId),
    getLatestMatchHighlightForPool(ctx.activePoolId),
  ]);

  const quizSlide = homeQuizSlideFromHub(quizHub);

  const finished = matches.filter((m) => m.status === "finished");
  const live = matches.filter((m) => m.status === "live");
  const scheduled = matches.filter((m) => m.status === "scheduled");
  const lastFinished = finished.at(-1) ?? null;
  const liveFocus = live[0] ?? null;
  const nextScheduled = scheduled[0] ?? null;
  const upcomingScheduled = scheduled[1] ?? null;

  const [lastMatch, liveMatch, nextMatch, upcomingMatch] = await Promise.all([
    lastFinished
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, lastFinished.id)
      : Promise.resolve(null),
    liveFocus
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, liveFocus.id)
      : Promise.resolve(null),
    nextScheduled
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, nextScheduled.id)
      : Promise.resolve(null),
    upcomingScheduled
      ? getMatchPredictionDetail(ctx.activePoolId, user!.id, upcomingScheduled.id)
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
          generalPredictionsBoard={generalPredictionsBoard}
          dailyFact={dailyFact}
          quizHub={quizHub}
          lastMatch={lastMatch}
          liveMatch={liveMatch}
          nextMatch={nextMatch}
          upcomingMatch={upcomingMatch}
        />
      }
    />
  );
}
