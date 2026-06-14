"use client";

import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import { useLabAuthenticatedAsset } from "@/components/quiz/lab/useLabAuthenticatedAsset";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";
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
  const hasImage = Boolean(imageUrl?.trim());
  const fullRevealSrc = revealImageUrl?.trim() || imageUrl;
  const showFullImage = revealed && Boolean(fullRevealSrc?.trim());
  const useDerivedAsset = isDerivedLabAssetUrl(imageUrl) && !showFullImage;
  const {
    displayUrl: cropSrc,
    loading: assetLoading,
    error: assetError,
  } = useLabAuthenticatedAsset(imageUrl, hasImage && !loading && useDerivedAsset);
  const showAssetPlaceholder = hasImage && !loading && useDerivedAsset && assetLoading;

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
            ) : useDerivedAsset && cropSrc ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={cropSrc}
                alt=""
                className={cn(
                  "h-full w-full object-contain object-center transition-opacity duration-300",
                  assetLoading && "opacity-0"
                )}
              />
            ) : null}

            {showAssetPlaceholder ? (
              <div className="absolute inset-0 z-10 bg-[var(--lab-bg-elevated)]">
                <LabGenerationPlaceholder
                  loading
                  label={`Creando recorte de ${cropLabel === "PEINADO" ? "peinado" : "ojos"}…`}
                  className="h-full"
                />
              </div>
            ) : null}
          </>
        ) : assetError ? (
          <LabGenerationPlaceholder
            loading={false}
            label="No se pudo cargar el recorte. Pulsa «Generar» de nuevo."
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
