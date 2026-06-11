import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { GENERAL_PREDICTIONS_GRID } from "@/components/tournament-predictions/general-predictions-grid";
import {
  formatChampionDisplayCompact,
  formatFinalistsDisplay,
  formatPlayerDisplay,
} from "@/lib/tournament-predictions/display";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

function CellValue({ value }: { value: string | null }) {
  return (
    <span className="block w-full truncate text-center text-[10px] text-[var(--tm-fg)]">
      {value ?? "—"}
    </span>
  );
}

export function GeneralPredictionsRow({
  row,
  isCurrentUser,
}: {
  row: TournamentGeneralPredictionsBoardRow;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 text-left last:border-0"
      )}
    >
      <RankingMemberCells
        avatarUrl={row.avatarUrl}
        label={row.label}
        size="ranking"
        nameClassName={cn(
          "text-xs font-medium",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      />
      <CellValue value={formatChampionDisplayCompact(row.championTeam)} />
      <CellValue
        value={formatFinalistsDisplay(row.finalistTeamA, row.finalistTeamB)}
      />
      <CellValue
        value={formatPlayerDisplay(row.topScorerPlayerName, row.topScorerTeamName)}
      />
      <CellValue
        value={formatPlayerDisplay(
          row.tournamentMvpPlayerName,
          row.tournamentMvpTeamName
        )}
      />
      <CellValue
        value={formatPlayerDisplay(
          row.goldenGlovePlayerName,
          row.goldenGloveTeamName
        )}
      />
    </div>
  );
}
