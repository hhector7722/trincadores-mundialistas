"use client";

import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import {
  cropClipPath,
  cropFocusForKind,
  type LabCropKind,
} from "@/lib/quiz/lab/crop-focus";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";
import { useLabAssetImageLoading } from "@/components/quiz/lab/useLabAssetImageLoading";
import { cn } from "@/lib/utils";

type LabGuessPlayerCropStageProps = {
  prompt: string;
  imageUrl: string;
  revealImageUrl?: string | null;
  cropLabel: "PEINADO" | "OJOS";
  sceneHint?: string | null;
  revealed?: boolean;
  revealedPlayerName?: string | null;
  loading?: boolean;
};

function cropKindFromLabel(cropLabel: "PEINADO" | "OJOS"): LabCropKind {
  return cropLabel === "PEINADO" ? "hair" : "eyes";
}

export function LabGuessPlayerCropStage({
  prompt,
  imageUrl,
  revealImageUrl = null,
  cropLabel,
  sceneHint,
  revealed = false,
  revealedPlayerName,
  loading = false,
}: LabGuessPlayerCropStageProps) {
  const focus = cropFocusForKind(cropKindFromLabel(cropLabel));
  const useDerivedAsset = isDerivedLabAssetUrl(imageUrl);
  const hasImage = Boolean(imageUrl?.trim());
  const fullRevealSrc = revealImageUrl?.trim() || imageUrl;
  const showFullImage = revealed && Boolean(fullRevealSrc?.trim());
  const { assetLoading, onAssetLoad, onAssetError } = useLabAssetImageLoading(
    imageUrl,
    hasImage && !loading && useDerivedAsset && !showFullImage
  );
  const showAssetPlaceholder = hasImage && !loading && useDerivedAsset && assetLoading && !showFullImage;

  return (
    <div className="overflow-hidden border-b border-[var(--lab-border)]">
      <div className="flex items-center justify-between bg-[var(--lab-bg-elevated)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--lab-muted)]">{cropLabel}</span>
        {sceneHint ? (
          <span className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
            {sceneHint}
          </span>
        ) : null}
      </div>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-white">
        {hasImage && !loading && !showAssetPlaceholder ? (
          showFullImage ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={fullRevealSrc}
              alt=""
              className="h-full w-full object-contain object-center transition-opacity duration-500"
            />
          ) : useDerivedAsset ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt=""
              onLoad={onAssetLoad}
              onError={onAssetError}
              className={cn(
                "h-full w-full object-contain object-center transition-opacity duration-300",
                assetLoading && "opacity-0"
              )}
            />
          ) : (
            <div
              className="absolute inset-0"
              style={{ clipPath: cropClipPath(focus) }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt=""
                className="h-full w-full object-cover"
                style={{
                  transform: `scale(${focus.scale})`,
                  transformOrigin: `${focus.originX} ${focus.originY}`,
                }}
              />
            </div>
          )
        ) : (
          <LabGenerationPlaceholder
            loading={loading || showAssetPlaceholder}
            label={
              loading
                ? "Generando pregunta…"
                : showAssetPlaceholder
                  ? `Creando recorte de ${cropLabel === "PEINADO" ? "peinado" : "ojos"}…`
                  : "Pulsa «Generar» para crear el recorte"
            }
          />
        )}
        {hasImage && !loading && !showFullImage && !useDerivedAsset && cropLabel === "PEINADO" ? (
          <div
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/90 to-transparent"
            aria-hidden
          />
        ) : hasImage && !loading && !showFullImage && !useDerivedAsset && cropLabel === "OJOS" ? (
          <>
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-[28%] bg-gradient-to-b from-[#0a0a0a] to-transparent"
              aria-hidden
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/95 to-transparent"
              aria-hidden
            />
          </>
        ) : null}
        {hasImage && !loading && !revealed ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
            <p className="text-center font-display text-sm uppercase tracking-wider text-white">
              {prompt}
            </p>
          </div>
        ) : null}
        {revealed && revealedPlayerName ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-10">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--lab-accent)]">
              {showFullImage ? "Así es" : "Es"}
            </p>
            <p className="text-center font-display text-xl uppercase tracking-wide text-white">
              {revealedPlayerName}
            </p>
          </div>
        ) : null}
        {revealed && showFullImage ? (
          <div className="absolute inset-x-0 top-2 text-center">
            <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] text-white">
              Foto completa
            </span>
          </div>
        ) : null}
      </div>
    </div>
  );
}
