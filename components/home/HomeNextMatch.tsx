"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { MatchTeamsDisplay } from "@/components/matches/MatchTeamsDisplay";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { formatListScore } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

type HomeNextMatchProps = {
  poolId: string;
  match: MatchWithPrediction;
};

function hasSavedPrediction(match: MatchWithPrediction): boolean {
  const home = match.prediction?.home_goals ?? null;
  const away = match.prediction?.away_goals ?? null;
  return (
    home !== null &&
    away !== null &&
    Number.isInteger(home) &&
    Number.isInteger(away)
  );
}

export function HomeNextMatch({ poolId, match }: HomeNextMatchProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const isLive = match.status === "live";
  const saved = hasSavedPrediction(match);
  const scoreText = formatListScore(
    match.prediction?.home_goals ?? null,
    match.prediction?.away_goals ?? null
  );

  return (
    <>
      <section className="tm-glass-card overflow-visible p-0">
        <div className="px-4 pb-3 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
              {isLive ? "En juego" : "Proximo partido"}
            </p>
            <Link
              href="/predictions"
              className="text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--tm-accent)] transition-opacity hover:opacity-80"
            >
              Ver todos
            </Link>
          </div>
          <div className="mt-2">
          <MatchTeamsDisplay
            homeTeam={match.home_team}
            awayTeam={match.away_team}
            kickoffAt={match.kickoff_at}
            isLive={isLive}
            centerSlot={
              <div className="inline-block">
                <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
                  Mi pronóstico
                </p>
                {saved ? (
                  <div className="relative w-0 min-w-full">
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      className="block w-full text-center font-display text-sm font-semibold normal-case text-[var(--tm-accent)] transition-opacity hover:opacity-80"
                    >
                      {scoreText}
                    </button>
                    <button
                      type="button"
                      onClick={() => setModalOpen(true)}
                      aria-label="Editar pronóstico"
                      className="absolute left-full top-1/2 -ml-1.5 -translate-y-1/2 text-[var(--tm-accent)] transition-opacity hover:opacity-80"
                    >
                      <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="block w-full text-center text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-accent)] transition-opacity hover:opacity-80"
                  >
                    <span className="inline-flex items-center gap-1">
                      <Plus className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                      Añadir
                    </span>
                  </button>
                )}
              </div>
            }
          />
          </div>
        </div>
      </section>

      <QuickPredictionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        poolId={poolId}
        match={match}
      />
    </>
  );
}
