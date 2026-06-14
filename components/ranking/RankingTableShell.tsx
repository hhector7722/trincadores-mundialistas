"use client";

import { useState } from "react";
import { RankingEvolutionModal } from "@/components/ranking/RankingEvolutionModal";
import { RankingTable } from "@/components/ranking/RankingTable";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EVOLUTION_BUTTON_CLASS = cn(
  "inline-flex min-h-12 w-max shrink-0 items-center justify-center",
  "rounded-full bg-[#CCFF00] px-4 py-2",
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
    <>
      <div className="tm-ranking-evolution-trigger flex shrink-0 justify-center pb-2">
        <button
          type="button"
          className={EVOLUTION_BUTTON_CLASS}
          onClick={() => setEvolutionOpen(true)}
        >
          VER EVOLUCIÓN
        </button>
      </div>

      <RankingTable rows={rows} currentProfileId={currentProfileId} />

      <RankingEvolutionModal
        open={evolutionOpen}
        onClose={() => setEvolutionOpen(false)}
        poolId={poolId}
      />
    </>
  );
}
