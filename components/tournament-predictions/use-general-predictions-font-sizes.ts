"use client";

import { useLayoutEffect, useMemo, useState } from "react";
import type { TournamentGeneralPredictionsBoardRow } from "@/lib/tournament-predictions/types";

const FONT_MAX_PX = 12;
const FONT_MIN_PX = 6.5;
const FONT_STEP_PX = 0.25;
const RANKING_AVATAR_PX = 36;
const RANKING_NAME_GAP_PX = 10;

function measureSingleLineFontSize(text: string, availableWidthPx: number): number {
  if (!text || availableWidthPx <= 0) return FONT_MAX_PX;

  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap;font-weight:500;font-family:inherit";
  probe.textContent = text;
  document.body.appendChild(probe);

  let size = FONT_MAX_PX;
  while (size >= FONT_MIN_PX) {
    probe.style.fontSize = `${size}px`;
    if (probe.offsetWidth <= availableWidthPx) break;
    size -= FONT_STEP_PX;
  }

  document.body.removeChild(probe);
  return Math.round(size * 4) / 4;
}

export type GeneralPredictionsFontSizes = {
  nameFontSize: number;
  playerFontSize: number;
};

export function useGeneralPredictionsFontSizes(
  rows: TournamentGeneralPredictionsBoardRow[],
  columns: {
    name: HTMLElement | null;
    player: HTMLElement | null;
  }
): GeneralPredictionsFontSizes {
  const longestName = useMemo(
    () => rows.reduce((max, row) => (row.label.length > max.length ? row.label : max), ""),
    [rows]
  );

  const longestPlayer = useMemo(() => {
    const values = rows.flatMap((row) => [
      row.topScorerPlayerName,
      row.tournamentMvpPlayerName,
      row.goldenGlovePlayerName,
    ]);
    return values.reduce<string>(
      (max, value) => {
        const trimmed = value?.trim() ?? "";
        return trimmed.length > max.length ? trimmed : max;
      },
      ""
    );
  }, [rows]);

  const [fontSizes, setFontSizes] = useState<GeneralPredictionsFontSizes>({
    nameFontSize: FONT_MAX_PX,
    playerFontSize: FONT_MAX_PX,
  });

  useLayoutEffect(() => {
    function measure() {
      const nameWidth = columns.name
        ? columns.name.clientWidth - RANKING_AVATAR_PX - RANKING_NAME_GAP_PX
        : 0;
      const playerWidth = columns.player?.clientWidth ?? 0;

      setFontSizes({
        nameFontSize: measureSingleLineFontSize(longestName, nameWidth),
        playerFontSize: measureSingleLineFontSize(longestPlayer, playerWidth - 4),
      });
    }

    if (!columns.name && !columns.player) {
      setFontSizes({ nameFontSize: FONT_MAX_PX, playerFontSize: FONT_MAX_PX });
      return;
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (columns.name) observer.observe(columns.name);
    if (columns.player) observer.observe(columns.player);
    return () => observer.disconnect();
  }, [columns.name, columns.player, longestName, longestPlayer, rows.length]);

  return fontSizes;
}
