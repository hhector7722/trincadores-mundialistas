"use client";

import { useEffect, useState } from "react";
import { Modal } from "@/components/ui/modal";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MvpPredictionPanel } from "@/components/lineup/MvpPredictionPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import {
  entityModalTitleContent,
  type MvpModalFormations,
} from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import {
  LINEUP_MODAL_PANEL_CLASS,
  LINEUP_MODAL_PANEL_HOST_CLASS,
  LINEUP_MODAL_WRAPPER_CLASS,
  MVP_MODAL_WRAPPER_CLASS,
  PLAYER_MODAL_PANEL_CLASS,
  PLAYER_MODAL_PANEL_HOST_CLASS,
  PLAYER_MODAL_WRAPPER_CLASS,
} from "@/lib/lineup/field-asset";
import { isGoalkeeperPosition } from "@/lib/lineup/position-map";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
import { cn } from "@/lib/utils";

export type PlayerPickMode = "none" | "any" | "goalkeeper";

type EntityModalControllerProps = {
  open: boolean;
  onClose: () => void;
  initialView: EntityModalView;
  className?: string;
  wrapperClassName?: string;
  playerPickMode?: PlayerPickMode;
  onPlayerPicked?: (teamName: string, playerName: string) => void;
  /** Lista ordenada para deslizar entre alineaciones (solo en vista lineup raíz). */
  carouselTeams?: string[];
  onCarouselTeamChange?: (teamName: string) => void;
  onMvpSaved?: (playerName: string, teamName: string) => void;
};

function renderEntityView(
  view: EntityModalView,
  handlers: {
    onPlayerClick: (teamName: string, playerName: string) => void;
    onMvpSaved?: (playerName: string, teamName: string) => void;
    onMvpFormationsChange?: (awayFormation?: string, homeFormation?: string) => void;
    onFormationResolved?: (formationLabel: string) => void;
  },
  playerPickMode: PlayerPickMode
) {
  switch (view.kind) {
    case "lineup":
      return (
        <LineupModalPanel
          teamName={view.teamName}
          matchId={view.matchId}
          onFormationResolved={handlers.onFormationResolved}
          onPlayerClick={(playerName) => handlers.onPlayerClick(view.teamName, playerName)}
          selectionMode={playerPickMode === "none" ? "navigate" : "pick"}
          playerFilter={
            playerPickMode === "goalkeeper"
              ? (position) => isGoalkeeperPosition(position)
              : playerPickMode === "any"
                ? () => true
                : undefined
          }
          selectionBlockedMessage={
            playerPickMode === "goalkeeper"
              ? "Solo puedes elegir un portero."
              : playerPickMode === "any"
                ? "Pulsa un jugador para seleccionarlo."
                : undefined
          }
        />
      );
    case "player":
      return <PlayerDetailPanel teamName={view.teamName} playerName={view.playerName} />;
    case "mvp":
      return (
        <MvpPredictionPanel
          poolId={view.poolId}
          matchId={view.matchId}
          homeTeam={view.homeTeam}
          awayTeam={view.awayTeam}
          serverEditable={view.serverEditable}
          savedPlayerName={view.savedPlayerName}
          savedTeamName={view.savedTeamName}
          onSaved={handlers.onMvpSaved}
          onFormationsChange={handlers.onMvpFormationsChange}
        />
      );
    case "possible-lineups":
      return (
        <MvpPredictionPanel
          matchId={view.matchId}
          homeTeam={view.homeTeam}
          awayTeam={view.awayTeam}
          serverEditable={false}
          preview
          onFormationsChange={handlers.onMvpFormationsChange}
        />
      );
    default:
      return null;
  }
}

