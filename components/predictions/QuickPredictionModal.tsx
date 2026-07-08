"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition, type ReactNode } from "react";
import { fetchMatchLineupsStatusAction } from "@/actions/lineup";
import { deleteMvpPrediction, saveMvpPrediction } from "@/actions/mvp-predictions";
import { savePrediction } from "@/actions/predictions";
import { setMatchLive, checkIsHector } from "@/actions/admin";
import {
  buildLineupView,
  buildMvpView,
  buildPossibleLineupsView,
} from "@/components/lineup/EntityModalController";
import { LineupModalPanel } from "@/components/lineup/LineupModalPanel";
import { MatchContextActionsRow } from "@/components/lineup/MatchContextActionsRow";
import { MvpPickPanel } from "@/components/lineup/MvpPickPanel";
import { PossibleLineupsPanel } from "@/components/lineup/PossibleLineupsPanel";
import { FinishedMatchScoreRow } from "@/components/predictions/FinishedMatchScoreRow";
import { GroupStandingsModal } from "@/components/predictions/GroupStandingsModal";
import { AiPredictionTrigger } from "@/components/predictions/AiPredictionTrigger";
import { MatchPredictionsBoardModal } from "@/components/predictions/MatchPredictionsBoardModal";
import { MvpPredictionButton } from "@/components/predictions/MvpPredictionButton";
import { PlayerDetailPanel } from "@/components/lineup/PlayerDetailPanel";
import { entityModalTitleContent } from "@/components/lineup/EntityModalTitle";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { getPendingTeamsForMatch } from "@/lib/home/pending-match-teams";
import {
  MatchTeamsDisplay,
  PREDICTION_MODAL_ACTIONS_ROW_CLASS,
  PREDICTION_MODAL_ACTIONS_STACKED_CLASS,
  PREDICTION_MODAL_LIVE_ACTIONS_TOP_CLASS,
  PREDICTION_MODAL_NAMES_BOTTOM_CLASS,
  PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS,
} from "@/components/matches/MatchTeamsDisplay";
import { PredictionDeadlineCountdown } from "@/components/predictions/PredictionDeadlineCountdown";
import { ScoreStepper } from "@/components/predictions/ScoreStepper";
import { Button } from "@/components/ui/button";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import { MatchHighlightBlock } from "@/components/highlights/MatchHighlightBlock";
import { LiveMatchHeaderLabel } from "@/components/live/LiveMatchHeaderLabel";
import { MatchGoalScorersList } from "@/components/live/MatchGoalScorersList";
import { LiveMatchScoreOverlay } from "@/components/live/LiveMatchScorePair";
import { MatchLiveStatsPanel } from "@/components/live/MatchLiveStatsPanel";
import { MatchStatsModal, MatchStatsOpenButton } from "@/components/live/MatchStatsModal";
import {
  lineupsActionCaption,
  lineupsModalTitle,
  POSSIBLE_LINEUPS_ACTION_CAPTION,
} from "@/lib/lineup/lineups-modal-copy";
import { useMatchLiveSnapshot } from "@/lib/live/use-match-live-snapshot";
import { resolveMatchGoalScorers } from "@/lib/live/goal-scorers";
import { entityModalUsageLabel, matchFixtureLabel } from "@/lib/usage/modal-labels";
import { formatListScore, hasFilledPredictionScore, resolvePredictionUiState } from "@/lib/predictions/edit-state";
import {
  mergeMvpIntoMatch,
  mvpDraftDirty,
  mvpOverridesFromMatchListAndActive,
  mvpPlayerNameFromMatch,
  preferMatchMvpData,
  type MvpSnapshot,
} from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  LINEUP_MODAL_PANEL_CLASS,
  LINEUP_MODAL_PANEL_HOST_CLASS,
  LINEUP_MODAL_WRAPPER_CLASS,
  MVP_MODAL_PICK_PANEL_CLASS,
  POSSIBLE_LINEUPS_MODAL_PANEL_CLASS,
  MVP_MODAL_WRAPPER_CLASS,
  PLAYER_MODAL_PANEL_CLASS,
  PLAYER_MODAL_PANEL_HOST_CLASS,
  PLAYER_MODAL_WRAPPER_CLASS,
} from "@/lib/lineup/field-asset";
import { buildBoardCarouselMatches } from "@/lib/predictions/board-carousel";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import {
  buildGroupStandingsDetail,
  toGroupMatchRows,
} from "@/lib/pool/group-standings";
import { usePanelSlideStack } from "@/lib/ui/use-panel-slide-stack";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";
import { cn } from "@/lib/utils";

type QuickPredictionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  match: MatchWithPrediction;
  matches?: MatchWithPrediction[];
  onMatchChange?: (match: MatchWithPrediction) => void;
  onMvpSaved?: (
    matchId: string,
    playerName: string,
    teamName: string,
    shirtNumber?: number | null
  ) => void;
  /** Panel y backdrop opacos (calendario). */
  opaque?: boolean;
  /** Círculo de bandera sin imagen: negro y negrita (eliminatoria). */
  flagPlaceholderStyle?: "default" | "knockout";
  /** Necesario para abrir el tablero de pronósticos rivales (live/finalizado). */
  currentProfileId?: string;
  /** Permite forzar el estado del partido a EN JUEGO (solo admins) */
  isAdminUser?: boolean;
};

