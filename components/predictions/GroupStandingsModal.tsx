"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { buildLineupView } from "@/components/lineup/EntityModalController";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { GroupStandingsTable } from "@/components/predictions/group-standings-table";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import {
  LINEUP_MODAL_PANEL_CLASS,
  LINEUP_MODAL_PANEL_HOST_CLASS,
  LINEUP_MODAL_WRAPPER_CLASS,
  PLAYER_MODAL_PANEL_CLASS,
  PLAYER_MODAL_PANEL_HOST_CLASS,
  PLAYER_MODAL_WRAPPER_CLASS,
} from "@/lib/lineup/field-asset";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";
import { cn } from "@/lib/utils";

type GroupStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  groupCode: string | null;
  groups: GroupStandingDetail[];
  onGroupChange?: (groupCode: string) => void;
};

type DotPosition = "start" | "middle" | "end";

type GroupPanelView =
  | { kind: "standings"; group: GroupStandingDetail }
  | EntityModalView;

type GroupSlideState = {
  target: GroupStandingDetail;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

function resolveDotPosition(index: number, total: number): DotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

function GroupSwipeDots({ position }: { position: DotPosition }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => {
        const active =
          (position === "start" && dot === 0) ||
          (position === "middle" && dot === 1) ||
          (position === "end" && dot === 2);

        return (
          <span
            key={dot}
            className={cn(
              "rounded-full transition-all duration-200",
              active ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/35"
            )}
          />
        );
      })}
    </div>
  );
}

function groupPanelTitle(view: GroupPanelView, lineupFormation?: string): ReactNode {
  if (view.kind === "standings") return `Grupo ${view.group.code}`;
  return entityModalTitleContent(view, {
    lineupFormation: view.kind === "lineup" ? lineupFormation : undefined,
  });
}

