"use client";

import { useState } from "react";
import { HomeCardHeader } from "@/components/home/HomeCardHeader";
import { ScoringRulesModal } from "@/components/home/ScoringRulesModal";
import {
  SCORING_RULES_CARD_LINES,
  type ScoringRulesCardLine,
} from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

const CARD_BUTTON_CLASS = cn(
  "@container min-h-0 min-w-0 overflow-hidden rounded-2xl text-left tm-stat-card",
  "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
);

const CARD_BODY_CLASS = "p-[clamp(0.5rem,3cqw,0.75rem)]";

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
        "flex w-full items-center justify-between gap-2 text-[10px] font-medium leading-snug",
        className
      )}
    >
      <span className="min-w-0 truncate text-white/75">{line.label}</span>
      <span className="shrink-0 tabular-nums text-right text-[#CCFF00]">{line.points}</span>
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
  const useFourRowGrid = showHeader && lines.length >= 3;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(CARD_BUTTON_CLASS, flexClass, "flex flex-col")}
      aria-label="Normas de puntuación. Pulsa para ver el detalle."
    >
      {showHeader ? (
        <HomeCardHeader
          title="Normas"
          action={
            <span className="shrink-0 text-[9px] font-semibold text-[var(--tm-primary-fg)]">ver más</span>
          }
        />
      ) : null}
      {useFourRowGrid ? (
        <div
          className={cn(
            CARD_BODY_CLASS,
            "grid min-h-0 flex-1 grid-cols-[1fr_auto] grid-rows-3 gap-x-2"
          )}
        >
          {lines.flatMap((line) => {
            if (line.kind !== "points") return [];

            return [
              <span
                key={`${line.label}-label`}
                className="flex min-h-0 items-center truncate text-[10px] font-medium leading-snug text-white/75"
              >
                {line.label}
              </span>,
              <span
                key={`${line.label}-points`}
                className="flex min-h-0 items-center justify-end text-[10px] font-medium tabular-nums leading-snug text-[#CCFF00]"
              >
                {line.points}
              </span>,
            ];
          })}
        </div>
      ) : (
        <div className={cn(CARD_BODY_CLASS, "flex min-h-0 flex-1 flex-col justify-center gap-1")}>
          {lines.map((line) => (
            <ScoringRuleRow key={line.kind === "points" ? line.label : line.text} line={line} />
          ))}
        </div>
      )}
    </button>
  );
}

export function HomeScoringRulesCard() {
  const [open, setOpen] = useState(false);
  const openModal = () => setOpen(true);
  const topLines = SCORING_RULES_CARD_LINES;
  const bottomLines: ScoringRulesCardLine[] = [];

  return (
    <>
      <div className="col-start-1 flex h-full min-h-0 min-w-0 flex-col gap-1.5">
        <ScoringRulesMiniCard
          lines={topLines}
          showHeader
          flexClass="flex-[4]"
          onOpen={openModal}
        />
        <ScoringRulesMiniCard lines={bottomLines} flexClass="flex-1" onOpen={openModal} />
      </div>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
