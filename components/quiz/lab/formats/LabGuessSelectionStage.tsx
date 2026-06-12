"use client";

import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import { resolveClubCrestUrl } from "@/lib/quiz/lab/club-crests";
import type { LabQuestionGuessSelection } from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabGuessSelectionStageProps = {
  question: LabQuestionGuessSelection;
  compact?: boolean;
  /** Tras responder: muestra el nombre de cada jugador bajo su escudo. */
  revealed?: boolean;
};

export function LabGuessSelectionStage({
  question,
  compact = false,
  revealed = false,
}: LabGuessSelectionStageProps) {
  const anchors = FORMATION_SLOT_ANCHORS[question.formation];
  const slotByKey = Object.fromEntries(question.slots.map((slot) => [slot.slotKey, slot]));

  const correctLabel =
    question.options.find((option) => option.id === question.correctOptionId)?.label ?? null;

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-[#0a2e14]",
        compact ? "aspect-[4/5]" : "aspect-[3/4]"
      )}
    >
      <div className="absolute inset-0 bg-[linear-gradient(180deg,#1a6b32_0%,#0d4a22_45%,#0a3a1a_100%)]" />
      <div className="absolute inset-x-[8%] top-[6%] bottom-[6%] rounded-lg border border-white/20 bg-[#1e7a38]/80" />
      <div className="absolute inset-x-[8%] top-1/2 h-px -translate-y-1/2 bg-white/25" />
      <div className="absolute left-1/2 top-[6%] bottom-[6%] w-px -translate-x-1/2 bg-white/20" />
      <div className="absolute left-[8%] top-[6%] bottom-[6%] w-[14%] rounded-l border border-white/30 border-r-0" />

      {anchors.map((anchor) => {
        const slot = slotByKey[anchor.key];
        if (!slot) return null;

        const crestUrl =
          slot.clubImageUrl ?? resolveClubCrestUrl(slot.clubLabel) ?? null;

        return (
          <div
            key={anchor.key}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${anchor.coord.x}%`,
              top: `${anchor.coord.y}%`,
            }}
          >
            <div
              className={cn(
                "flex flex-col items-center gap-0.5",
                compact ? "w-14" : "w-16"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center overflow-hidden rounded-full border-2 bg-white p-0.5 shadow-[0_0_12px_rgba(0,255,65,0.35)]",
                  revealed ? "border-white" : "border-[var(--lab-accent)]",
                  compact ? "h-9 w-9" : "h-11 w-11"
                )}
              >
                {crestUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={crestUrl}
                    alt={slot.clubLabel}
                    className="h-full w-full rounded-full object-contain"
                    loading="lazy"
                  />
                ) : (
                  <span
                    className="px-0.5 text-center text-[7px] font-bold uppercase leading-none text-red-300"
                    title={`Falta escudo: ${slot.clubLabel}`}
                  >
                    ?
                  </span>
                )}
              </div>
              {revealed && slot.playerName ? (
                <span
                  className={cn(
                    "max-w-full truncate rounded bg-black/65 px-1 py-0.5 text-center font-medium leading-tight text-white",
                    compact ? "text-[7px]" : "text-[9px]"
                  )}
                >
                  {slot.playerName}
                </span>
              ) : null}
            </div>
          </div>
        );
      })}

      <div className="absolute inset-x-0 top-3 text-center">
        <span className="font-display text-sm uppercase tracking-[0.15em] text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">
          {revealed && correctLabel
            ? correctLabel
            : question.prompt || "ADIVINA LA SELECCIÓN"}
        </span>
      </div>
    </div>
  );
}
