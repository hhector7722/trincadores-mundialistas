"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MvpPredictionPanel } from "@/components/lineup/MvpPredictionPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { LINEUP_MODAL_WRAPPER_CLASS } from "@/lib/lineup/field-asset";
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
};

function renderEntityView(
  view: EntityModalView,
  handlers: {
    onPlayerClick: (teamName: string, playerName: string) => void;
    onMvpSaved?: (playerName: string, teamName: string) => void;
  },
  playerPickMode: PlayerPickMode
) {
  switch (view.kind) {
    case "lineup":
      return (
        <LineupModalPanel
          teamName={view.teamName}
          matchId={view.matchId}
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
}: EntityModalControllerProps) {
  const { current, canGoBack, push, pop, reset, isSliding, buildPanelSlide } =
    usePanelSlideStack<EntityModalView>(initialView);

  const atLineupRoot = current.kind === "lineup" && !canGoBack;
  const carouselTeamName = current.kind === "lineup" ? current.teamName : initialView.kind === "lineup" ? initialView.teamName : "";

  const {
    dotPosition,
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
    canSlide: atLineupRoot && !isSliding,
    onItemChange: (teamName) => {
      reset(buildLineupView(teamName));
      onCarouselTeamChange?.(teamName);
    },
  });

  useEffect(() => {
    if (open) {
      reset(initialView);
    }
  }, [open, initialView, reset]);

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
      },
      playerPickMode
    );

  const panelSlide = buildPanelSlide(renderView);

  const teamCarouselSlide =
    atLineupRoot && !panelSlide
      ? buildCarouselPanelSlide((teamName) => renderView(buildLineupView(teamName)))
      : null;

  const activePanelSlide = panelSlide ?? teamCarouselSlide;
  const isFieldView = current.kind === "lineup" || current.kind === "mvp";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entityModalTitleContent(current)}
      hideHeaderDivider
      headerTitleAlign={current.kind === "mvp" ? "left" : "center"}
      className={cn(isFieldView && "max-h-[calc(100dvh-1rem)]", className)}
      wrapperClassName={cn(isFieldView && LINEUP_MODAL_WRAPPER_CLASS, wrapperClassName)}
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onSwipeLeft={
        canSwipeTeams && atLineupRoot && !activePanelSlide ? () => startTeamSlide(1) : undefined
      }
      onSwipeRight={
        canSwipeTeams && atLineupRoot && !activePanelSlide ? () => startTeamSlide(-1) : undefined
      }
      belowPanel={canSwipeTeams && atLineupRoot ? <CarouselSwipeDots position={dotPosition} /> : undefined}
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
