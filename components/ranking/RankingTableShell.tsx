"use client";

import { LineChart } from "lucide-react";
import { useState } from "react";
import { RankingEvolutionModal } from "@/components/ranking/RankingEvolutionModal";
import { RankingLegend, RankingTable } from "@/components/ranking/RankingTable";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

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

  return (
    <div className="tm-ranking-shell flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <RankingTable rows={rows} currentProfileId={currentProfileId} />

      <RankingLegend />

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
