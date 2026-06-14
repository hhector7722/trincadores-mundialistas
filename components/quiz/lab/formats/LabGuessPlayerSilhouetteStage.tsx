"use client";

import { useMemo, useState } from "react";
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
  const [retryCount, setRetryCount] = useState(0);
  const hasImage = Boolean(question.imageUrl?.trim());
  const waitingForSilhouette =
    isSilhouetteAssetUrl(question.imageUrl) && (!revealed || !question.revealImageUrl);
  const assetSrc = useMemo(() => {
    if (!question.imageUrl) return "";
    const separator = question.imageUrl.includes("?") ? "&" : "?";
    return `${question.imageUrl}${separator}_retry=${retryCount}`;
  }, [question.imageUrl, retryCount]);

  const { assetLoading, assetError, onAssetLoad, onAssetError } =
    useLabAssetImageLoading(assetSrc, hasImage && !loading && waitingForSilhouette);

  const showRevealPhoto = revealed && Boolean(question.revealImageUrl?.trim());
  const activeSrc = showRevealPhoto ? question.revealImageUrl! : assetSrc;
  const showLoadingOverlay = hasImage && !loading && assetLoading && waitingForSilhouette;

  const handleAssetError = () => {
    if (retryCount < 2) {
      setRetryCount((count) => count + 1);
      return;
    }
    onAssetError();
  };

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
        {hasImage && !loading && !assetError ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              key={activeSrc}
              src={activeSrc}
              alt=""
              onLoad={onAssetLoad}
              onError={handleAssetError}
              className={cn(
                "h-full w-full object-contain object-center transition-opacity duration-500",
                showLoadingOverlay && "opacity-0",
                revealed && !showLoadingOverlay && "opacity-95"
              )}
            />
            {!revealed && !showLoadingOverlay ? (
              <div className="absolute inset-x-0 top-3 text-center">
                <span className="rounded-lg bg-black/70 px-3 py-1 font-display text-xs uppercase tracking-widest text-white">
                  {question.prompt}
                </span>
              </div>
            ) : showRevealPhoto && !showLoadingOverlay ? (
              <div className="absolute inset-x-0 top-2 text-center">
                <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] text-white">
                  Foto completa
                </span>
              </div>
            ) : null}
          </>
        ) : assetError ? (
          <LabGenerationPlaceholder
            loading={false}
            label="No se pudo cargar la silueta. Pulsa «Generar» de nuevo o salta la pregunta."
          />
        ) : loading || !hasImage ? (
          <LabGenerationPlaceholder
            loading={loading}
            label="Pulsa «Generar» para crear la silueta"
          />
        ) : null}

        {showLoadingOverlay ? (
          <div className="absolute inset-0 z-10 bg-[var(--lab-bg-elevated)]">
            <LabGenerationPlaceholder
              loading
              label="Generando silueta…"
              className="h-full"
            />
          </div>
        ) : null}

        {revealed && revealedPlayerName && !showLoadingOverlay && !assetError ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-12">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--lab-accent)]">
              {showRevealPhoto ? "Así es" : "La silueta es"}
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
