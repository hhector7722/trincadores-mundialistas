"use client";

import { useMemo, type ReactNode } from "react";
import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import { useQuizBonusActive } from "@/components/ranking/quiz-bonus-store";
import { PredictionOutcomeIcon } from "@/components/predictions/PredictionOutcomeIcon";
import { MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS } from "@/lib/predictions/scoring";
import { QuizBonusToggle } from "@/components/ranking/QuizBonusToggle";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function sortRows(rows: LeaderboardRow[], useQuiz: boolean): LeaderboardRow[] {
  return [...rows].sort((a, b) => {
    const ptsA = useQuiz ? a.cumulativePoints : a.cumulativePoints - a.quizFinalBonus;
    const ptsB = useQuiz ? b.cumulativePoints : b.cumulativePoints - b.quizFinalBonus;
    if (ptsA !== ptsB) return ptsB - ptsA;
    if (a.exactHits !== b.exactHits) return b.exactHits - a.exactHits;
    if (a.signHits !== b.signHits) return b.signHits - a.signHits;
    if (a.clasifHits !== b.clasifHits) return b.clasifHits - a.clasifHits;
    if (a.mvpHits !== b.mvpHits) return b.mvpHits - a.mvpHits;
    if (a.globalHits !== b.globalHits) return b.globalHits - a.globalHits;
    return a.label.toLowerCase().localeCompare(b.label.toLowerCase(), "es");
  });
}

function LegendItem({
  icons,
  label,
  pts,
}: {
  icons: ReactNode;
  label: string;
  pts: string;
}) {
  return (
    <span className="inline-flex shrink-0 items-center gap-[3px] whitespace-nowrap">
      <span className="inline-flex shrink-0 items-center gap-[1px]" aria-hidden>
        {icons}
      </span>
      <span>{label}</span>
      <span className="font-semibold text-[var(--tm-fg)]">{pts}</span>
    </span>
  );
}

function RankingLegend() {
  return (
    <div className="flex shrink-0 items-center justify-center overflow-x-auto border-b border-[var(--tm-border)] px-3 py-1.5 text-[9px] leading-none text-[var(--tm-muted)] [scrollbar-width:none]">
      <ul className="inline-flex min-w-max items-center gap-x-3">
        <LegendItem
          icons={<PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />}
          label="Signo 1×2"
          pts={`${MATCH_SCORE_POINTS.sign} pts`}
        />
        <span className="text-[var(--tm-border)]" aria-hidden>·</span>
        <LegendItem
          icons={
            <>
              <PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />
              <PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />
            </>
          }
          label="Clasificado (elim.)"
          pts={`${MATCH_SCORE_POINTS.sign} pts`}
        />
        <span className="text-[var(--tm-border)]" aria-hidden>·</span>
        <LegendItem
          icons={
            <>
              <PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />
              <PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />
              <PredictionOutcomeIcon variant="success" className="size-[9px] !min-h-0 !min-w-0" />
            </>
          }
          label="Marcador exacto"
          pts={`${MATCH_SCORE_POINTS.exact} pts`}
        />
        <span className="text-[var(--tm-border)]" aria-hidden>·</span>
        <LegendItem
          icons={<PredictionOutcomeIcon variant="mvp" className="size-[9px] !min-h-0 !min-w-0" />}
          label="MVP"
          pts={`${MVP_PREDICTION_POINTS} pt`}
        />
      </ul>
    </div>
  );
}

function RankingTableHeader() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span className="text-left">#</span>
      <span className="text-left">Nombre</span>
      <span className="text-center" title="Puntos totales">Total</span>
      <div className="flex items-center justify-center" title={`Signo acertado en fase de grupos (${MATCH_SCORE_POINTS.sign} pts)`}>
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
      </div>
      <div className="flex items-center justify-center" title={`Clasificado correcto en eliminatorias (${MATCH_SCORE_POINTS.sign} pts)`}>
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
      </div>
      <div className="flex items-center justify-center" title={`Marcador exacto (${MATCH_SCORE_POINTS.exact} pts)`}>
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
        <PredictionOutcomeIcon variant="success" className="text-[8px] !min-h-0 !min-w-0" />
      </div>
      <div className="flex items-center justify-center" title={`MVP acertado (${MVP_PREDICTION_POINTS} pt)`}>
        <PredictionOutcomeIcon variant="mvp" className="text-[8px] !min-h-0 !min-w-0" />
      </div>
      <div className="flex items-center justify-center">
        <QuizBonusToggle />
      </div>
    </div>
  );
}

function RankingEmptyRow() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-2 last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span className="min-w-0 flex-1 truncate">&nbsp;</span>
      </div>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function RankingTable({
  rows,
  currentProfileId,
}: {
  rows: LeaderboardRow[];
  currentProfileId: string;
}) {
  const quizBonusActive = useQuizBonusActive();
  const sortedRows = useMemo(
    () => sortRows(rows, quizBonusActive),
    [rows, quizBonusActive]
  );

  return (
    <div className="tm-ranking-table">
      <RankingTableHeader />
      <RankingLegend />
      <div className="tm-ranking-body">
        {sortedRows.length === 0
          ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
              <RankingEmptyRow key={`empty-${index}`} />
            ))
          : sortedRows.map((row, index) => (
              <RankingRow
                key={row.profileId}
                row={row}
                position={index + 1}
                isCurrentUser={row.profileId === currentProfileId}
              />
            ))}
      </div>
    </div>
  );
}
