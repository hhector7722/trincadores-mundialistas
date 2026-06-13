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
import type {
  TournamentGeneralPredictions,
  TournamentGeneralPredictionsBoardRow,
} from "@/lib/tournament-predictions/types";

type HomeStandingCardProps = {
  leaderboardRows: LeaderboardRow[];
  currentProfileId: string;
  poolId: string;
  generalPredictions: TournamentGeneralPredictions;
  generalPredictionsEditable: boolean;
  generalPredictionsBoard: TournamentGeneralPredictionsBoardRow[];
  dailyFact: DailyFact | null;
  quizHub: QuizDayHub;
  matchCarouselMatches: MatchWithPrediction[];
};

export function HomeStandingCard({
  leaderboardRows,
  currentProfileId,
  poolId,
  generalPredictions,
  generalPredictionsEditable,
  generalPredictionsBoard,
  dailyFact,
  quizHub,
  matchCarouselMatches,
}: HomeStandingCardProps) {
  return (
    <div className="flex min-h-0 flex-col gap-3 pb-2">
      <div className="grid shrink-0 grid-cols-2 gap-3">
        <HomeMiniRankingTable rows={leaderboardRows} currentProfileId={currentProfileId} />
        <HomeGeneralPredictionsCard
          poolId={poolId}
          currentProfileId={currentProfileId}
          predictions={generalPredictions}
          editable={generalPredictionsEditable}
          boardRows={generalPredictionsBoard}
        />
      </div>
      {matchCarouselMatches.length > 0 ? (
        <div className="shrink-0">
          <HomeNextMatch
            poolId={poolId}
            currentProfileId={currentProfileId}
            matches={matchCarouselMatches}
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
    </div>
  );
}
