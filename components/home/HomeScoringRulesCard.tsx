"use client";

import { useState } from "react";
import { ScoringRulesModal } from "@/components/home/ScoringRulesModal";
import { SCORING_RULES_CARD_SUMMARY } from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

export function HomeScoringRulesCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "@container col-start-1 min-h-12 min-w-0 rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] text-left tm-stat-card",
          "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
        )}
        aria-label="Normas de puntuación. Pulsa para ver el detalle."
      >
        <p className="truncate text-[9px] font-semibold uppercase tracking-wide text-white/50">
          Normas de puntuación
        </p>
        <div className="mt-1.5 space-y-0.5">
          {SCORING_RULES_CARD_SUMMARY.map((line) => (
            <p
              key={line}
              className="text-[10px] font-medium leading-snug text-white/75"
            >
              {line}
            </p>
          ))}
        </div>
      </button>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
