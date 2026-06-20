"use client";

import { LineChart } from "lucide-react";
import { useState } from "react";
import { RankingEvolutionModal } from "@/components/ranking/RankingEvolutionModal";
import { RankingTable } from "@/components/ranking/RankingTable";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EVOLUTION_BUTTON_CLASS = cn(
  "inline-flex h-auto w-max shrink-0 items-center justify-center gap-1",
  "rounded-full bg-[#CCFF00] px-[clamp(6px,2.1cqw,8px)] py-[clamp(2px,1cqw,3px)]",
  "text-[8px] font-bold uppercase leading-none tracking-[0.12em] text-black",
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
    <>
      <RankingTable rows={rows} currentProfileId={currentProfileId} />

      <div className="tm-ranking-evolution-trigger flex shrink-0 justify-center pt-2">
        <button
          type="button"
          className={EVOLUTION_BUTTON_CLASS}
          onClick={() => setEvolutionOpen(true)}
        >
          <LineChart className="size-3 shrink-0" aria-hidden="true" />
          VER EVOLUCIÓN POR JORNADA
        </button>
      </div>

      <RankingEvolutionModal
        open={evolutionOpen}
        onClose={() => setEvolutionOpen(false)}
        poolId={poolId}
      />
    </>
  );
}