type DotPosition = "start" | "middle" | "end";
type QuickPanelView = { kind: "prediction" } | EntityModalView;

type MatchSlideState = {
  target: MatchWithPrediction;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

function sortMatchesByKickoff(items: MatchWithPrediction[]): MatchWithPrediction[] {
  return [...items].sort(
    (a, b) => new Date(a.kickoff_at).getTime() - new Date(b.kickoff_at).getTime()
  );
}

function resolveDotPosition(index: number, total: number): DotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

function PredictionsBoardOpenButton({ onClick }: { onClick: () => void }) {
  return (
    <div className="flex justify-center">
      <Button
        type="button"
        className="!min-h-0 h-auto w-auto px-3 py-1 text-[10px] leading-none uppercase tracking-[0.12em]"
        onClick={onClick}
      >
        Ver pronósticos
      </Button>
    </div>
  );
}

function FinishedModalFooterActions({
  currentProfileId,
  onOpenPredictionsBoard,
  onOpenStats,
  highlight,
}: {
  currentProfileId?: string;
  onOpenPredictionsBoard: () => void;
  onOpenStats: () => void;
  highlight?: ReactNode;
}) {
  return (
    <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
      {currentProfileId ? (
        <PredictionsBoardOpenButton onClick={onOpenPredictionsBoard} />
      ) : null}
      <MatchStatsOpenButton
        onClick={onOpenStats}
        tone="muted"
        className={currentProfileId ? "mt-1" : undefined}
      />
      {highlight}
    </div>
  );
}

function MatchSwipeDots({ position }: { position: DotPosition }) {
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

function quickPanelTitle(
  view: QuickPanelView,
  options?: {
    lineupFormation?: string;
    possibleLineupsTitle?: string;
    possibleLineupsConfirmed?: boolean;
  },
): ReactNode {
  if (view.kind === "prediction") return "Pronóstico";
  return entityModalTitleContent(view, {
    lineupFormation: view.kind === "lineup" ? options?.lineupFormation : undefined,
    possibleLineupsTitle: view.kind === "possible-lineups" ? options?.possibleLineupsTitle : undefined,
    possibleLineupsConfirmed:
      view.kind === "possible-lineups" ? options?.possibleLineupsConfirmed : undefined,
  });
}

function quickUsageLabel(view: QuickPanelView, match: MatchWithPrediction): string {
  const fixture = matchFixtureLabel(match.home_team, match.away_team);
  if (view.kind === "prediction") return `Pronostico: ${fixture}`;
  return entityModalUsageLabel(view);
}

export function QuickPredictionModal({
  open,
  onClose,
  poolId,
  match,
  matches,
  onMatchChange,
  onMvpSaved,
  opaque = false,
  flagPlaceholderStyle = "default",
  currentProfileId,
  isAdminUser = false,
}: QuickPredictionModalProps) {
  const router = useRouter();
  const orderedMatches = useMemo(
    () => (matches && matches.length > 0 ? sortMatchesByKickoff(matches) : [match]),
    [match, matches]
  );

  const [isHector, setIsHector] = useState(false);
  const [isSettingLive, setIsSettingLive] = useState(false);

  useEffect(() => {
    checkIsHector().then(setIsHector);
  }, []);

  const [activeIndex, setActiveIndex] = useState(0);
  const [lineupFormation, setLineupFormation] = useState<string | undefined>();
  const [possibleLineupsTitle, setPossibleLineupsTitle] = useState<string | undefined>();
  const [possibleLineupsConfirmed, setPossibleLineupsConfirmed] = useState(false);
  const [possibleLineupsCaption, setPossibleLineupsCaption] = useState(
    POSSIBLE_LINEUPS_ACTION_CAPTION,
  );
  const [mvpOverrides, setMvpOverrides] = useState<Record<string, MvpSnapshot>>({});
  const [predictionsBoardOpen, setPredictionsBoardOpen] = useState(false);
  const [statsModalOpen, setStatsModalOpen] = useState(false);
  const [groupStandingsCode, setGroupStandingsCode] = useState<string | null>(null);
  const [matchSlide, setMatchSlide] = useState<MatchSlideState | null>(null);
  const matchSlideLockRef = useRef(false);
  const matchSlideTimerRef = useRef<number | null>(null);
  const onMatchChangeRef = useRef(onMatchChange);
  const wasOpenRef = useRef(false);
  const mvpOverridesRef = useRef<Record<string, MvpSnapshot>>({});
  const sessionBaselinesRef = useRef<Record<string, { scoreFilled: boolean }>>({});

  const baseViewMatch = useMemo(
    () => preferMatchMvpData(orderedMatches[activeIndex] ?? match, match),
    [activeIndex, orderedMatches, match]
  );
  const viewMatch = useMemo(
    () => mergeMvpIntoMatch(baseViewMatch, mvpOverrides[baseViewMatch.id]),
    [baseViewMatch, mvpOverrides]
  );
  const isLiveMatch = viewMatch.status === "live";
  const isFinishedMatch = viewMatch.status === "finished";

  const handleSetLive = async () => {
    setIsSettingLive(true);
    await setMatchLive(poolId, viewMatch.id);
    setIsSettingLive(false);
    onClose();
  };

  const hidePossibleLineupsForView = isFinishedMatch;
  const shouldLoadLiveSnapshot = open && (isLiveMatch || isFinishedMatch);
  const { snapshot: liveSnapshot } = useMatchLiveSnapshot(viewMatch.id, shouldLoadLiveSnapshot);
  const highlightVideoId = viewMatch.highlightYoutubeId;
  const canSwipeMatches = orderedMatches.length > 1 && Boolean(onMatchChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedMatches.length);
  const boardCarouselMatches = useMemo(
    () => buildBoardCarouselMatches(orderedMatches),
    [orderedMatches],
  );

  const groupMatchRows = useMemo(
    () => toGroupMatchRows(orderedMatches),
    [orderedMatches],
  );

  const groupStandingsDetail = useMemo(
    () => buildGroupStandingsDetail(groupMatchRows, "official"),
    [groupMatchRows],
  );

  const groupStandingsPredicted = useMemo(
    () => buildGroupStandingsDetail(groupMatchRows, "predictions"),
    [groupMatchRows],
  );

  const {
    current: panelView,
    canGoBack,
    push,
    pop,
    reset,
    replaceCurrent,
    isSliding: isPanelSliding,
    buildPanelSlide,
  } = usePanelSlideStack<QuickPanelView>({ kind: "prediction" });

  const atPredictionRoot = panelView.kind === "prediction";
  const atLineupCarousel = panelView.kind === "lineup";

  const matchTeams = useMemo(
    () => [viewMatch.home_team, viewMatch.away_team],
    [viewMatch.home_team, viewMatch.away_team]
  );
  const lineupTeamName = panelView.kind === "lineup" ? panelView.teamName : viewMatch.home_team;

  useEffect(() => {
    if (panelView.kind === "lineup") {
      setLineupFormation(undefined);
    }
    if (panelView.kind === "possible-lineups") {
      setPossibleLineupsTitle(undefined);
      setPossibleLineupsConfirmed(false);
    }
  }, [lineupTeamName, panelView.kind]);

  useEffect(() => {
    if (!open || hidePossibleLineupsForView) return;
    let cancelled = false;
    void fetchMatchLineupsStatusAction(
      viewMatch.id,
      viewMatch.home_team,
      viewMatch.away_team,
    ).then((result) => {
      if (cancelled || !result.ok) return;
      setPossibleLineupsConfirmed(result.data.bothConfirmed);
      setPossibleLineupsCaption(
        lineupsActionCaption({
          bothConfirmed: result.data.bothConfirmed,
          isLive: viewMatch.status === "live",
        }),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [hidePossibleLineupsForView, open, viewMatch.id, viewMatch.home_team, viewMatch.away_team, viewMatch.status]);

  const {
    activeIndex: teamCarouselIndex,
    canSwipe: canSwipeTeams,
    startSlide: startTeamSlide,
    buildCarouselPanelSlide: buildTeamCarouselSlide,
    isCarouselSliding,
  } = useCarouselSlide({
    items: matchTeams,
    open,
    initialItemKey: lineupTeamName,
    getItemKey: (team) => team,
    enabled: matchTeams.length > 1,
    canSlide: atLineupCarousel && !isPanelSliding && !matchSlide,
    onItemChange: (teamName) => {
      replaceCurrent(buildLineupView(teamName, viewMatch.id));
    },
  });

  const savedHome = viewMatch.prediction?.home_goals ?? null;
  const savedAway = viewMatch.prediction?.away_goals ?? null;
  const savedAdvancingTeam = (viewMatch.prediction?.advancing_team as "home" | "away" | null) ?? null;
  const [home, setHome] = useState<number | null>(savedHome);
  const [away, setAway] = useState<number | null>(savedAway);
  const [advancingTeam, setAdvancingTeam] = useState<"home" | "away" | null>(savedAdvancingTeam);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  mvpOverridesRef.current = mvpOverrides;

  onMatchChangeRef.current = onMatchChange;

  useEffect(() => {
    reset({ kind: "prediction" });
    setHome(savedHome);
    setAway(savedAway);
    setAdvancingTeam(savedAdvancingTeam);
    setError(null);
  }, [viewMatch.id, savedHome, savedAway, savedAdvancingTeam, reset]);

  const draftDirty = home !== savedHome || away !== savedAway || advancingTeam !== savedAdvancingTeam;
  const mvpDirty = mvpDraftDirty(baseViewMatch, mvpOverrides[baseViewMatch.id]);
  const scoreFilled =
    hasFilledPredictionScore(savedHome, savedAway) ||
    hasFilledPredictionScore(home, away);
  const mvpFilled = Boolean(mvpPlayerNameFromMatch(viewMatch)?.trim());
  const bothFilled = scoreFilled && mvpFilled;
  const partialFill = (scoreFilled && !mvpFilled) || (mvpFilled && !scoreFilled);
  const uiState = useMemo(
    () =>
      resolvePredictionUiState({
        savedHome,
        savedAway,
        draftHome: home,
        draftAway: away,
        draftDirty,
        matchStatus: viewMatch.status,
        serverEditable: viewMatch.serverEditable,
      }),
    [savedHome, savedAway, home, away, draftDirty, viewMatch.status, viewMatch.serverEditable]
  );

  const controlsDisabled = uiState === "locked" || pending;
  const canSave =
    uiState !== "locked" &&
    !pending &&
    (partialFill || (bothFilled && (uiState !== "saved" || draftDirty || mvpDirty)));

  function onSave() {
    setError(null);

    const draftScoreFilled = hasFilledPredictionScore(home, away);
    const savedScoreFilled = hasFilledPredictionScore(savedHome, savedAway);
    const hasScore = savedScoreFilled || draftScoreFilled;
    const hasMvp = mvpFilled;

    if (hasScore && !hasMvp) {
      setError("Añade quien crees que será el mvp del partido.");
      return;
    }
    if (hasMvp && !hasScore) {
      setError("Añade tu pronóstico del partido.");
      return;
    }
    if (!hasScore || !hasMvp) {
      return;
    }
    if (!viewMatch.group_code && hasScore && home === away && !advancingTeam) {
      setError("Al pronosticar empate en eliminatorias, debes elegir qué equipo pasa de ronda.");
      return;
    }

    startTransition(async () => {
      const mvpSnap =
        mvpOverrides[viewMatch.id] ??
        (viewMatch.mvpPrediction?.player_name?.trim()
          ? {
              player_name: viewMatch.mvpPrediction.player_name,
              team_name: viewMatch.mvpPrediction.team_name,
              shirt_number: viewMatch.mvpPrediction.shirt_number ?? null,
            }
          : null);

      const result = await savePrediction(poolId, viewMatch.id, home!, away!, advancingTeam ?? undefined);
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (mvpSnap) {
        const mvpResult = await saveMvpPrediction(
          poolId,
          viewMatch.id,
          mvpSnap.player_name,
          mvpSnap.team_name,
          mvpSnap.shirt_number
        );
        if (!mvpResult.ok) {
          setError(mvpResult.error);
          return;
        }
        onMvpSaved?.(
          viewMatch.id,
          mvpResult.playerName,
          mvpResult.teamName,
          mvpResult.shirtNumber
        );
      }

      setHome(result.home);
      setAway(result.away);
      onClose();
      router.refresh();
    });
  }

  const handleDismiss = useCallback(() => {
    const overrides = mvpOverridesRef.current;
    const matchesToClean = orderedMatches.filter((m) => {
      const baseline = sessionBaselinesRef.current[m.id];
      if (baseline?.scoreFilled) return false;
      const hadMvp =
        Boolean(overrides[m.id]?.player_name?.trim()) ||
        Boolean(m.mvpPrediction?.player_name?.trim());
      return hadMvp;
    });

    void (async () => {
      let didMutate = false;
      for (const m of matchesToClean) {
        const result = await deleteMvpPrediction(poolId, m.id);
        if (result.ok) didMutate = true;
      }
      onClose();
      if (didMutate || Object.keys(overrides).length > 0) {
        router.refresh();
      }
    })();
  }, [onClose, orderedMatches, poolId, router]);

  const clearMatchSlideTimer = useCallback(() => {
    if (matchSlideTimerRef.current !== null) {
      window.clearTimeout(matchSlideTimerRef.current);
      matchSlideTimerRef.current = null;
    }
  }, []);

  const finishMatchSlide = useCallback(() => {
    clearMatchSlideTimer();
    if (!matchSlideLockRef.current) return;
    matchSlideLockRef.current = false;

    setMatchSlide((current) => {
      if (!current) return null;
      const nextIndex = orderedMatches.findIndex((item) => item.id === current.target.id);
      if (nextIndex >= 0) setActiveIndex(nextIndex);
      onMatchChangeRef.current?.(current.target);
      return null;
    });
  }, [clearMatchSlideTimer, orderedMatches]);

  const finishMatchSlideRef = useRef(finishMatchSlide);
  finishMatchSlideRef.current = finishMatchSlide;

  const handleMvpSaved = useCallback(
    (
      matchId: string,
      playerName: string,
      teamName: string,
      shirtNumber?: number | null
    ) => {
      setMvpOverrides((current) => ({
        ...current,
        [matchId]: {
          player_name: playerName,
          team_name: teamName,
          shirt_number: shirtNumber ?? null,
        },
      }));
      if (panelView.kind === "mvp" && panelView.matchId === matchId) {
        pop();
      }
    },
    [panelView, pop]
  );

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      reset({ kind: "prediction" });
      clearMatchSlideTimer();
      matchSlideLockRef.current = false;
      setMatchSlide(null);
      setMvpOverrides({});
      setPredictionsBoardOpen(false);
      setStatsModalOpen(false);
      return;
    }

    if (!wasOpenRef.current) {
      const idx = orderedMatches.findIndex((item) => item.id === match.id);
      if (idx >= 0) setActiveIndex(idx);
      wasOpenRef.current = true;
      reset({ kind: "prediction" });
      setMatchSlide(null);
      matchSlideLockRef.current = false;
      setMvpOverrides(mvpOverridesFromMatchListAndActive(orderedMatches, match));
      sessionBaselinesRef.current = Object.fromEntries(
        orderedMatches.map((m) => [
          m.id,
          {
            scoreFilled: hasFilledPredictionScore(
              m.prediction?.home_goals ?? null,
              m.prediction?.away_goals ?? null
            ),
          },
        ])
      );
    }
  }, [open, match, orderedMatches, clearMatchSlideTimer, reset]);

  useEffect(() => {
    if (open) return;
    sessionBaselinesRef.current = {};
  }, [open]);

  useEffect(() => () => clearMatchSlideTimer(), [clearMatchSlideTimer]);

  const startMatchSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipeMatches || matchSlideLockRef.current || !atPredictionRoot || isPanelSliding) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= orderedMatches.length) return;
      const target = orderedMatches[nextIndex];
      if (!target) return;

      clearMatchSlideTimer();
      matchSlideLockRef.current = true;
      setMatchSlide({ target, direction: offset === 1 ? "next" : "prev", phase: "prep" });

      matchSlideTimerRef.current = window.setTimeout(() => {
        finishMatchSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMatchSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [
      activeIndex,
      atPredictionRoot,
      canSwipeMatches,
      clearMatchSlideTimer,
      isPanelSliding,
      orderedMatches,
    ]
  );

  function renderMvpCenterSlot(targetMatch: MatchWithPrediction) {
    const isFinished = targetMatch.status === "finished";
    const displayMatch = mergeMvpIntoMatch(targetMatch, mvpOverrides[targetMatch.id]);
    const displayName = mvpPlayerNameFromMatch(displayMatch);
    const savedTeamName = displayMatch.mvpPrediction?.team_name ?? null;

    return (
      <MvpPredictionButton
        savedPlayerName={displayName}
        savedTeamName={savedTeamName}
        readOnly={targetMatch.status === "live" || isFinished}
        officialPlayerName={isFinished ? targetMatch.officialMvpPlayerName : undefined}
        officialTeamName={isFinished ? targetMatch.officialMvpTeamName : undefined}
        onClick={
          targetMatch.status === "scheduled"
            ? () => push(buildMvpView(poolId, displayMatch))
            : undefined
        }
        variant="compact"
        className="w-full"
      />
    );
  }

  function renderPanelView(view: QuickPanelView, targetMatch: MatchWithPrediction) {
    const hidePossibleLineups = targetMatch.status === "finished";
    const predictionModalActionsClass = hidePossibleLineups
      ? PREDICTION_MODAL_ACTIONS_ROW_CLASS
      : PREDICTION_MODAL_ACTIONS_STACKED_CLASS;
    const finishedHomeGoals =
      targetMatch.officialHome ?? liveSnapshot?.homeScore ?? null;
    const finishedAwayGoals =
      targetMatch.officialAway ?? liveSnapshot?.awayScore ?? null;
    const hasFinishedScore =
      finishedHomeGoals != null && finishedAwayGoals != null;
    const goalScorers = resolveMatchGoalScorers(
      targetMatch.playerIncidents,
      liveSnapshot?.playerIncidents,
    );
    const pendingTeams = getPendingTeamsForMatch(targetMatch);

    if (
      view.kind === "prediction" &&
      targetMatch.status === "finished" &&
      hasFinishedScore
    ) {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                hidePredictionLabel
                hideTeamNames
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive={false}
                possibleHomeTeams={pendingTeams?.homeTeams}
                possibleAwayTeams={pendingTeams?.awayTeams}
                homeFooterSlot={<MatchGoalScorersList goals={goalScorers.home} align="left" />}
                awayFooterSlot={<MatchGoalScorersList goals={goalScorers.away} align="right" />}
              />

              {isHector && (
                <div className="flex justify-center -mt-2 mb-2 relative z-10">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSetLive}
                    disabled={isSettingLive}
                    className="h-7 text-xs border-[var(--tm-danger)] text-[var(--tm-danger)] hover:bg-[var(--tm-danger)] hover:text-white"
                  >
                    {isSettingLive ? "Marcando..." : "HECTOR: Forzar EN JUEGO"}
                  </Button>
                </div>
              )}

              <FinishedMatchScoreRow
                homeGoals={finishedHomeGoals}
                awayGoals={finishedAwayGoals}
                predictedHome={targetMatch.prediction?.home_goals ?? null}
                predictedAway={targetMatch.prediction?.away_goals ?? null}
              />

              <div
                className={cn("absolute inset-x-0 bottom-0", predictionModalActionsClass)}
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="homeCardStacked"
                  homeAnchor="10%"
                  awayAnchor="90%"
                  lineupActionTone="muted"
                  className="h-full"
                  hideLineupButtons
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={possibleLineupsCaption}
                  possibleLineupsConfirmed={possibleLineupsConfirmed}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>
          </div>

          <FinishedModalFooterActions
            currentProfileId={currentProfileId}
            onOpenPredictionsBoard={() => setPredictionsBoardOpen(true)}
            onOpenStats={() => setStatsModalOpen(true)}
            highlight={
              highlightVideoId ? (
                <MatchHighlightBlock
                  homeTeam={targetMatch.home_team}
                  awayTeam={targetMatch.away_team}
                  youtubeVideoId={highlightVideoId}
                  highlightSource={targetMatch.highlightSource}
                  compactThumbnail
                  className="mt-3"
                />
              ) : null
            }
          />
        </div>
      );
    }

    if (view.kind === "prediction" && targetMatch.status === "live") {
      const predictionScoreText = formatListScore(
        targetMatch.prediction?.home_goals ?? null,
        targetMatch.prediction?.away_goals ?? null,
      );
      const liveLineupsCaption = lineupsActionCaption({
        bothConfirmed: possibleLineupsConfirmed,
        isLive: true,
      });

      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS,
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                hidePredictionLabel
                hideTeamNames
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive
                possibleHomeTeams={pendingTeams?.homeTeams}
                possibleAwayTeams={pendingTeams?.awayTeams}
                homeFooterSlot={<MatchGoalScorersList goals={goalScorers.home} align="left" />}
                awayFooterSlot={<MatchGoalScorersList goals={goalScorers.away} align="right" />}
                centerSlotAlign="teamNames"
                centerSlot={
                  targetMatch.prediction?.home_goals != null ? (
                    <div className="inline-block text-center">
                      <p className="text-[9px] font-semibold uppercase tracking-wider text-white/60">
                        Mi pronóstico
                      </p>
                      <p className="font-display text-sm font-semibold normal-case tabular-nums text-[var(--tm-accent)]">
                        {predictionScoreText}
                      </p>
                    </div>
                  ) : null
                }
              />

              {liveSnapshot ? (
                <LiveMatchScoreOverlay
                  homeScore={liveSnapshot.homeScore}
                  awayScore={liveSnapshot.awayScore}
                  variant="modal"
                />
              ) : null}

              <div
                className={cn(
                  "absolute inset-x-0 bottom-0",
                  targetMatch.prediction?.home_goals != null
                    ? PREDICTION_MODAL_LIVE_ACTIONS_TOP_CLASS
                    : PREDICTION_MODAL_NAMES_BOTTOM_CLASS,
                )}
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="predictionModalLiveStacked"
                  lineupActionTone="muted"
                  className="h-full"
                  hideLineupButtons
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={liveLineupsCaption}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>
          </div>
          <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
            {currentProfileId ? (
              <PredictionsBoardOpenButton onClick={() => setPredictionsBoardOpen(true)} />
            ) : null}
            <MatchLiveStatsPanel
              stats={liveSnapshot?.stats ?? null}
              className={currentProfileId ? "mt-3" : undefined}
            />
          </div>
        </div>
      );
    }

    if (view.kind === "prediction") {
      return (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="px-4 pb-0 pt-2">
            <div
              className={cn(
                "relative mt-2 pb-1",
                PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS
              )}
            >
              <MatchTeamsDisplay
                layout="predictionModal"
                hideTeamNames
                flagPlaceholderStyle={flagPlaceholderStyle}
                homeTeam={targetMatch.home_team}
                awayTeam={targetMatch.away_team}
                kickoffAt={targetMatch.kickoff_at}
                isLive={targetMatch.status === "live"}
                possibleHomeTeams={pendingTeams?.homeTeams}
                possibleAwayTeams={pendingTeams?.awayTeams}
                onHomeTeamClick={() => {
                  if (controlsDisabled || home === null) return;
                  setHome(home === 0 ? null : home - 1);
                }}
                onAwayTeamClick={() => {
                  if (controlsDisabled) return;
                  setAway(away === null ? 0 : Math.min(20, away + 1));
                }}
                homeScoreSlot={
                  <ScoreStepper
                    label={targetMatch.home_team}
                    value={home}
                    disabled={controlsDisabled}
                    onChange={setHome}
                    variant="floating"
                    hideLabel
                  />
                }
                awayScoreSlot={
                  <ScoreStepper
                    label={targetMatch.away_team}
                    value={away}
                    disabled={controlsDisabled}
                    onChange={setAway}
                    variant="floating"
                    hideLabel
                  />
                }
              />

              <div
                className="absolute inset-x-0 -bottom-6 h-[5.5rem]"
                onClick={(event) => event.stopPropagation()}
              >
                <MatchContextActionsRow
                  compact
                  layout="predictionModalLiveStacked"
                  homeAnchor="10%"
                  awayAnchor="90%"
                  className="h-full"
                  hideLineupButtons
                  centerSlot={renderMvpCenterSlot(targetMatch)}
                  hidePossibleLineups={hidePossibleLineups}
                  onOpenHomeLineup={() => push(buildLineupView(targetMatch.home_team, targetMatch.id))}
                  onOpenAwayLineup={() => push(buildLineupView(targetMatch.away_team, targetMatch.id))}
                  possibleLineupsCaption={possibleLineupsCaption}
                  possibleLineupsConfirmed={possibleLineupsConfirmed}
                  onOpenPossibleLineups={() => push(buildPossibleLineupsView(targetMatch))}
                />
              </div>
            </div>

          </div>

          <div className="mt-1 px-4 text-center">
            <p className="text-[10px] text-white/50 uppercase tracking-wide">
              Marcador a los 90 minutos
            </p>
          </div>

          {!targetMatch.group_code && home !== null && away !== null && home === away && (
            <div className="mt-3 px-4 flex flex-col items-center">
              <p className="text-[11px] font-semibold text-[var(--tm-accent)] mb-2 uppercase tracking-wide">
                ¿Quién pasa en penaltis/prórroga?
              </p>
              <div className="flex gap-1 w-full max-w-[260px] bg-white/5 p-1 rounded-full border border-white/10">
                <button
                  type="button"
                  onClick={() => setAdvancingTeam("home")}
                  className={cn(
                    "flex-1 py-1.5 rounded-full text-xs font-semibold transition-all truncate px-2",
                    advancingTeam === "home" ? "bg-[var(--tm-accent)] text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]" : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {targetMatch.home_team}
                </button>
                <button
                  type="button"
                  onClick={() => setAdvancingTeam("away")}
                  className={cn(
                    "flex-1 py-1.5 rounded-full text-xs font-semibold transition-all truncate px-2",
                    advancingTeam === "away" ? "bg-[var(--tm-accent)] text-black shadow-[0_0_10px_rgba(204,255,0,0.4)]" : "text-white/70 hover:text-white hover:bg-white/10"
                  )}
                >
                  {targetMatch.away_team}
                </button>
              </div>
            </div>
          )}

          {targetMatch.group_code ? (
            <div className="flex justify-center px-4 pt-3">
              <button
                type="button"
                onClick={() => setGroupStandingsCode(targetMatch.group_code)}
                className="inline-flex h-auto w-max shrink-0 items-center justify-center rounded-full bg-[#CCFF00] px-[clamp(6px,2.1cqw,8px)] pt-[clamp(2px,1cqw,3px)] pb-[clamp(1px,0.5cqw,1.5px)] text-[8px] font-bold uppercase leading-none tracking-[0.12em] text-black transition-opacity hover:opacity-90 active:opacity-80"
              >
                <span className="-translate-y-[0.5px]">Ver grupo</span>
              </button>
            </div>
          ) : null}

          <div className="mt-auto shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[1.38rem]">
            <PredictionDeadlineCountdown kickoffAt={targetMatch.kickoff_at} />
            <div className="mt-3 flex gap-2">
              <Button variant="outline" className="flex-1" disabled={pending} onClick={handleDismiss}>
                Cancelar
              </Button>
              <Button className="flex-1" disabled={!canSave || pending} onClick={onSave}>
                {pending ? "Guardando..." : "Guardar"}
              </Button>
            </div>
            <div
              className={cn(
                "flex items-center justify-center",
                error ? "min-h-[2.75rem]" : "h-0",
              )}
            >
              {error ? (
                <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
                  {error}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      );
    }

    if (view.kind === "lineup") {
      return (
        <LineupModalPanel
          teamName={view.teamName}
          matchId={view.matchId}
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

    if (view.kind === "mvp") {
      return (
        <MvpPickPanel
          poolId={view.poolId}
          matchId={view.matchId}
          homeTeam={view.homeTeam}
          awayTeam={view.awayTeam}
          serverEditable={view.serverEditable}
          savedPlayerName={view.savedPlayerName}
          savedTeamName={view.savedTeamName}
          savedShirtNumber={view.savedShirtNumber}
          persistMode="draft"
          onSaved={(playerName, teamName, shirtNumber) =>
            handleMvpSaved(view.matchId, playerName, teamName, shirtNumber)
          }
        />
      );
    }

    return (
      <PossibleLineupsPanel
        matchId={view.matchId}
        homeTeam={view.homeTeam}
        awayTeam={view.awayTeam}
        isLive={viewMatch.status === "live"}
        onTitleChange={setPossibleLineupsTitle}
        onConfirmedChange={setPossibleLineupsConfirmed}
      />
    );
  }

  const entityPanelSlide = buildPanelSlide((view) => renderPanelView(view, viewMatch));

  const teamCarouselSlide =
    atLineupCarousel && !entityPanelSlide
      ? buildTeamCarouselSlide((teamName) =>
          renderPanelView(buildLineupView(teamName, viewMatch.id), viewMatch)
        )
      : null;

  const matchPanelSlide: ModalPanelSlide | null =
    matchSlide && atPredictionRoot && !entityPanelSlide
      ? {
          direction: matchSlide.direction,
          phase: matchSlide.phase,
          incoming: renderPanelView(
            { kind: "prediction" },
            mergeMvpIntoMatch(matchSlide.target, mvpOverrides[matchSlide.target.id])
          ),
          onTransitionEnd: () => finishMatchSlideRef.current(),
        }
      : null;

  const activePanelSlide = entityPanelSlide ?? teamCarouselSlide ?? matchPanelSlide;
  const isLineupView = panelView.kind === "lineup";
  const isMvpView = panelView.kind === "mvp";
  const isPossibleLineupsView = panelView.kind === "possible-lineups";
  const isPlayerView = panelView.kind === "player";
  const isFieldView = isLineupView || isMvpView || isPossibleLineupsView;
  const isCompactModal = isFieldView || isPlayerView;
  return (
    <>
    <Modal
      open={open}
      onClose={handleDismiss}
      usageId={`quick-prediction-${panelView.kind}`}
      usageLabel={quickUsageLabel(panelView, viewMatch)}
      title={quickPanelTitle(panelView, {
        lineupFormation,
        possibleLineupsTitle:
          panelView.kind === "possible-lineups" && isLiveMatch
            ? lineupsModalTitle({ bothConfirmed: possibleLineupsConfirmed, isLive: true })
            : possibleLineupsTitle,
        possibleLineupsConfirmed: isLiveMatch ? false : possibleLineupsConfirmed,
      })}
      hideTitle={atPredictionRoot}
      hideHeaderDivider
      ariaLabel={atPredictionRoot ? "Pronóstico del partido" : undefined}
      headerCenter={
        atPredictionRoot
          ? isLiveMatch
            ? (
                <LiveMatchHeaderLabel
                  size="modal"
                  minuteLabel={liveSnapshot?.minuteLabel}
                />
              )
            : formatKickoff(viewMatch.kickoff_at)
          : undefined
      }
      headerTrailing={
        atPredictionRoot && !isFinishedMatch ? (
          <AiPredictionTrigger
            matchId={viewMatch.id}
            homeTeam={viewMatch.home_team}
            awayTeam={viewMatch.away_team}
            className="min-h-10 min-w-10"
          />
        ) : undefined
      }
      headerTitleAlign={isMvpView || isPossibleLineupsView ? "left" : "default"}
      headerCompact={isCompactModal}
      scrollContent={!isCompactModal}
      className={cn(
        isMvpView && cn(MVP_MODAL_PICK_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPossibleLineupsView &&
          cn(POSSIBLE_LINEUPS_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isLineupView && cn(LINEUP_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]"),
        isPlayerView && cn(PLAYER_MODAL_PANEL_CLASS, "max-h-[calc(100dvh-1rem)]")
      )}
      containerClassName={isCompactModal ? "p-1.5" : undefined}
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
        (isMvpView || isPossibleLineupsView) && MVP_MODAL_WRAPPER_CLASS
      )}
      opaque={opaque}
      onSwipeLeft={
        canSwipeMatches && atPredictionRoot && !activePanelSlide
          ? () => startMatchSlide(1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(1)
            : undefined
      }
      onSwipeRight={
        canSwipeMatches && atPredictionRoot && !activePanelSlide
          ? () => startMatchSlide(-1)
          : canSwipeTeams && atLineupCarousel && !activePanelSlide
            ? () => startTeamSlide(-1)
            : undefined
      }
      belowPanel={
        canSwipeMatches && atPredictionRoot ? (
          <MatchSwipeDots position={dotPosition} />
        ) : canSwipeTeams && atLineupCarousel ? (
          <CarouselSwipeDots activeIndex={teamCarouselIndex} total={matchTeams.length} />
        ) : undefined
      }
      onBack={canGoBack && !isPanelSliding && !isCarouselSliding ? pop : undefined}
      panelSlide={activePanelSlide}
      loading={pending && panelView.kind === "prediction"}
    >
      {renderPanelView(panelView, viewMatch)}
    </Modal>

    {currentProfileId ? (
      <MatchPredictionsBoardModal
        open={predictionsBoardOpen}
        onClose={() => setPredictionsBoardOpen(false)}
        poolId={poolId}
        matchId={viewMatch.id}
        homeTeam={viewMatch.home_team}
        awayTeam={viewMatch.away_team}
        currentProfileId={currentProfileId}
        carouselMatches={boardCarouselMatches}
        showSignOutcomeTicks={isFinishedMatch}
      />
    ) : null}

    {isFinishedMatch ? (
      <MatchStatsModal
        open={statsModalOpen}
        onClose={() => setStatsModalOpen(false)}
        homeTeam={viewMatch.home_team}
        awayTeam={viewMatch.away_team}
        homeGoals={viewMatch.officialHome ?? liveSnapshot?.homeScore ?? null}
        awayGoals={viewMatch.officialAway ?? liveSnapshot?.awayScore ?? null}
        stats={liveSnapshot?.stats ?? null}
      />
    ) : null}

    {groupStandingsCode ? (
      <GroupStandingsModal
        open
        groupCode={groupStandingsCode}
        groups={groupStandingsDetail}
        predictedGroups={groupStandingsPredicted}
        onClose={() => setGroupStandingsCode(null)}
        onGroupChange={setGroupStandingsCode}
      />
    ) : null}
    </>
  );
}
