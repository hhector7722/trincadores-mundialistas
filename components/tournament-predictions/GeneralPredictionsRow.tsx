import { RankingMemberCells } from "@/components/ranking/RankingMemberCells";
import { GENERAL_PREDICTIONS_GRID } from "@/components/tournament-predictions/general-predictions-grid";
import {
  formatChampionDisplayCompact,
  formatFinalistsDisplay,
  formatPlayerDisplayFull,
} from "@/lib/tournament-predictions/display";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

function CellValue({ value, compact = false }: { value: string | null; compact?: boolean }) {
  return (
    <span className="flex h-full min-w-0 items-center justify-center px-0.5 text-center text-[10px] leading-snug text-[var(--tm-fg)]">
      <span className={compact ? "whitespace-nowrap" : "break-words"}>{value ?? "—"}</span>
    </span>
  );
}

export function GeneralPredictionsRow({
  row,
  isCurrentUser,
  nameFontSize,
}: {
  row: TournamentGeneralPredictionsBoardRow;
  isCurrentUser: boolean;
  nameFontSize: number;
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
      <CellValue compact value={formatChampionDisplayCompact(row.championTeam)} />
      <CellValue
        compact
        value={formatFinalistsDisplay(row.finalistTeamA, row.finalistTeamB)}
      />
      <CellValue value={formatPlayerDisplayFull(row.topScorerPlayerName)} />
      <CellValue value={formatPlayerDisplayFull(row.tournamentMvpPlayerName)} />
      <CellValue value={formatPlayerDisplayFull(row.goldenGlovePlayerName)} />
    </div>
  );
}
