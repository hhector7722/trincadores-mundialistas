import { HomeDailyFactCard } from "@/components/home/HomeDailyFactCard";
import { HomeDailyQuizCard } from "@/components/home/HomeDailyQuizCard";
import { HomeGeneralPredictionsCard } from "@/components/home/HomeGeneralPredictionsCard";
import { HomeMiniRankingTable } from "@/components/home/HomeMiniRankingTable";
import { HomeNextMatch } from "@/components/home/HomeNextMatch";
import { HomeScoringRulesCard } from "@/components/home/HomeScoringRulesCard";
import type { DailyFact } from "@/lib/home/daily-fact";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import type { QuizDayHub } from "@/lib/quiz/types";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";

type HomeStandingCardProps = {
  leaderboardRows: LeaderboardRow[];
  currentProfileId: string;
  poolId: string;
  generalPredictions: TournamentGeneralPredictions;
  generalPredictionsEditable: boolean;
  dailyFact: DailyFact | null;
  quizHub: QuizDayHub;
  lastMatch: MatchWithPrediction | null;
  liveMatch: MatchWithPrediction | null;
  nextMatch: MatchWithPrediction | null;
  upcomingMatch: MatchWithPrediction | null;
};

export function HomeStandingCard({
  leaderboardRows,
  currentProfileId,
  poolId,
  generalPredictions,
  generalPredictionsEditable,
  dailyFact,
  quizHub,
  lastMatch,
  liveMatch,
  nextMatch,
  upcomingMatch,
}: HomeStandingCardProps) {
  return (
    <div className="flex min-h-0 flex-col gap-3 pb-2">
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <HomeMiniRankingTable rows={leaderboardRows} currentProfileId={currentProfileId} />
        <HomeGeneralPredictionsCard
          poolId={poolId}
          predictions={generalPredictions}
          editable={generalPredictionsEditable}
        />
      </div>
      {lastMatch || liveMatch || nextMatch ? (
        <div className="shrink-0">
          <HomeNextMatch
            poolId={poolId}
            currentProfileId={currentProfileId}
            lastMatch={lastMatch}
            liveMatch={liveMatch}
            nextMatch={nextMatch}
            upcomingMatch={upcomingMatch}
          />
        </div>
      ) : null}
      <div className="tm-home-secondary-row grid shrink-0 grid-cols-2 items-stretch gap-3">
        <div className="flex h-full min-h-0 min-w-0 flex-col gap-1">
          <HomeScoringRulesCard className="min-h-0 flex-1" />
          <HomeDailyQuizCard quizHub={quizHub} className="shrink-0" />
        </div>
        <HomeDailyFactCard fact={dailyFact} />
      </div>
      <div className="scroll-end-touch" aria-hidden />
    </div>
  );
}
