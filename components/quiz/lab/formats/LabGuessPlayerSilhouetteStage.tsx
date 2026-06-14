"use client";

import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import {
  isSilhouetteAssetUrl,
  useLabAssetImageLoading,
} from "@/components/quiz/lab/useLabAssetImageLoading";
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
  const isSilhouetteAsset = isSilhouetteAssetUrl(question.imageUrl);
  const waitingForSilhouette = isSilhouetteAsset && (!revealed || !question.revealImageUrl);
  const { assetLoading, assetError, onAssetLoad, onAssetError } = useLabAssetImageLoading(
    question.imageUrl,
    hasImage && !loading && waitingForSilhouette
  );
  const showAssetPlaceholder = hasImage && !loading && assetLoading && waitingForSilhouette;

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
        {hasImage && !loading && !showAssetPlaceholder ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displaySrc}
              alt=""
              onLoad={onAssetLoad}
              onError={onAssetError}
              className={cn(
                "h-full w-full object-contain object-center transition-opacity duration-500",
                assetLoading && waitingForSilhouette && "opacity-0",
                revealed && !assetLoading && "opacity-95"
              )}
            />
            {!revealed && !assetLoading ? (
              <div className="absolute inset-x-0 top-3 text-center">
                <span className="rounded-lg bg-black/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-white">
                  {question.prompt}
                </span>
              </div>
            ) : revealed && question.revealImageUrl && !assetLoading ? (
              <div className="absolute inset-x-0 top-2 text-center">
                <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] text-white">
                  Foto completa
                </span>
              </div>
            ) : null}
          </>
        ) : (
          <LabGenerationPlaceholder
            loading={loading || showAssetPlaceholder}
            label={
              loading
                ? "Generando pregunta…"
                : assetError
                  ? "No se pudo generar la silueta. Pulsa «Generar» de nuevo."
                  : "Generando silueta con IA… puede tardar hasta 1 minuto"
            }
          />
        )}
        {revealed && revealedPlayerName && !assetLoading ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-12">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--lab-accent)]">
              {revealed && question.revealImageUrl ? "Así es" : "La silueta es"}
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
