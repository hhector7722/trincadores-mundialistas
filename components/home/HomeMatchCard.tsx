"use client";

import Link from "next/link";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
import { HomeSquadFooterLink, MatchAddPillButton } from "@/components/lineup/MatchContextActionButton";
import { HomeFinishedMatchPanel } from "@/components/home/HomeFinishedMatchPanel";
import {
  HOME_CARD_HEADER_CLASS,
  HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
  HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
  HOME_CARD_SCHEDULED_MI_PRONOSTICO_TOP_CLASS,
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
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { formatListScore } from "@/lib/predictions/edit-state";
import {
  mergeMvpIntoMatch,
  mvpSnapshotFromMatch,
  type MvpSnapshot,
} from "@/lib/predictions/mvp-match-state";
import type { MatchPredictionsBoardCarouselMatch } from "@/lib/predictions/board-carousel";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { cn } from "@/lib/utils";

type HomeMatchCardMode = "live" | "scheduled" | "finished";
type HomeMatchSlidePosition = "last" | "center" | "right";

type HomeMatchCardProps = {
  poolId: string;
  match: MatchWithPrediction;
  mode: HomeMatchCardMode;
  slidePosition: HomeMatchSlidePosition;
  hasLiveInCarousel: boolean;
  isLatestFinished?: boolean;
  currentProfileId: string;
  boardCarouselMatches?: MatchPredictionsBoardCarouselMatch[];
  modalCarouselMatches?: MatchWithPrediction[];
  onModalMatchChange?: (match: MatchWithPrediction) => void;
  onOpenChange?: (open: boolean) => void;
  teamsBlockClassName?: string;
};

function scheduledHeaderLabel(
  slidePosition: HomeMatchSlidePosition,
  hasLiveInCarousel: boolean,
): string {
  if (slidePosition === "center") return "Proximo partido";
  return hasLiveInCarousel ? "Próximo partido" : "Próximos partidos";
}

const SCHEDULED_SCORE_EDIT_GAP_PX = 10;

const HOME_PREDICTIONS_BOARD_BUTTON_CLASS = cn(
  "absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2",
  "inline-flex h-auto w-max shrink-0 items-center justify-center",
  "rounded-full bg-[#CCFF00] px-[clamp(6px,2.1cqw,8px)] py-[clamp(2px,1cqw,3px)]",
  "text-[8px] font-bold uppercase leading-none tracking-[0.12em] text-black",
  "transition-opacity hover:opacity-90 active:opacity-80"
);

/** Marcador centrado en el ancho de la card; el lápiz no desplaza el centro. */
function HomeScheduledPredictionScore({
  scoreText,
  onEdit,
}: {
  scoreText: string;
  onEdit: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const labelRef = useRef<HTMLSpanElement>(null);
  const [editIconPos, setEditIconPos] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const update = () => {
      const label = labelRef.current;
      const container = containerRef.current;
      if (!label || !container) return;

      const labelRect = label.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();
      setEditIconPos({
        left: labelRect.right - containerRect.left + SCHEDULED_SCORE_EDIT_GAP_PX,
        top: labelRect.top - containerRect.top + labelRect.height / 2,
      });
    };

    update();

    const label = labelRef.current;
    if (!label) return;

    const observer = new ResizeObserver(update);
    observer.observe(label);
    if (containerRef.current) observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [scoreText]);

  return (
    <div ref={containerRef} className="relative w-full leading-none">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="block w-full text-center font-display text-[11px] font-semibold normal-case text-[var(--tm-accent)] transition-opacity hover:opacity-80"
      >
        <span ref={labelRef} className="inline-block whitespace-nowrap">
          {scoreText}
        </span>
      </button>
      {editIconPos != null ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onEdit();
          }}
          aria-label="Editar pronóstico"
          className="absolute flex -translate-y-1/2 items-center text-[var(--tm-accent)] transition-opacity hover:opacity-80"
          style={{ left: editIconPos.left, top: editIconPos.top }}
        >
          <Pencil className="h-3 w-3 shrink-0" strokeWidth={2} aria-hidden="true" />
        </button>
      ) : null}
    </div>
  );
}

function hasSavedPrediction(match: MatchWithPrediction): boolean {
  const home = match.prediction?.home_goals ?? null;
  const away = match.prediction?.away_goals ?? null;
  return home !== null && away !== null && Number.isInteger(home) && Number.isInteger(away);
}

function hasSavedMvp(match: MatchWithPrediction): boolean {
  return Boolean(match.mvpPrediction?.player_name?.trim());
}

