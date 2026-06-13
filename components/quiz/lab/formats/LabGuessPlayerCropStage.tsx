"use client";

type LabGuessPlayerCropStageProps = {
  prompt: string;
  imageUrl: string;
  cropLabel: "PEINADO" | "OJOS";
  sceneHint?: string | null;
  revealed?: boolean;
  revealedPlayerName?: string | null;
};

export function LabGuessPlayerCropStage({
  prompt,
  imageUrl,
  cropLabel,
  sceneHint,
  revealed = false,
  revealedPlayerName,
}: LabGuessPlayerCropStageProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <div className="flex items-center justify-between border-b border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2">
        <span className="font-display text-xs uppercase tracking-[0.2em] text-[var(--lab-accent)]">
          {cropLabel}
        </span>
        {sceneHint ? (
          <span className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
            {sceneHint}
          </span>
        ) : null}
      </div>
      <div className="relative aspect-[16/10] w-full bg-[#0a0a0a]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-contain object-center"
        />
        {!revealed ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8">
            <p className="text-center font-display text-sm uppercase tracking-wider text-white">
              {prompt}
            </p>
          </div>
        ) : null}
        {revealed && revealedPlayerName ? (
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/90 to-transparent px-4 pb-4 pt-10">
            <p className="text-center text-[10px] uppercase tracking-[0.25em] text-[var(--lab-accent)]">
              Es
            </p>
            <p className="text-center font-display text-xl uppercase tracking-wide text-white">
              {revealedPlayerName}
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