export function GroupStandingsModal({
  open,
  onClose,
  groupCode,
  groups,
  onGroupChange,
}: GroupStandingsModalProps) {
  const orderedGroups = useMemo(() => groups, [groups]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [groupSlide, setGroupSlide] = useState<GroupSlideState | null>(null);
  const groupSlideLockRef = useRef(false);
  const groupSlideTimerRef = useRef<number | null>(null);
  const onGroupChangeRef = useRef(onGroupChange);
  const wasOpenRef = useRef(false);

  const [lineupFormation, setLineupFormation] = useState<string | undefined>();
  const viewGroup = orderedGroups[activeIndex] ?? null;
  const canSwipeGroups = orderedGroups.length > 1 && Boolean(onGroupChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedGroups.length);

  onGroupChangeRef.current = onGroupChange;

  const {
    current: panelView,
    canGoBack,
    push,
    pop,
    reset,
    replaceCurrent,
    isSliding: isPanelSliding,
    buildPanelSlide,
  } = usePanelSlideStack<GroupPanelView>({
    kind: "standings",
    group: viewGroup ?? groups[0] ?? { code: "?", teams: [] },
  });

  const atStandingsRoot = panelView.kind === "standings";
  const atLineupCarousel = panelView.kind === "lineup";

  const groupTeamNames = useMemo(
    () => viewGroup?.teams.map((row) => row.team) ?? [],
    [viewGroup]
  );
  const lineupTeamName = panelView.kind === "lineup" ? panelView.teamName : groupTeamNames[0] ?? "";

  useEffect(() => {
    if (panelView.kind === "lineup") {
      setLineupFormation(undefined);
    }
  }, [lineupTeamName, panelView.kind]);

  const {
    activeIndex: teamCarouselIndex,
    canSwipe: canSwipeTeams,
    startSlide: startTeamSlide,
    buildCarouselPanelSlide: buildTeamCarouselSlide,
    isCarouselSliding,
  } = useCarouselSlide({
    items: groupTeamNames,
    open,
    initialItemKey: lineupTeamName,
    getItemKey: (team) => team,
    enabled: groupTeamNames.length > 1,
    canSlide: atLineupCarousel && !isPanelSliding && !groupSlide,
    onItemChange: (teamName) => {
      replaceCurrent(buildLineupView(teamName));
    },
  });

  useEffect(() => {
    if (viewGroup) {
      reset({ kind: "standings", group: viewGroup });
    }
  }, [viewGroup?.code, reset, viewGroup]);

  const clearGroupSlideTimer = useCallback(() => {
    if (groupSlideTimerRef.current !== null) {
      window.clearTimeout(groupSlideTimerRef.current);
      groupSlideTimerRef.current = null;
    }
  }, []);

  const finishGroupSlide = useCallback(() => {
    clearGroupSlideTimer();
    if (!groupSlideLockRef.current) return;
    groupSlideLockRef.current = false;

    setGroupSlide((current) => {
      if (!current) return null;
      const nextIndex = orderedGroups.findIndex((item) => item.code === current.target.code);
      if (nextIndex >= 0) setActiveIndex(nextIndex);
      onGroupChangeRef.current?.(current.target.code);
      return null;
    });
  }, [clearGroupSlideTimer, orderedGroups]);

  const finishGroupSlideRef = useRef(finishGroupSlide);
  finishGroupSlideRef.current = finishGroupSlide;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearGroupSlideTimer();
      groupSlideLockRef.current = false;
      setGroupSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = groupCode
        ? orderedGroups.findIndex((item) => item.code === groupCode.toUpperCase())
        : 0;
      setActiveIndex(idx >= 0 ? idx : 0);
      setGroupSlide(null);
      groupSlideLockRef.current = false;
    }
  }, [open, groupCode, orderedGroups, clearGroupSlideTimer]);

  useEffect(() => () => clearGroupSlideTimer(), [clearGroupSlideTimer]);

  const startGroupSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipeGroups || groupSlideLockRef.current || !atStandingsRoot || isPanelSliding) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= orderedGroups.length) return;
      const target = orderedGroups[nextIndex];
      if (!target) return;

      clearGroupSlideTimer();
      groupSlideLockRef.current = true;
      setGroupSlide({ target, direction: offset === 1 ? "next" : "prev", phase: "prep" });

      groupSlideTimerRef.current = window.setTimeout(() => {
        finishGroupSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setGroupSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [
      activeIndex,
      atStandingsRoot,
      canSwipeGroups,
      clearGroupSlideTimer,
      isPanelSliding,
      orderedGroups,
    ]
  );

  function renderPanelView(view: GroupPanelView) {
    if (view.kind === "standings") {
      return (
        <GroupStandingsTable
          group={view.group}
          onTeamClick={(teamName) => push(buildLineupView(teamName))}
        />
      );
    }

    if (view.kind === "lineup") {
      return (
        <LineupModalPanel
          teamName={view.teamName}
          onFormationResolved={setLineupFormation}
          onPlayerClick={(playerName) =>
            push({ kind: "player", teamName: view.teamName, playerName })
          }
        />
      );
    }

    if (view.kind === "player") {
      return <PlayerDetailPanel teamName={view.teamName} playerName={view.playerName} />;
    }

    return null;
  }

  if (!viewGroup) return null;

  const entityPanelSlide = buildPanelSlide(renderPanelView);

  const teamCarouselSlide =
    atLineupCarousel && !entityPanelSlide
      ? buildTeamCarouselSlide((teamName) =>
          renderPanelView(buildLineupView(teamName))
        )
      : null;

  const groupPanelSlide: ModalPanelSlide | null =
    groupSlide && atStandingsRoot && !entityPanelSlide
      ? {
          direction: groupSlide.direction,
          phase: groupSlide.phase,
          incoming: (
            <GroupStandingsTable
              group={groupSlide.target}
              onTeamClick={(teamName) => push(buildLineupView(teamName))}
            />
          ),
          onTransitionEnd: () => finishGroupSlideRef.current(),
        }
      : null;

  const activePanelSlide = entityPanelSlide ?? teamCarouselSlide ?? groupPanelSlide;
  const isLineupView = panelView.kind === "lineup";
  const isPlayerView = panelView.kind === "player";
  const isCompactModal = isLineupView || isPlayerView;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={groupPanelTitle(panelView, lineupFormation)}
      hideHeaderDivider
      headerCompact={isCompactModal}
      scrollContent={!isCompactModal}
      className={cn(
        isLineupView && cn(LINEUP_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPlayerView && cn(PLAYER_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]")
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
        isPlayerView && PLAYER_MODAL_WRAPPER_CLASS
      )}
      containerClassName={isCompactModal ? "p-1.5" : undefined}
      opaque
      onSwipeLeft={
        canSwipeGroups && atStandingsRoot && !activePanelSlide
          ? () => startGroupSlide(1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(1)
            : undefined
      }
      onSwipeRight={
        canSwipeGroups && atStandingsRoot && !activePanelSlide
          ? () => startGroupSlide(-1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(-1)
            : undefined
      }
      belowPanel={
        canSwipeGroups && atStandingsRoot ? (
          <GroupSwipeDots position={dotPosition} />
        ) : canSwipeTeams && atLineupCarousel ? (
          <CarouselSwipeDots activeIndex={teamCarouselIndex} total={groupTeamNames.length} />
        ) : undefined
      }
      onBack={canGoBack && !isPanelSliding && !isCarouselSliding ? pop : undefined}
      panelSlide={activePanelSlide}
    >
      {renderPanelView(panelView)}
    </Modal>
  );
}
