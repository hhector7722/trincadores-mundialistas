"use client";

import { LineChart } from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { RankingEvolutionModal } from "@/components/ranking/RankingEvolutionModal";
import { RankingTable, type EnhancedLeaderboardRow } from "@/components/ranking/RankingTable";
import { useQuizBonusActive, quizBonusStore } from "@/components/ranking/quiz-bonus-store";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

function sortKey(row: {
  label: string;
  cumulativePoints: number;
  exactHits: number;
}): [number, number, string] {
  return [-row.cumulativePoints, -row.exactHits, row.label.toLowerCase()];
}

function compareLeaderboardRows(
  a: { label: string; cumulativePoints: number; exactHits: number },
  b: { label: string; cumulativePoints: number; exactHits: number }
): number {
  const ka = sortKey(a);
  const kb = sortKey(b);
  if (ka[0] !== kb[0]) return ka[0] - kb[0];
  if (ka[1] !== kb[1]) return ka[1] - kb[1];
  return ka[2].localeCompare(kb[2], "es");
}

const EVOLUTION_BUTTON_CLASS = cn(
  "inline-flex h-auto w-max shrink-0 items-center justify-center gap-1.5",
  "rounded-full bg-[#CCFF00] px-[clamp(8px,2.6cqw,10px)] pt-[clamp(3px,1.25cqw,4px)] pb-[clamp(2px,0.6cqw,2.5px)]",
  "text-[10px] font-bold uppercase leading-none tracking-[0.12em] text-black",
  "transition-opacity hover:opacity-90 active:opacity-80"
);

type RankingTableShellProps = {
  rows: LeaderboardRow[];
  currentProfileId: string;
  poolId: string;
};

export function RankingTableShell({
  rows,
  currentProfileId,
  poolId,
}: RankingTableShellProps) {
  const [evolutionOpen, setEvolutionOpen] = useState(false);
  const isQuizBonusActive = useQuizBonusActive();

  useEffect(() => {
    quizBonusStore.reset();
    return () => quizBonusStore.reset();
  }, []);

  const processedRows = useMemo(() => {
    // 1. Identify top 4 in quiz
    const sortedByQuiz = [...rows].sort((a, b) => {
      if (a.quizPoints !== b.quizPoints) return b.quizPoints - a.quizPoints;
      if (a.quizTimeMs !== b.quizTimeMs) return a.quizTimeMs - b.quizTimeMs;
      return a.label.localeCompare(b.label, "es", { sensitivity: "base" });
    });

    const bonuses = [5, 3, 2, 1];
    const bonusMap = new Map<string, number>();
    for (let i = 0; i < bonuses.length && i < sortedByQuiz.length; i++) {
      bonusMap.set(sortedByQuiz[i].profileId, bonuses[i]);
    }

    // 2. Add bonus text and optionally update points
    let nextRows: EnhancedLeaderboardRow[] = rows.map((row) => {
      const bonus = bonusMap.get(row.profileId) ?? 0;
      return {
        ...row,
        quizBonusText: bonus > 0 ? `+${bonus} pts` : undefined,
        cumulativePoints: isQuizBonusActive ? row.cumulativePoints + bonus : row.cumulativePoints,
      };
    });

    // 3. Re-sort and adjust positions if active
    if (isQuizBonusActive) {
      nextRows.sort(compareLeaderboardRows);
      nextRows = nextRows.map((row, index) => {
        const newPosition = index + 1;
        let trend: "up" | "down" | null = null;
        if (newPosition < row.position) trend = "up";
        if (newPosition > row.position) trend = "down";
        return {
          ...row,
          position: newPosition,
          positionTrend: trend,
        };
      });
    }

    return nextRows;
  }, [rows, isQuizBonusActive]);

  return (
    <div className="tm-ranking-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <RankingTable rows={processedRows} currentProfileId={currentProfileId} />

      <div className="tm-ranking-evolution-trigger flex shrink-0 justify-center pt-2">
        <button
          type="button"
          className={EVOLUTION_BUTTON_CLASS}
          onClick={() => setEvolutionOpen(true)}
        >
          <LineChart className="size-4 shrink-0" aria-hidden="true" />
          VER EVOLUCIÓN POR JORNADA
        </button>
      </div>

      <RankingEvolutionModal
        open={evolutionOpen}
        onClose={() => setEvolutionOpen(false)}
        poolId={poolId}
      />
    </div>
  );
}
