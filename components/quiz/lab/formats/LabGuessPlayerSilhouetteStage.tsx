"use client";

import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import type { LabQuestionGuessPlayerSilhouette } from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabGuessPlayerSilhouetteStageProps = {
  question: LabQuestionGuessPlayerSilhouette;
  revealed?: boolean;
  revealedPlayerName?: string | null;
  loading?: boolean;
};

export function LabGuessPlayerSilhouetteStage({
  question,
  revealed = false,
  revealedPlayerName,
  loading = false,
}: LabGuessPlayerSilhouetteStageProps) {
  const hasImage = Boolean(question.imageUrl?.trim());
  const displaySrc =
    revealed && question.revealImageUrl ? question.revealImageUrl : question.imageUrl;

  return (
    <div className="overflow-hidden border-b border-[var(--lab-border)]">
      <div className="flex items-center justify-between bg-[var(--lab-bg-elevated)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--lab-muted)]">Silueta</span>
        {question.sceneLabel ? (
          <span className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
            {question.sceneLabel}
          </span>
        ) : null}
      </div>
      <div className="relative aspect-[4/3] w-full bg-white">
        {hasImage && !loading ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt=""
              className={cn(
                "h-full w-full object-contain object-center transition-opacity duration-500",
                revealed && "opacity-95"
              )}
            />
            {!revealed ? (
              <div className="absolute inset-x-0 top-3 text-center">
                <span className="rounded-lg bg-black/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-white">
                  {question.prompt}
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <LabGenerationPlaceholder
            loading={loading}
            label="Pulsa «Generar» — la silueta puede tardar un minuto"
          />
        )}
        {revealed && revealedPlayerName ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-12">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--lab-accent)]">
              La silueta es
            </p>
            <p className="text-center font-display text-2xl uppercase tracking-wide text-white">
              {revealedPlayerName}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
