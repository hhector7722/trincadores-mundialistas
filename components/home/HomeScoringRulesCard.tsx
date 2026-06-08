"use client";

import { useState } from "react";
import { ScoringRulesModal } from "@/components/home/ScoringRulesModal";
import {
  SCORING_RULES_CARD_LINES,
  type ScoringRulesCardLine,
} from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

const CARD_BUTTON_CLASS = cn(
  "@container min-h-0 min-w-0 rounded-2xl p-2 text-left tm-stat-card",
  "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
);

function ScoringRuleRow({
  line,
  className,
}: {
  line: ScoringRulesCardLine;
  className?: string;
}) {
  if (line.kind !== "points") return null;

  return (
    <p
      className={cn(
        "flex w-full items-center justify-between gap-2 text-[9px] font-medium leading-none",
        className
      )}
    >
      <span className="min-w-0 text-white/75">{line.label}</span>
      <span className="shrink-0 tabular-nums text-right text-[#CCFF00]">{line.points}</span>
    </p>
  );
}

type ScoringRulesMiniCardProps = {
  lines: ScoringRulesCardLine[];
  showHeader?: boolean;
  className?: string;
  onOpen: () => void;
};

function ScoringRulesMiniCard({
  lines,
  showHeader = false,
  className,
  onOpen,
}: ScoringRulesMiniCardProps) {
  const useFourRowGrid = showHeader && lines.length >= 3;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        CARD_BUTTON_CLASS,
        className,
        useFourRowGrid
          ? "grid h-full grid-cols-[minmax(0,1fr)_auto] grid-rows-[auto_1fr_1fr_1fr] gap-x-2"
          : "flex h-full flex-col justify-center"
      )}
      aria-label="Normas de puntuación. Pulsa para ver el detalle."
    >
      {showHeader ? (
        <div className="col-span-2 flex min-h-0 items-center justify-between gap-2 pb-0.5">
          <p className="text-[9px] font-semibold uppercase leading-none tracking-wide text-[#CCFF00]">
            Normas
          </p>
          <span className="text-[9px] font-semibold leading-none text-[#CCFF00]">ver más</span>
        </div>
      ) : null}
      {useFourRowGrid ? (
        lines.flatMap((line) => {
          if (line.kind !== "points") return [];

          return [
            <span
              key={`${line.label}-label`}
              className="flex min-h-0 items-center text-[9px] font-medium leading-none text-white/75"
            >
              {line.label}
            </span>,
            <span
              key={`${line.label}-points`}
              className="flex min-h-0 items-center justify-end text-[9px] font-medium tabular-nums leading-none text-[#CCFF00]"
            >
              {line.points}
            </span>,
          ];
        })
      ) : (
        <div className="flex min-h-0 flex-1 flex-col justify-center gap-1">
          {lines.map((line) => (
            <ScoringRuleRow key={line.kind === "points" ? line.label : line.text} line={line} />
          ))}
        </div>
      )}
    </button>
  );
}

type HomeScoringRulesCardProps = {
  className?: string;
};

export function HomeScoringRulesCard({ className }: HomeScoringRulesCardProps) {
  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);

  return (
    <>
      <div className={cn("min-h-0", className)}>
        <ScoringRulesMiniCard
          lines={SCORING_RULES_CARD_LINES}
          showHeader
          className="h-full w-full"
          onOpen={openModal}
        />
      </div>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
