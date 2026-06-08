"use client";

import { useState } from "react";
import { ScoringRulesModal } from "@/components/home/ScoringRulesModal";
import { SCORING_RULES_CARD_LINES } from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

export function HomeScoringRulesCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(
          "@container col-start-1 flex h-full min-h-12 min-w-0 flex-col rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] text-left tm-stat-card",
          "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
        )}
        aria-label="Normas de puntuación. Pulsa para ver el detalle."
      >
        <p className="shrink-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[#CCFF00]">
          Normas de puntuación
        </p>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly py-1">
          {SCORING_RULES_CARD_LINES.map((line) =>
            line.kind === "points" ? (
              <p
                key={line.label}
                className="text-center text-[10px] font-medium leading-snug text-white/75"
              >
                {line.label}{" "}
                <span className="text-[#CCFF00]">{line.points}</span>
              </p>
            ) : (
              <p
                key={line.text}
                className="text-center text-[10px] font-medium leading-snug text-white/75"
              >
                {line.text}
              </p>
            )
          )}
        </div>
      </button>

      <ScoringRulesModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
