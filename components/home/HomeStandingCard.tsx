import { Medal } from "lucide-react";
import { HomeDailyQuizCard } from "@/components/home/HomeDailyQuizCard";
import { HomeGeneralPredictionsCard } from "@/components/home/HomeGeneralPredictionsCard";
import { HomeMiniRankingTable } from "@/components/home/HomeMiniRankingTable";
import { HomeNextMatch } from "@/components/home/HomeNextMatch";
import { HomeScoringRulesCard } from "@/components/home/HomeScoringRulesCard";
import { formatAggregateStat } from "@/lib/ranking/format";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import type { QuizDayHub } from "@/lib/quiz/types";
import type { LeaderboardRow, MemberStanding } from "@/lib/ranking/queries";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";

function PositionStatCard({ standing }: { standing: MemberStanding }) {
  return (
    <div className="@container min-w-0 rounded-2xl p-[clamp(0.75rem,4cqw,1rem)] tm-stat-card">
      <div className="mb-3 flex h-[clamp(2rem,10cqw,2.5rem)] w-[clamp(2rem,10cqw,2.5rem)] shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        <Medal className="h-[clamp(1rem,5cqw,1.25rem)] w-[clamp(1rem,5cqw,1.25rem)] text-purple-200" strokeWidth={2} />
      </div>
      <p className="truncate text-[clamp(8px,2.2cqw,10px)] font-semibold uppercase tracking-[0.12em] text-white/50">
        Posicion
      </p>
      <p className="mt-1.5 font-display text-[clamp(1.5rem,14cqw,2.25rem)] leading-none text-white">
        {formatAggregateStat(standing.position)}
        <span className="ml-0.5 text-[clamp(0.875rem,7cqw,1.25rem)] font-semibold text-[#CCFF00]/80">
          º
        </span>
      </p>
      <p className="mt-1 truncate text-[clamp(10px,2.8cqw,12px)] text-white/40">
        de {standing.totalMembers} en la porra
      </p>
    </div>
  );
}

type HomeStandingCardProps = {
  standing: MemberStanding | null;
  leaderboardRows: LeaderboardRow[];
  currentProfileId: string;
  poolId: string;
  generalPredictions: TournamentGeneralPredictions;
  generalPredictionsEditable: boolean;
  quizHub: QuizDayHub;
  nextMatch: MatchWithPrediction | null;
};

export function HomeStandingCard({
  standing,
  leaderboardRows,
  currentProfileId,
  poolId,
  generalPredictions,
  generalPredictionsEditable,
  quizHub,
  nextMatch,
}: HomeStandingCardProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        {standing ? (
          <PositionStatCard standing={standing} />
        ) : (
          <HomeMiniRankingTable rows={leaderboardRows} currentProfileId={currentProfileId} />
        )}
        <HomeGeneralPredictionsCard
          poolId={poolId}
          predictions={generalPredictions}
          editable={generalPredictionsEditable}
        />
      </div>
      {nextMatch ? <HomeNextMatch poolId={poolId} match={nextMatch} /> : null}
      <div className="grid grid-cols-2 gap-3">
        <HomeScoringRulesCard />
        <HomeDailyQuizCard quizHub={quizHub} />
      </div>
    </div>
  );
}
