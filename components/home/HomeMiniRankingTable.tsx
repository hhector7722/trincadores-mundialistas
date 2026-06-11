"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef } from "react";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { MINI_RANKING_GRID } from "@/components/ranking/ranking-grid";
import {
  getContextualLeaderboardStartIndex,
  VISIBLE_ROW_COUNT,
} from "@/lib/ranking/context-rows";
import { formatAggregateStat } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

type HomeMiniRankingTableProps = {
  rows: LeaderboardRow[];
  currentProfileId?: string;
};

function getRowHeight(container: HTMLElement): number {
  return container.clientHeight / VISIBLE_ROW_COUNT;
}

function getMaxStartIndex(rowCount: number): number {
  return Math.max(0, rowCount - VISIBLE_ROW_COUNT);
}

function snapScrollTop(
  container: HTMLElement,
  rowCount: number,
  behavior: ScrollBehavior = "auto"
): void {
  const rowHeight = getRowHeight(container);
  if (rowHeight <= 0) return;

  const maxStart = getMaxStartIndex(rowCount);
  const rawIndex = Math.round(container.scrollTop / rowHeight);
  const index = Math.min(maxStart, Math.max(0, rawIndex));
  const target = index * rowHeight;

  if (Math.abs(container.scrollTop - target) > 1) {
    container.scrollTo({ top: target, behavior });
  }
}

function MiniRankingHeader() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "h-[var(--tm-home-mini-ranking-header-h)] shrink-0 border-b border-white/10 px-[clamp(0.375rem,2.5cqw,0.5rem)] py-1 text-[8px] font-semibold uppercase tracking-wide text-white/45"
      )}
    >
      <span aria-hidden="true" />
      <span>Pos</span>
      <span className="text-center">Trincador</span>
      <span className="text-right">Pts</span>
      <span className="text-right">Fiab</span>
    </div>
  );
}

function MiniRankingDataRow({
  row,
  isCurrentUser,
}: {
  row: LeaderboardRow;
  isCurrentUser: boolean;
}) {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "tm-home-mini-ranking__row border-b border-white/5 px-[clamp(0.375rem,2.5cqw,0.5rem)] py-1 text-[9px] last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className="shrink-0 font-display tabular-nums text-white/85">
        {formatAggregateStat(row.position)}
      </span>
      <div className="flex min-w-0 items-center gap-2">
        <AvatarDisplay avatarUrl={row.avatarUrl} label={row.label} size="mini" />
        <span
          className={cn(
            "min-w-0 flex-1 truncate text-[9px] font-medium",
            isCurrentUser ? "text-[#CCFF00]" : "text-white/85"
          )}
        >
          {row.label}
        </span>
      </div>
      <span className="shrink-0 text-right font-display tabular-nums text-white/85">
        {formatAggregateStat(row.cumulativePoints)}
      </span>
      <span className="shrink-0 text-right tabular-nums text-white/45">
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
    </div>
  );
}

export function HomeMiniRankingTable({ rows, currentProfileId }: HomeMiniRankingTableProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const snapEnabled = rows.length > VISIBLE_ROW_COUNT;

  const scrollToContext = useCallback(
    (behavior: ScrollBehavior = "auto") => {
      const container = scrollRef.current;
      if (!container || rows.length === 0) return;

      const startIndex = getContextualLeaderboardStartIndex(rows, currentProfileId);
      const rowHeight = getRowHeight(container);
      if (rowHeight <= 0) return;

      container.scrollTo({ top: startIndex * rowHeight, behavior });
    },
    [rows, currentProfileId]
  );

  useLayoutEffect(() => {
    scrollToContext();
  }, [scrollToContext]);

  useLayoutEffect(() => {
    const container = scrollRef.current;
    if (!container || !snapEnabled) return;

    const onScrollEnd = () => snapScrollTop(container, rows.length, "smooth");

    container.addEventListener("scrollend", onScrollEnd);
    return () => container.removeEventListener("scrollend", onScrollEnd);
  }, [rows.length, snapEnabled]);

  return (
    <Link
      href="/ranking"
      aria-label="Ver tabla de clasificación"
      className={cn(
        "tm-home-top-stat-card @container flex min-w-0 flex-col overflow-hidden rounded-2xl tm-stat-card",
        "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
      )}
    >
      <MiniRankingHeader />
      <div ref={scrollRef} className="tm-home-mini-ranking__viewport">
        {rows.length === 0 ? (
          <p className="px-3 py-4 text-center text-[9px] text-white/35">Sin clasificación</p>
        ) : (
          rows.map((row) => (
            <MiniRankingDataRow
              key={row.profileId}
              row={row}
              isCurrentUser={row.profileId === currentProfileId}
            />
          ))
        )}
      </div>
    </Link>
  );
}
