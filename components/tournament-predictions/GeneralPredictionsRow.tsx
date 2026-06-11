import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { GENERAL_PREDICTIONS_GRID } from "@/components/tournament-predictions/general-predictions-grid";
import {
  formatChampionDisplay,
  formatFinalistsDisplayFull,
  formatPlayerDisplayFull,
} from "@/lib/tournament-predictions/display";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

function CellValue({ value }: { value: string | null }) {
  return (
    <span className="flex h-full min-w-0 items-center justify-center px-0.5 text-center text-[10px] leading-snug text-[var(--tm-fg)]">
      <span className="break-words">{value ?? "—"}</span>
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
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-2 text-left last:border-0"
      )}
    >
      <RankingMemberCells
        avatarUrl={row.avatarUrl}
        label={row.label}
        size="ranking"
        wrapName
        nameClassName={cn(
          "text-xs font-medium leading-snug",
          isCurrentUser ? "text-[var(--tm-accent)]" : "text-[var(--tm-fg)]"
        )}
      />
      <CellValue value={formatChampionDisplay(row.championTeam)} />
      <CellValue
        value={formatFinalistsDisplayFull(row.finalistTeamA, row.finalistTeamB)}
      />
      <CellValue value={formatPlayerDisplayFull(row.topScorerPlayerName)} />
      <CellValue value={formatPlayerDisplayFull(row.tournamentMvpPlayerName)} />
      <CellValue value={formatPlayerDisplayFull(row.goldenGlovePlayerName)} />
    </div>
  );
}
