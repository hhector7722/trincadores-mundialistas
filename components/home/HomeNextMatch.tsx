"use client";

import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { formatListScore } from "@/lib/predictions/edit-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";

type HomeNextMatchProps = {
  poolId: string;
  match: MatchWithPrediction;
};

function TeamBlock({ name }: { name: string }) {
  const flagCode = teamFlagCode(name);

  return (
    <div className="inline-flex w-max flex-col items-center gap-1">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)] sm:h-11 sm:w-11">
        {flagCode ? (
          <img
            src={teamFlagUrl(flagCode, 160)}
            alt=""
            width={44}
            height={44}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="font-display text-base text-[var(--tm-accent)]">
            {name.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
      <p className="whitespace-nowrap text-center text-[10px] font-semibold leading-tight text-[var(--tm-fg)] sm:text-xs">
        {name}
      </p>
    </div>
  );
}

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
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
            {isLive ? "En juego" : "Proximo partido"}
          </p>

          <div className="relative mt-2 w-full min-h-[4.25rem]">
            <div className="absolute left-[15%] top-0 -translate-x-1/2">
              <TeamBlock name={match.home_team} />
            </div>

            <div className="absolute left-[85%] top-0 -translate-x-1/2">
              <TeamBlock name={match.away_team} />
            </div>

            <div className="absolute left-1/2 top-0 flex -translate-x-1/2 flex-col items-center gap-1 pt-0.5">
              <p className="text-center font-display text-xs font-semibold leading-tight text-[var(--tm-accent)] sm:text-sm">
                {formatKickoff(match.kickoff_at)}
              </p>
              {isLive && (
                <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--tm-live)]">
                  Live
                </span>
              )}
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
            </div>
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
