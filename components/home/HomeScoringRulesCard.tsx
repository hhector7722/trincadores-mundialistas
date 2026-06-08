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
        <ul className="mt-1.5 space-y-0.5">
          {SCORING_RULES_CARD_SUMMARY.map((line) => (
            <li
              key={line}
              className="flex items-start gap-1.5 text-[10px] font-medium leading-snug text-white/75"
            >
              <span className="mt-[0.35em] h-1 w-1 shrink-0 rounded-full bg-[#CCFF00]/70" aria-hidden="true" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
      </button>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
