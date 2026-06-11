import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import {
  ChampionPredictionCell,
  FinalistsPredictionCell,
  PlayerPredictionCell,
} from "@/components/tournament-predictions/GeneralPredictionsCells";
import { GENERAL_PREDICTIONS_GRID } from "@/components/tournament-predictions/general-predictions-grid";
import { formatPlayerDisplay } from "@/lib/tournament-predictions/display";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

export function GeneralPredictionsRow({
  row,
  isCurrentUser,
  nameFontSize,
  playerFontSize,
}: {
  row: TournamentGeneralPredictionsBoardRow;
  isCurrentUser: boolean;
  nameFontSize: number;
  playerFontSize: number;
}) {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-2 text-left last:border-0"
      )}
    >
      <RankingMemberCells
        avatarUrl={row.avatarUrl}
        label={row.label}
        size="ranking"
        truncateName={false}
        singleLineName
        nameStyle={{ fontSize: `${nameFontSize}px` }}
        nameClassName={cn(
          "font-medium leading-none",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      />
      <ChampionPredictionCell team={row.championTeam} />
      <FinalistsPredictionCell teamA={row.finalistTeamA} teamB={row.finalistTeamB} />
      <PlayerPredictionCell
        fontSize={playerFontSize}
        value={formatPlayerDisplay(row.topScorerPlayerName)}
      />
      <PlayerPredictionCell
        accent
        fontSize={playerFontSize}
        value={formatPlayerDisplay(row.tournamentMvpPlayerName)}
      />
      <PlayerPredictionCell
        fontSize={playerFontSize}
        value={formatPlayerDisplay(row.goldenGlovePlayerName)}
      />
    </div>
  );
}
