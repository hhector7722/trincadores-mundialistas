"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { fetchMatchLineupsStatusAction } from "@/actions/lineup";
import { Pencil, Plus } from "lucide-react";
import { LiveMatchHeaderLabel } from "@/components/live/LiveMatchHeaderLabel";
import { LiveMatchPanelContent } from "@/components/live/LiveMatchPanelContent";
import {
  buildLineupView,
  buildMvpView,
  buildPossibleLineupsView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import {
  HOME_CARD_ACTIONS_STACKED_CLASS,
  HOME_CARD_HEADER_CLASS,
  HOME_CARD_TEAMS_BLOCK_CLASS,
  MatchTeamsDisplay,
} from "@/components/matches/MatchTeamsDisplay";
import { MatchPredictionsBoardModal } from "@/components/predictions/MatchPredictionsBoardModal";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import {
  lineupsActionCaption,
  lineupsModalTitle,
} from "@/lib/lineup/lineups-modal-copy";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { formatListScore } from "@/lib/predictions/edit-state";
import {
  mergeMvpIntoMatch,
  mvpSnapshotFromMatch,
  type MvpSnapshot,
} from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeMatchCardProps = {
  poolId: string;
  match: MatchWithPrediction;
  mode: "live" | "scheduled";
  currentProfileId: string;
  onOpenChange?: (open: boolean) => void;
  teamsBlockClassName?: string;
};

function hasSavedPrediction(match: MatchWithPrediction): boolean {
  const home = match.prediction?.home_goals ?? null;
  const away = match.prediction?.away_goals ?? null;
  return home !== null && away !== null && Number.isInteger(home) && Number.isInteger(away);
}

export function HomeMatchCard({
  poolId,
  match,
  mode,
  currentProfileId,
  onOpenChange,
  teamsBlockClassName = HOME_CARD_TEAMS_BLOCK_CLASS,
}: HomeMatchCardProps) {
  const isLive = mode === "live";
  const [scoreModalOpen, setScoreModalOpen] = useState(false);
  const [predictionsBoardOpen, setPredictionsBoardOpen] = useState(false);
  const [mvpSnapshot, setMvpSnapshot] = useState<MvpSnapshot | null>(() => mvpSnapshotFromMatch(match));
  const [entityModal, setEntityModal] = useState<{ open: boolean; view: EntityModalView }>({
    open: false,
    view: buildLineupView(match.home_team),
  });
  const [bothConfirmed, setBothConfirmed] = useState(false);
  const { snapshot: liveSnapshot } = useMatchLiveSnapshot(match.id, isLive);

  const displayMatch = useMemo(
    () => mergeMvpIntoMatch(match, mvpSnapshot),
    [match, mvpSnapshot],
  );

  const lineupsCaption = lineupsActionCaption({ bothConfirmed, isLive });
  const lineupsTitle = lineupsModalTitle({ bothConfirmed, isLive });

  useEffect(() => {
    setMvpSnapshot(mvpSnapshotFromMatch(match));
  }, [match.id, match.mvpPrediction?.player_name, match.mvpPrediction?.updated_at]);

  useEffect(() => {
    let cancelled = false;
    void fetchMatchLineupsStatusAction(match.id, match.home_team, match.away_team).then((result) => {
      if (cancelled || !result.ok) return;
      setBothConfirmed(result.data.bothConfirmed);
    });
    return () => {
      cancelled = true;
    };
  }, [match.id, match.home_team, match.away_team]);

  useEffect(() => {
    onOpenChange?.(scoreModalOpen || entityModal.open || predictionsBoardOpen);
  }, [scoreModalOpen, entityModal.open, predictionsBoardOpen, onOpenChange]);

  const saved = hasSavedPrediction(displayMatch);
  const scoreText = formatListScore(
    displayMatch.prediction?.home_goals ?? null,
    displayMatch.prediction?.away_goals ?? null,
  );

  function openEntityModal(view: EntityModalView) {
    setScoreModalOpen(false);
    setEntityModal({ open: true, view });
  }

  function openScoreModal() {
    if (isLive) {
      setEntityModal((current) => ({ ...current, open: false }));
      setScoreModalOpen(true);
      return;
    }
    setEntityModal((current) => ({ ...current, open: false }));
    setScoreModalOpen(true);
  }

  function handleMvpSaved(playerName: string, teamName: string, shirtNumber?: number | null) {
    setMvpSnapshot({
      player_name: playerName,
      team_name: teamName,
      shirt_number: shirtNumber ?? null,
    });
  }

  return (
    <>
      <div className={HOME_CARD_HEADER_CLASS}>
        {isLive ? (
          <LiveMatchHeaderLabel className="relative z-10" />
        ) : (
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-accent)]">
            Proximo partido
          </p>
        )}
        <Link
          href="/predictions"
          className="relative z-10 text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--tm-accent)] transition-opacity hover:opacity-80"
        >
          Ver todos
        </Link>
        {isLive ? (
          <button
            type="button"
            onClick={() => setPredictionsBoardOpen(true)}
            className={cn(
              "absolute inset-x-0 z-20 mx-auto flex min-h-12 w-max items-center justify-center",
              "font-semibold uppercase tracking-[0.12em] text-[var(--tm-live)]",
              "text-[8px] transition-opacity hover:opacity-80",
            )}
          >
            Ver pronósticos
          </button>
        ) : null}
      </div>

      <div className="cursor-pointer" onClick={() => openScoreModal()}>
        {isLive ? (
          <LiveMatchPanelContent
            homeTeam={displayMatch.home_team}
            awayTeam={displayMatch.away_team}
            liveSnapshot={liveSnapshot}
            predictionScoreText={saved ? scoreText : null}
            mvpPlayerName={displayMatch.mvpPrediction?.player_name ?? null}
            mvpTeamName={displayMatch.mvpPrediction?.team_name ?? null}
            lineupsCaption={lineupsCaption}
            teamsBlockClassName={teamsBlockClassName}
            onOpenHomeLineup={() =>
              openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
            }
            onOpenAwayLineup={() =>
              openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
            }
            onOpenLineups={() => openEntityModal(buildPossibleLineupsView(displayMatch))}
          />
        ) : (
        <div className={teamsBlockClassName}>
          <MatchTeamsDisplay
            homeTeam={displayMatch.home_team}
            awayTeam={displayMatch.away_team}
            kickoffAt={displayMatch.kickoff_at}
            isLive={false}
            teamBlocksTopClass="top-1.5"
            onHomeTeamClick={() =>
              openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
            }
            onAwayTeamClick={() =>
              openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
            }
            centerSlotAlign={saved ? "teamNames" : "teamNames"}
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
                    "transition-opacity hover:opacity-90 active:opacity-80",
                  )}
                >
                  <Plus className="mr-0.5 h-2.5 w-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                  Añadir
                </button>
              )
            }
          />

          <div
            className={cn(
              "absolute inset-x-0 bottom-0 overflow-hidden",
              HOME_CARD_ACTIONS_STACKED_CLASS,
            )}
            onClick={(event) => event.stopPropagation()}
          >
            <MatchContextActionsRow
              compact
              layout="homeCardStacked"
              homeAnchor="15%"
              awayAnchor="85%"
              className="h-full"
              centerSlot={
                <MvpPredictionButton
                  savedPlayerName={displayMatch.mvpPrediction?.player_name}
                  onClick={() => openEntityModal(buildMvpView(poolId, displayMatch))}
                  variant="compact"
                  className="w-full"
                />
              }
              onOpenHomeLineup={() =>
                openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
              }
              onOpenAwayLineup={() =>
                openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
              }
              possibleLineupsCaption={lineupsCaption}
              possibleLineupsConfirmed={bothConfirmed}
              onOpenPossibleLineups={() =>
                openEntityModal(buildPossibleLineupsView(displayMatch))
              }
            />
          </div>
        </div>
        )}
      </div>

      <QuickPredictionModal
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        poolId={poolId}
        match={displayMatch}
        onMvpSaved={(_matchId, playerName, teamName, shirtNumber) =>
          handleMvpSaved(playerName, teamName, shirtNumber)
        }
      />

      <EntityModalController
        open={entityModal.open}
        onClose={() => setEntityModal((current) => ({ ...current, open: false }))}
        initialView={entityModal.view}
        carouselTeams={[displayMatch.home_team, displayMatch.away_team]}
        onMvpSaved={handleMvpSaved}
        possibleLineupsTitleOverride={lineupsTitle}
        possibleLineupsConfirmedOverride={!isLive && bothConfirmed}
        matchIsLive={isLive}
      />

      {isLive ? (
        <MatchPredictionsBoardModal
          open={predictionsBoardOpen}
          onClose={() => setPredictionsBoardOpen(false)}
          poolId={poolId}
          matchId={displayMatch.id}
          homeTeam={displayMatch.home_team}
          awayTeam={displayMatch.away_team}
          currentProfileId={currentProfileId}
        />
      ) : null}
    </>
  );
}
