"use client";

import Link from "next/link";
import { useState } from "react";
import { Pencil, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  buildLineupView,
  buildMvpView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
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
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [entityModal, setEntityModal] = useState<{
    open: boolean;
    view: EntityModalView;
  }>({ open: false, view: buildLineupView(match.home_team) });

  const isLive = match.status === "live";
  const saved = hasSavedPrediction(match);
  const scoreText = formatListScore(
    match.prediction?.home_goals ?? null,
    match.prediction?.away_goals ?? null
  );

  function openEntityModal(view: EntityModalView) {
    setScoreModalOpen(false);
    setEntityModal({ open: true, view });
  }

  function openScoreModal() {
    setEntityModal((current) => ({ ...current, open: false }));
    setScoreModalOpen(true);
  }

  return (
    <>
      <section
        className="tm-glass-card cursor-pointer overflow-hidden p-0"
        onClick={() => openScoreModal()}
      >
        <div className="px-4 pb-2 pt-2">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
              {isLive ? "En juego" : "Proximo partido"}
            </p>
            <Link
              href="/predictions"
              onClick={(event) => event.stopPropagation()}
              className="text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--tm-accent)] transition-opacity hover:opacity-80"
            >
              Ver todos
            </Link>
          </div>
          <div className="relative mt-2 min-h-[6.75rem]">
            <MatchTeamsDisplay
              homeTeam={match.home_team}
              awayTeam={match.away_team}
              kickoffAt={match.kickoff_at}
              isLive={isLive}
              onHomeTeamClick={() => openEntityModal(buildLineupView(match.home_team, match.id))}
              onAwayTeamClick={() => openEntityModal(buildLineupView(match.away_team, match.id))}
              centerSlotAlign={saved ? "default" : "teamNames"}
              centerSlot={
                saved ? (
                  <div className="inline-block">
                    <p className="text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
                      Mi pronóstico
                    </p>
                    <div className="relative w-0 min-w-full">
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openScoreModal();
                        }}
                        className="block w-full text-center font-display text-sm font-semibold normal-case text-[var(--tm-accent)] transition-opacity hover:opacity-80"
                      >
                        {scoreText}
                      </button>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openScoreModal();
                        }}
                        aria-label="Editar pronóstico"
                        className="absolute left-full top-1/2 -ml-1.5 -translate-y-1/2 text-[var(--tm-accent)] transition-opacity hover:opacity-80"
                      >
                        <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      openScoreModal();
                    }}
                    className={cn(
                      "inline-flex shrink-0 items-center whitespace-nowrap rounded-full",
                      "bg-[#CCFF00] px-[clamp(6px,2.1cqw,8px)] py-[clamp(3px,1cqw,4px)]",
                      "text-[clamp(8px,2.2cqw,9px)] font-bold uppercase tracking-wide text-black",
                      "transition-opacity hover:opacity-90 active:opacity-80"
                    )}
                  >
                    <Plus className="mr-0.5 h-2.5 w-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                    Añadir
                  </button>
                )
              }
            />
            <div
              className="absolute inset-x-0 bottom-0"
              onClick={(event) => event.stopPropagation()}
            >
              <MatchContextActionsRow
                compact
                layout="teamAnchors"
                homeAnchor="15%"
                awayAnchor="85%"
                className="[&>div]:min-h-[2rem]"
                match={match}
                onOpenHomeLineup={() => openEntityModal(buildLineupView(match.home_team, match.id))}
                onOpenAwayLineup={() => openEntityModal(buildLineupView(match.away_team, match.id))}
                onOpenMvp={() => openEntityModal(buildMvpView(poolId, match))}
              />
            </div>
          </div>
        </div>
      </section>

      <QuickPredictionModal
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        poolId={poolId}
        match={match}
      />

      <EntityModalController
        open={entityModal.open}
        onClose={() => setEntityModal((current) => ({ ...current, open: false }))}
        initialView={entityModal.view}
      />
    </>
  );
}
