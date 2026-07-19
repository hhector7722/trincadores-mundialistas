"use client";

import Image from "next/image";
import { useState } from "react";
import { FinalPredictionModal } from "@/components/predictions/FinalPredictionModal";
import { formatFinalKickoffParts } from "@/lib/home/select-final-match";
import { hasFilledPredictionScore } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

type FinalHomeScreenProps = {
  poolId: string;
  match: MatchWithPrediction | null;
};

/** Jugadores grandes, anclados bastante abajo. */
const SPA_BOX =
  "pointer-events-none absolute -left-[8%] bottom-[-5%] z-[5] h-[72%] w-[72%]";
const ARG_BOX =
  "pointer-events-none absolute -right-[10%] bottom-[-7%] z-[5] h-[74%] w-[72%]";

export function FinalHomeScreen({ poolId, match }: FinalHomeScreenProps) {
  const [modalOpen, setModalOpen] = useState(false);

  if (!match) {
    return (
      <div className="flex min-h-[50dvh] items-center justify-center px-6 text-center">
        <p className="text-sm text-[var(--tm-muted)]">
          No hay partido de final disponible.
        </p>
      </div>
    );
  }

  const hasPrediction = hasFilledPredictionScore(
    match.prediction?.home_goals ?? null,
    match.prediction?.away_goals ?? null
  );
  const ctaLabel = hasPrediction ? "EDITAR PRONÓSTICO" : "+ AÑADIR PRONÓSTICO";
  const { dateLine, timeLine } = formatFinalKickoffParts(match.kickoff_at);

  return (
    <>
      <div className="relative h-[calc(var(--tm-app-height)-var(--tm-app-header-block)-var(--tm-tabbar-shell))] w-full overflow-hidden bg-[var(--tm-final-sky)]">
        <Image
          src="/images/final/home-v5.webp"
          alt="Por lo civil o por lo criminal — final España vs Argentina"
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />

        <div className={SPA_BOX} aria-hidden>
          <Image
            src="/club_player/spa.png"
            alt=""
            fill
            sizes="75vw"
            priority
            className="object-contain object-bottom object-left drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
          />
        </div>
        <div className={ARG_BOX} aria-hidden>
          <Image
            src="/club_player/arg.png"
            alt=""
            fill
            sizes="75vw"
            priority
            className="object-contain object-bottom object-right drop-shadow-[0_12px_28px_rgba(0,0,0,0.45)]"
          />
        </div>

        {/* Fecha — bajo el título baked del arte */}
        <div className="pointer-events-none absolute inset-x-0 top-[16%] z-10 px-6 text-center font-light italic leading-snug tracking-wide text-black/80">
          <p className="text-[clamp(0.95rem,3.6vw,1.15rem)]">{dateLine}</p>
          <p className="mt-0.5 text-[clamp(0.9rem,3.4vw,1.05rem)]">{timeLine}</p>
        </div>

        {/* CTA */}
        <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center bg-gradient-to-t from-[#1a0a38] via-[#1a0a38]/50 to-transparent px-6 pb-5 pt-8">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center justify-center rounded-full bg-[#D4FF00] px-4 py-2 text-[0.8rem] font-extrabold uppercase tracking-[0.04em] text-black shadow-[0_8px_24px_rgba(0,0,0,0.35)] transition-opacity hover:opacity-95 active:opacity-85"
            aria-label={ctaLabel}
          >
            {ctaLabel}
          </button>
        </div>
      </div>

      <FinalPredictionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        poolId={poolId}
        match={match}
      />
    </>
  );
}
