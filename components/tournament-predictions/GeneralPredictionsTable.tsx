"use client";

import { useState } from "react";
import { GeneralPredictionsRow } from "@/components/tournament-predictions/GeneralPredictionsRow";
import { GENERAL_PREDICTIONS_GRID } from "@/components/tournament-predictions/general-predictions-grid";
import { useGeneralPredictionsFontSizes } from "@/components/tournament-predictions/use-general-predictions-font-sizes";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function GeneralPredictionsTableHeader({
  onTrincadorCol,
  onPlayerCol,
}: {
  onTrincadorCol: (node: HTMLSpanElement | null) => void;
  onPlayerCol: (node: HTMLSpanElement | null) => void;
}) {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span ref={onTrincadorCol} className="min-w-0 text-left">
        Trincador
      </span>
      <span className="text-center">Cam</span>
      <span className="text-center">Fin</span>
      <span ref={onPlayerCol} className="min-w-0 text-center">
        Gol
      </span>
      <span className="text-center">Mvp</span>
      <span className="text-center">Por</span>
    </div>
  );
}

function GeneralPredictionsEmptyRow({
  nameFontSize,
  playerFontSize,
}: {
  nameFontSize: number;
  playerFontSize: number;
}) {
  return (
    <div
      className={cn(
        GENERAL_PREDICTIONS_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-2 last:border-0"
      )}
      aria-hidden="true"
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span
          className="min-w-0 flex-1 whitespace-nowrap font-medium"
          style={{ fontSize: `${nameFontSize}px` }}
        >
          &nbsp;
        </span>
      </div>
      <span />
      <span />
      <span style={{ fontSize: `${playerFontSize}px` }} />
      <span />
      <span />
    </div>
  );
}

export function GeneralPredictionsTable({
  rows,
  currentProfileId,
}: {
  rows: TournamentGeneralPredictionsBoardRow[];
  currentProfileId: string;
}) {
  const [trincadorCol, setTrincadorCol] = useState<HTMLSpanElement | null>(null);
  const [playerCol, setPlayerCol] = useState<HTMLSpanElement | null>(null);
  const { nameFontSize, playerFontSize } = useGeneralPredictionsFontSizes(rows, {
    name: trincadorCol,
    player: playerCol,
  });

  return (
    <div className="tm-general-predictions-table tm-ranking-table">
      <GeneralPredictionsTableHeader
        onTrincadorCol={setTrincadorCol}
        onPlayerCol={setPlayerCol}
      />
      <div className="tm-ranking-body">
        {rows.length === 0
          ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
              <GeneralPredictionsEmptyRow
                key={`empty-${index}`}
                nameFontSize={nameFontSize}
                playerFontSize={playerFontSize}
              />
            ))
          : rows.map((row) => (
              <GeneralPredictionsRow
                key={row.profileId}
                row={row}
                isCurrentUser={row.profileId === currentProfileId}
                nameFontSize={nameFontSize}
                playerFontSize={playerFontSize}
              />
            ))}
      </div>
    </div>
  );
}
