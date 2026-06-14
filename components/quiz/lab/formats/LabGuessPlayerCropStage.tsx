"use client";

import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import { useLabStaticAsset } from "@/components/quiz/lab/useLabStaticAsset";
import type { LabAssetVariant } from "@/lib/quiz/lab/lab-asset-url";
import { cn } from "@/lib/utils";

type LabGuessPlayerCropStageProps = {
  prompt: string;
  imageUrl: string;
  revealImageUrl?: string | null;
  cropLabel: "PEINADO" | "OJOS";
  sceneHint?: string | null;
  momentId?: string | null;
  revealed?: boolean;
  revealedPlayerName?: string | null;
  loading?: boolean;
};

function variantFromLabel(cropLabel: "PEINADO" | "OJOS"): LabAssetVariant {
  return cropLabel === "PEINADO" ? "hair" : "eyes";
}

export function LabGuessPlayerCropStage({
  prompt,
  imageUrl,
  revealImageUrl = null,
  cropLabel,
  sceneHint,
  momentId = null,
  revealed = false,
  revealedPlayerName,
  loading = false,
}: LabGuessPlayerCropStageProps) {
  const hasImage = Boolean(imageUrl?.trim());
  const fullRevealSrc = revealImageUrl?.trim() || imageUrl;
  const showFullImage = revealed && Boolean(fullRevealSrc?.trim());
  const {
    displayUrl: cropSrc,
    assetLoading,
    assetError,
    onImageError,
  } = useLabStaticAsset(imageUrl, {
    momentId,
    variant: variantFromLabel(cropLabel),
    enabled: hasImage && !loading && !showFullImage,
  });

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
        {hasImage && !loading && !assetError ? (
          <>
            {showFullImage ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={fullRevealSrc}
                alt=""
                className="h-full w-full object-contain object-center transition-opacity duration-500"
              />
            ) : (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={cropSrc}
                alt=""
                onError={onImageError}
                className={cn(
                  "h-full w-full object-contain object-center transition-opacity duration-300",
                  assetLoading && "opacity-0"
                )}
              />
            )}

            {assetLoading ? (
              <div className="absolute inset-0 z-10 bg-[var(--lab-bg-elevated)]">
                <LabGenerationPlaceholder
                  loading
                  label={`Cargando recorte de ${cropLabel === "PEINADO" ? "peinado" : "ojos"}…`}
                  className="h-full"
                />
              </div>
            ) : null}
          </>
        ) : assetError ? (
          <LabGenerationPlaceholder
            loading={false}
            label="Asset no materializado. Ejecuta npm run quiz:materialize-lab-assets y vuelve a desplegar."
          />
        ) : (
          <LabGenerationPlaceholder
            loading={loading}
            label="Pulsa «Generar» para crear el recorte"
          />
        )}
        {hasImage && !loading && !revealed && !showFullImage && !assetError ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
            <p className="text-center font-display text-sm uppercase tracking-wider text-white">
              {prompt}
            </p>
          </div>
        ) : null}
        {revealed && revealedPlayerName ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-10">
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
