"use client";

import { useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MvpPredictionPanel } from "@/components/lineup/MvpPredictionPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { LINEUP_MODAL_WRAPPER_CLASS } from "@/lib/lineup/field-asset";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
import { cn } from "@/lib/utils";

type EntityModalControllerProps = {
  open: boolean;
  onClose: () => void;
  initialView: EntityModalView;
  className?: string;
  wrapperClassName?: string;
};

function renderEntityView(
  view: EntityModalView,
  handlers: {
    onPlayerClick: (teamName: string, playerName: string) => void;
    onMvpSaved?: (playerName: string, teamName: string) => void;
  }
) {
  switch (view.kind) {
    case "lineup":
      return (
        <LineupModalPanel
          teamName={view.teamName}
          onPlayerClick={(playerName) => handlers.onPlayerClick(view.teamName, playerName)}
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
}: EntityModalControllerProps) {
  const { current, canGoBack, push, pop, reset, isSliding, buildPanelSlide } =
    usePanelSlideStack<EntityModalView>(initialView);

  useEffect(() => {
    if (open) {
      reset(initialView);
    }
  }, [open, initialView, reset]);

  function handlePlayerClick(teamName: string, playerName: string) {
    push({ kind: "player", teamName, playerName });
  }

  const panelSlide = buildPanelSlide((view) =>
    renderEntityView(view, {
      onPlayerClick: handlePlayerClick,
    })
  );

  const isLineupView = current.kind === "lineup";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entityModalTitleContent(current)}
      hideHeaderDivider
      headerTitleAlign={current.kind === "mvp" ? "left" : "default"}
      className={cn(isLineupView && "max-h-[calc(100dvh-1rem)]", className)}
      wrapperClassName={cn(isLineupView && LINEUP_MODAL_WRAPPER_CLASS, wrapperClassName)}
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onBack={canGoBack && !isSliding ? pop : undefined}
      panelSlide={panelSlide}
    >
      {renderEntityView(current, {
        onPlayerClick: handlePlayerClick,
      })}
    </Modal>
  );
}

export function buildLineupView(teamName: string): EntityModalView {
  return { kind: "lineup", teamName };
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