export function EntityModalController({
  open,
  onClose,
  initialView,
  className,
  wrapperClassName,
  playerPickMode = "none",
  onPlayerPicked,
  carouselTeams,
  onCarouselTeamChange,
  onMvpSaved,
}: EntityModalControllerProps) {
  const [mvpFormations, setMvpFormations] = useState<MvpModalFormations>({});
  const [lineupFormation, setLineupFormation] = useState<string | undefined>();
  const { current, canGoBack, push, pop, reset, isSliding, buildPanelSlide } =
    usePanelSlideStack<EntityModalView>(initialView);

  const lineupTeamName = current.kind === "lineup" ? current.teamName : null;

  const atLineupCarousel = current.kind === "lineup";
  const lineupMatchId =
    current.kind === "lineup"
      ? current.matchId
      : initialView.kind === "lineup"
        ? initialView.matchId
        : undefined;
  const carouselTeamName =
    current.kind === "lineup"
      ? current.teamName
      : initialView.kind === "lineup"
        ? initialView.teamName
        : "";

  const {
    activeIndex: teamCarouselIndex,
    canSwipe: canSwipeTeams,
    startSlide: startTeamSlide,
    buildCarouselPanelSlide,
    isCarouselSliding,
  } = useCarouselSlide({
    items: carouselTeams ?? [],
    open,
    initialItemKey: carouselTeamName,
    getItemKey: (team) => team,
    enabled: Boolean(carouselTeams?.length),
    canSlide: atLineupCarousel && !isSliding,
    onItemChange: (teamName) => {
      reset(buildLineupView(teamName, lineupMatchId));
      onCarouselTeamChange?.(teamName);
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialView);
      setMvpFormations({});
      setLineupFormation(undefined);
    }
  }, [open, initialView, reset]);

  useEffect(() => {
    if (lineupTeamName) {
      setLineupFormation(undefined);
    }
  }, [lineupTeamName]);

  function handlePlayerClick(teamName: string, playerName: string) {
    if (playerPickMode !== "none" && onPlayerPicked) {
      onPlayerPicked(teamName, playerName);
      onClose();
      return;
    }
    push({ kind: "player", teamName, playerName });
  }

  const renderView = (view: EntityModalView) =>
    renderEntityView(
      view,
      {
        onPlayerClick: handlePlayerClick,
        onMvpSaved,
        onMvpFormationsChange: (awayFormation, homeFormation) =>
          setMvpFormations({ awayFormation, homeFormation }),
        onFormationResolved: setLineupFormation,
      },
      playerPickMode
    );

  const panelSlide = buildPanelSlide(renderView);

  const teamCarouselSlide =
    atLineupCarousel && !panelSlide
      ? buildCarouselPanelSlide((teamName) =>
          renderView(buildLineupView(teamName, lineupMatchId))
        )
      : null;

  const activePanelSlide = panelSlide ?? teamCarouselSlide;
  const isLineupView = current.kind === "lineup";
  const isMvpView = current.kind === "mvp";
  const isPossibleLineupsView = current.kind === "possible-lineups";
  const isPlayerView = current.kind === "player";
  const isFieldView = isLineupView || isMvpView || isPossibleLineupsView;
  const isCompactModal = isFieldView || isPlayerView;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entityModalTitleContent(current, {
        mvpFormations,
        lineupFormation: isLineupView ? lineupFormation : undefined,
      })}
      hideHeaderDivider
      headerTitleAlign={isMvpView || isPossibleLineupsView ? "left" : "center"}
      headerCompact={isCompactModal}
      scrollContent={!isCompactModal}
      containerClassName={
        isMvpView || isPossibleLineupsView
          ? "p-1"
          : isLineupView || isPlayerView
            ? "p-1.5"
            : undefined
      }
      className={cn(
        (isMvpView || isPossibleLineupsView) && "max-h-[calc(100dvh-0.5rem)]",
        isLineupView && cn(LINEUP_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPlayerView && cn(PLAYER_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        className
      )}
      panelHostClassName={
        isLineupView
          ? LINEUP_MODAL_PANEL_HOST_CLASS
          : isPlayerView
            ? PLAYER_MODAL_PANEL_HOST_CLASS
            : undefined
      }
      wrapperClassName={cn(
        isLineupView && LINEUP_MODAL_WRAPPER_CLASS,
        isPlayerView && PLAYER_MODAL_WRAPPER_CLASS,
        (isMvpView || isPossibleLineupsView) && MVP_MODAL_WRAPPER_CLASS,
        wrapperClassName
      )}
      backdropClassName="bg-[#2a1058]/40"
      onSwipeLeft={
        canSwipeTeams && atLineupCarousel && !activePanelSlide ? () => startTeamSlide(1) : undefined
      }
      onSwipeRight={
        canSwipeTeams && atLineupCarousel && !activePanelSlide ? () => startTeamSlide(-1) : undefined
      }
      belowPanel={
        canSwipeTeams && atLineupCarousel ? (
          <CarouselSwipeDots activeIndex={teamCarouselIndex} total={carouselTeams?.length ?? 0} />
        ) : undefined
      }
      onBack={canGoBack && !isSliding && !isCarouselSliding ? pop : undefined}
      panelSlide={activePanelSlide}
    >
      {renderView(current)}
    </Modal>
  );
}

export function buildLineupView(teamName: string, matchId?: string): EntityModalView {
  return { kind: "lineup", teamName, matchId };
}

export function buildPossibleLineupsView(match: {
  id: string;
  home_team: string;
  away_team: string;
}): EntityModalView {
  return {
    kind: "possible-lineups",
    matchId: match.id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
  };
}

export function buildMvpView(
  poolId: string,
  match: {
    id: string;
    home_team: string;
    away_team: string;
    kickoff_at: string;
    serverEditable: boolean;
    mvpPrediction?: { player_name: string; team_name: string } | null;
  }
): EntityModalView {
  return {
    kind: "mvp",
    poolId,
    matchId: match.id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffAt: match.kickoff_at,
    serverEditable: match.serverEditable,
    savedPlayerName: match.mvpPrediction?.player_name ?? null,
    savedTeamName: match.mvpPrediction?.team_name ?? null,
  };
}
