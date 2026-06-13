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
    <div className="tm-home-body-inner flex min-h-0 flex-col gap-[var(--tm-home-row-gap)]">
      <div className="tm-home-row tm-home-row--stats grid min-h-0 grid-cols-2 gap-[var(--tm-home-row-gap)]">
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
        <div className="tm-home-row tm-home-row--match min-h-0">
          <HomeNextMatch
            poolId={poolId}
            currentProfileId={currentProfileId}
            matches={matchCarouselMatches}
          />
        </div>
      ) : null}
      <div className="tm-home-row tm-home-secondary-row grid min-h-0 grid-cols-2 items-stretch gap-[var(--tm-home-row-gap)]">
        <div className="flex h-full min-h-0 flex-col gap-1">
          <HomeScoringRulesCard className="min-h-0 flex-1" />
          <HomeDailyQuizCard quizHub={quizHub} className="min-h-0 flex-1" />
        </div>
        <HomeDailyFactCard fact={dailyFact} />
      </div>
    </div>
  );
}
