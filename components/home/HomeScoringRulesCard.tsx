"use client";

import { useState } from "react";
import { ScoringRulesModal } from "@/components/home/ScoringRulesModal";
import {
  SCORING_RULES_CARD_LINES,
  type ScoringRulesCardLine,
} from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

const CARD_BUTTON_CLASS = cn(
  "@container flex min-h-0 min-w-0 flex-col rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] text-left tm-stat-card",
  "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
);

function ScoringRuleRow({ line }: { line: ScoringRulesCardLine }) {
  if (line.kind !== "points") return null;

  return (
    <p className="flex items-center justify-between gap-2 text-[10px] font-medium leading-snug">
      <span className="text-white/75">{line.label}</span>
      <span className="shrink-0 text-[#CCFF00]">{line.points}</span>
    </p>
  );
}

type ScoringRulesMiniCardProps = {
  lines: ScoringRulesCardLine[];
  showHeader?: boolean;
  flexClass?: string;
  onOpen: () => void;
};

function ScoringRulesMiniCard({
  lines,
  showHeader = false,
  flexClass = "flex-1",
  onOpen,
}: ScoringRulesMiniCardProps) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(CARD_BUTTON_CLASS, flexClass)}
      aria-label="Normas de puntuación. Pulsa para ver el detalle."
    >
      {showHeader ? (
        <div className="mb-1 flex shrink-0 items-center justify-between gap-2">
          <p className="text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
            Normas
          </p>
          <span className="text-[9px] font-semibold text-[#CCFF00]">ver más</span>
        </div>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col justify-center gap-1">
        {lines.map((line) => (
          <ScoringRuleRow key={line.kind === "points" ? line.label : line.text} line={line} />
        ))}
      </div>
    </button>
  );
}

export function HomeScoringRulesCard() {
  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const topLines = SCORING_RULES_CARD_LINES.slice(0, 2);
  const bottomLines = SCORING_RULES_CARD_LINES.slice(2);

  return (
    <>
      <div className="col-start-1 flex h-full min-h-0 min-w-0 flex-col gap-1.5">
        <ScoringRulesMiniCard
          lines={topLines}
          showHeader
          flexClass="flex-[1.2]"
          onOpen={openModal}
        />
        <ScoringRulesMiniCard lines={bottomLines} flexClass="flex-[0.8]" onOpen={openModal} />
      </div>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
