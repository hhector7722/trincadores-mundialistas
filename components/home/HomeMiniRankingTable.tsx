"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { HomeStatCardScrollHint } from "@/components/home/HomeStatCardScrollHint";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { PositionTrendIndicator } from "@/components/ranking/PositionTrendIndicator";
import {
  MINI_RANKING_AVATAR_COL,
  MINI_RANKING_GRID,
  MINI_RANKING_NAME_COL,
  MINI_RANKING_POS_COL,
  MINI_RANKING_STAT_COL,
} from "@/components/ranking/ranking-grid";
import { formatQuizScore } from "@/lib/quiz/format";
import { formatAggregateStat, formatPoints } from "@/lib/ranking/format";
import { formatReliabilityPct } from "@/lib/ranking/reliability";
import {
  getContextualLeaderboardStartIndex,
  VISIBLE_ROW_COUNT,
} from "@/lib/ranking/context-rows";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

type HomeMiniRankingTableProps = {
  rows: LeaderboardRow[];
  currentProfileId?: string;
};

function MiniRankingHeader() {
  return (
    <div
      className={cn(
        MINI_RANKING_GRID,
        "h-[var(--tm-home-mini-ranking-header-h)] shrink-0 border-b border-white/10 px-1 py-0.5 text-[7px] font-semibold uppercase leading-none text-white/45"
      )}
    >
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span aria-hidden="true" />
      <span className={MINI_RANKING_STAT_COL}>Pts</span>
      <span className={MINI_RANKING_STAT_COL}>Fiab</span>
      <span className={MINI_RANKING_STAT_COL}>Quiz</span>
      <span aria-hidden="true" />
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
        "tm-home-mini-ranking__row border-b border-white/5 px-1 py-0 text-[8px] leading-none last:border-0"
      )}
    >
      <PositionTrendIndicator trend={row.positionTrend} />
      <span className={cn(MINI_RANKING_POS_COL, "text-white/85")}>
        {formatAggregateStat(row.position)}
      </span>
      <span className={MINI_RANKING_AVATAR_COL}>
        <AvatarDisplay avatarUrl={row.avatarUrl} label={row.label} size="mini" />
      </span>
      <span
        className={cn(
          MINI_RANKING_NAME_COL,
          isCurrentUser ? "text-[#CCFF00]" : "text-white/85"
        )}
      >
        {row.label}
      </span>
      <span className={cn(MINI_RANKING_STAT_COL, "font-display text-white/85")}>
        {formatPoints(row.cumulativePoints)}
      </span>
      <span className={cn(MINI_RANKING_STAT_COL, "text-white/45")}>
        {formatReliabilityPct(row.reliabilityPct)}
      </span>
      <span className={cn(MINI_RANKING_STAT_COL, "font-display text-white/85")}>
        {formatQuizScore(row.quizPoints, row.hasQuizParticipated)}
      </span>
      <span aria-hidden="true" />
    </div>
  );
}

export function HomeMiniRankingTable({ rows, currentProfileId }: HomeMiniRankingTableProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollHint, setScrollHint] = useState<0 | 1>(0);
  const canScroll = rows.length > VISIBLE_ROW_COUNT;

  const updateScrollHint = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const maxScroll = viewport.scrollHeight - viewport.clientHeight;
    if (maxScroll <= 1) {
      setScrollHint(0);
      return;
    }

    setScrollHint(viewport.scrollTop > maxScroll * 0.12 ? 1 : 0);
  }, []);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || rows.length === 0) return;

    const startIndex = getContextualLeaderboardStartIndex(rows, currentProfileId);
    const rowHeight = viewport.clientHeight / VISIBLE_ROW_COUNT;
    viewport.scrollTop = startIndex * rowHeight;
    updateScrollHint();
  }, [rows, currentProfileId, updateScrollHint]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || !canScroll) return;

    updateScrollHint();
    viewport.addEventListener("scroll", updateScrollHint, { passive: true });
    return () => viewport.removeEventListener("scroll", updateScrollHint);
  }, [canScroll, updateScrollHint]);

  return (
    <Link
      href="/ranking"
      aria-label="Ver tabla de clasificación"
      className={cn(
        "tm-home-top-stat-card @container flex min-h-0 min-w-0 flex-col overflow-hidden rounded-2xl tm-stat-card",
        "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
      )}
    >
      <MiniRankingHeader />
      <div className="tm-home-mini-ranking__body">
        {canScroll ? (
          <HomeStatCardScrollHint activeSlot={scrollHint} orientation="vertical" />
        ) : null}
        <div ref={viewportRef} className="tm-home-mini-ranking__viewport">
          {rows.length === 0 ? (
            <p className="px-3 py-4 text-center text-[8px] text-white/35">Sin clasificación</p>
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
      </div>
    </Link>
  );
}