export function HomeMatchCard({
  poolId,
  match,
  mode,
  slidePosition,
  hasLiveInCarousel,
  isLatestFinished = true,
  currentProfileId,
  boardCarouselMatches = [],
  modalCarouselMatches,
  onModalMatchChange,
  onOpenChange,
  teamsBlockClassName = HOME_CARD_TEAMS_BLOCK_CLASS,
}: HomeMatchCardProps) {
  const isLive = mode === "live";
  const isFinished = mode === "finished";
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
  const savedMvp = hasSavedMvp(displayMatch);
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
      <div className="relative">
      <div className={HOME_CARD_HEADER_CLASS}>
        {isLive ? (
          <LiveMatchHeaderLabel
            className="relative z-10"
            minuteLabel={liveSnapshot?.minuteLabel}
          />
        ) : isFinished ? (
          isLatestFinished ? (
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-accent)]">
              Último partido
            </p>
          ) : (
            <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-accent)]">
              Finalizado
            </p>
          )
        ) : (
          <p className="text-[8px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-accent)]">
            {scheduledHeaderLabel(slidePosition, hasLiveInCarousel)}
          </p>
        )}
        <Link
          href="/predictions"
          className="relative z-10 text-[8px] font-medium uppercase tracking-[0.12em] text-[var(--tm-accent)] transition-opacity hover:opacity-80"
        >
          Ver todos
        </Link>
        {isLive || isFinished ? (
          <button
            type="button"
            onClick={() => setPredictionsBoardOpen(true)}
            className={HOME_PREDICTIONS_BOARD_BUTTON_CLASS}
          >
            Ver pronósticos
          </button>
        ) : (
          <p
            className={cn(
              "pointer-events-none absolute inset-x-0 z-20 mx-auto flex items-center justify-center",
              "text-center font-display text-[10px] font-semibold leading-tight text-[var(--tm-accent)] sm:text-xs",
            )}
          >
            {formatKickoff(displayMatch.kickoff_at)}
          </p>
        )}
      </div>

      {isLive ? (
      <div className="cursor-pointer" onClick={() => openScoreModal()}>
          <LiveMatchPanelContent
            homeTeam={displayMatch.home_team}
            awayTeam={displayMatch.away_team}
            liveSnapshot={liveSnapshot}
            playerIncidents={displayMatch.playerIncidents}
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
      </div>
        ) : isFinished ? (
          <div className="cursor-pointer" onClick={() => openScoreModal()}>
            <HomeFinishedMatchPanel
              match={displayMatch}
              teamsBlockClassName={teamsBlockClassName}
              onOpenHomeLineup={() =>
                openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
              }
              onOpenAwayLineup={() =>
                openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
              }
              onOpenDetail={openScoreModal}
            />
          </div>
        ) : (
      <div className="cursor-pointer" onClick={() => openScoreModal()}>
        <div className={teamsBlockClassName}>
          <MatchTeamsDisplay
            homeTeam={displayMatch.home_team}
            awayTeam={displayMatch.away_team}
            kickoffAt={displayMatch.kickoff_at}
            isLive={false}
            hideKickoff
            compactTeamColumn
            teamBlocksTopClass="top-0"
            homeFooterSlot={
              <HomeSquadFooterLink
                onClick={() =>
                  openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
                }
              />
            }
            awayFooterSlot={
              <HomeSquadFooterLink
                onClick={() =>
                  openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
                }
              />
            }
            onHomeTeamClick={() =>
              openEntityModal(buildLineupView(displayMatch.home_team, displayMatch.id))
            }
            onAwayTeamClick={() =>
              openEntityModal(buildLineupView(displayMatch.away_team, displayMatch.id))
            }
          />

        <div
          className={cn(
            "absolute inset-x-0 pointer-events-none",
            HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS,
            HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS,
          )}
        >
          <MatchContextActionsRow
            compact
            layout="homeCardScheduledStacked"
            homeAnchor="15%"
            awayAnchor="85%"
            className="pointer-events-auto h-full w-full"
              centerSlot={
                saved ? (
                  <HomeScheduledPredictionScore
                    scoreText={scoreText}
                    onEdit={openScoreModal}
                  />
                ) : (
                  <div className="flex w-full justify-center">
                    <MatchAddPillButton onClick={openScoreModal}>
                      <Plus className="mr-0.5 h-2.5 w-2.5 shrink-0" strokeWidth={2.5} aria-hidden="true" />
                      Añadir pronóstico
                    </MatchAddPillButton>
                  </div>
                )
              }
              predictionSlot={
                saved ? (
                  <MvpPredictionButton
                    savedPlayerName={displayMatch.mvpPrediction?.player_name}
                    onClick={() => openEntityModal(buildMvpView(poolId, displayMatch))}
                    variant="compact"
                    showEdit={false}
                    className="w-full"
                  />
                ) : null
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
      </div>
        )}
      {!isLive && !isFinished && saved && !savedMvp ? (
        <p
          className={cn(
            "pointer-events-none absolute left-1/2 z-30 -translate-x-1/2 -translate-y-1/2",
            "text-center text-[8px] font-semibold uppercase leading-none tracking-wider text-white/60",
            HOME_CARD_SCHEDULED_MI_PRONOSTICO_TOP_CLASS,
          )}
        >
          Mi pronóstico
        </p>
      ) : null}
      </div>

      <QuickPredictionModal
        open={scoreModalOpen}
        onClose={() => setScoreModalOpen(false)}
        poolId={poolId}
        match={displayMatch}
        matches={modalCarouselMatches}
        onMatchChange={onModalMatchChange}
        currentProfileId={currentProfileId}
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

      {isLive || isFinished ? (
        <MatchPredictionsBoardModal
          open={predictionsBoardOpen}
          onClose={() => setPredictionsBoardOpen(false)}
          poolId={poolId}
          matchId={displayMatch.id}
          homeTeam={displayMatch.home_team}
          awayTeam={displayMatch.away_team}
          currentProfileId={currentProfileId}
          carouselMatches={boardCarouselMatches}
        />
      ) : null}
    </>
  );
}
