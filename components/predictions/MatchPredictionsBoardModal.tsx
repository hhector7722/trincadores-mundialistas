"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { fetchMatchPredictionsBoardAction } from "@/actions/predictions";
import {
  MatchPredictionsBoardHeaderTitle,
  matchPredictionsBoardAriaTitle,
} from "@/components/predictions/MatchPredictionsBoardHeaderTitle";
import { MatchPredictionsBoardLegend } from "@/components/predictions/MatchPredictionsBoardLegend";
import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import { LoadingCenter } from "@/components/ui/spinner";
import type { MatchPredictionsBoardCarouselMatch } from "@/lib/predictions/board-carousel";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";
import { cn } from "@/lib/utils";

type MatchPredictionsBoardModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentProfileId: string;
  /** Partidos en juego o finalizados para deslizar entre tableros (orden kickoff). */
  carouselMatches?: MatchPredictionsBoardCarouselMatch[];
  /** @deprecated Usar `carouselMatches`. */
  finishedMatches?: MatchPredictionsBoardCarouselMatch[];
  /** Inicio: tick verde en aciertos de signo (1X2). Calendario/modal partido: solo exacto. */
  showSignOutcomeTicks?: boolean;
};

const MODAL_PANEL_CLASS =
  "flex min-h-[min(78dvh,34rem)] max-h-[min(78dvh,34rem)] w-full max-w-lg flex-col";

const MODAL_LOADING_MIN_H = "min-h-[min(50dvh,22rem)]";

type LoadedBoardState = {
  matchId: string;
  board: MatchPredictionsBoard;
};

function MatchPredictionsBoardContent({
  board,
  currentProfileId,
  showSignOutcomeTicks,
}: {
  board: MatchPredictionsBoard;
  currentProfileId: string;
  showSignOutcomeTicks: boolean;
}) {
  return (
    <>
      <MatchPredictionsBoardTable
        rows={board.rows}
        currentProfileId={currentProfileId}
        homeTeam={board.homeTeam}
        awayTeam={board.awayTeam}
        showOutcomes={board.showOutcomes}
        showSignOutcomeTicks={showSignOutcomeTicks}
        isKnockout={board.isKnockout}
      />
      {board.showOutcomes ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <MatchPredictionsBoardLegend 
            showSignOutcomeTicks={showSignOutcomeTicks} 
            isKnockout={board.isKnockout}
          />
        </div>
      ) : null}
    </>
  );
}

export function MatchPredictionsBoardModal({
  open,
  onClose,
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  currentProfileId,
  carouselMatches: carouselMatchesProp,
  finishedMatches,
  showSignOutcomeTicks = false,
}: MatchPredictionsBoardModalProps) {
  const fallbackMatch = useMemo(
    () => ({ id: matchId, homeTeam, awayTeam }),
    [matchId, homeTeam, awayTeam],
  );

  const carouselMatches = carouselMatchesProp ?? finishedMatches ?? [];
  const canSwipeBoard =
    carouselMatches.length > 1 && carouselMatches.some((item) => item.id === matchId);

  const boardCacheRef = useRef(new Map<string, MatchPredictionsBoard>());
  const [loadedBoard, setLoadedBoard] = useState<LoadedBoardState | null>(null);
  const [fetching, setFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    activeIndex,
    activeItem,
    canSwipe,
    startSlide,
    buildCarouselPanelSlide,
  } = useCarouselSlide({
    items: carouselMatches,
    open,
    initialItemKey: matchId,
    getItemKey: (item) => item.id,
    enabled: canSwipeBoard,
    canSlide: true,
  });

  const displayMatch = canSwipeBoard ? (activeItem ?? fallbackMatch) : fallbackMatch;
  const activeBoard =
    loadedBoard?.matchId === displayMatch.id ? loadedBoard.board : null;
  const isLoading = !error && (fetching || activeBoard === null);

  const prefetchBoard = useCallback(
    async (targetMatchId: string) => {
      if (boardCacheRef.current.has(targetMatchId)) return;

      const result = await fetchMatchPredictionsBoardAction(poolId, targetMatchId);
      if (result.ok) {
        boardCacheRef.current.set(targetMatchId, result.board);
      }
    },
    [poolId],
  );

  useEffect(() => {
    if (!open) {
      boardCacheRef.current.clear();
      setLoadedBoard(null);
      setFetching(false);
      setError(null);
      return;
    }

    const cached = boardCacheRef.current.get(displayMatch.id);
    if (cached) {
      setLoadedBoard({ matchId: displayMatch.id, board: cached });
      setFetching(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setFetching(true);
    setError(null);

    void fetchMatchPredictionsBoardAction(poolId, displayMatch.id)
      .then((result) => {
        if (cancelled) return;
        setFetching(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        boardCacheRef.current.set(displayMatch.id, result.board);
        setLoadedBoard({ matchId: displayMatch.id, board: result.board });
      })
      .catch(() => {
        if (cancelled) return;
        setFetching(false);
        setError("No se pudieron cargar los pronosticos. Comprueba la conexion.");
      });

    return () => {
      cancelled = true;
    };
  }, [open, poolId, displayMatch.id]);

  useEffect(() => {
    if (!open || isLoading || !canSwipe) return;

    const previous = carouselMatches[activeIndex - 1];
    const next = carouselMatches[activeIndex + 1];
    if (previous) void prefetchBoard(previous.id);
    if (next) void prefetchBoard(next.id);
  }, [open, isLoading, canSwipe, activeIndex, carouselMatches, prefetchBoard]);

  const handleStartSlide = useCallback(
    (offset: 1 | -1) => {
      const target = carouselMatches[activeIndex + offset];
      if (target) void prefetchBoard(target.id);
      startSlide(offset);
    },
    [activeIndex, carouselMatches, prefetchBoard, startSlide],
  );

  const carouselPanelSlide = canSwipe
    ? buildCarouselPanelSlide(() => (
        <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
          <LoadingCenter minHeightClassName={MODAL_LOADING_MIN_H} />
        </div>
      ))
    : null;

  const ariaTitle = activeBoard
    ? matchPredictionsBoardAriaTitle(
        activeBoard.homeTeam,
        activeBoard.awayTeam,
        activeBoard.officialHome,
        activeBoard.officialAway,
      )
    : "Cargando pronósticos";

  return (
    <Modal
      open={open}
      onClose={onClose}
      usageId="match-predictions-board"
      usageLabel={ariaTitle}
      hideCloseButton
      hideHeaderDivider
      headerTitleAlign="left"
      hideTitle={isLoading}
      ariaLabel={isLoading ? "Cargando pronósticos" : undefined}
      title={
        activeBoard ? (
          <>
            <span className="sr-only">{ariaTitle}</span>
            <span
              aria-hidden
              className="flex w-full min-w-0 normal-case tracking-normal"
            >
              <MatchPredictionsBoardHeaderTitle
                homeTeam={activeBoard.homeTeam}
                awayTeam={activeBoard.awayTeam}
                homeGoals={activeBoard.officialHome}
                awayGoals={activeBoard.officialAway}
                playerIncidents={activeBoard.playerIncidents}
                officialMvpPlayerName={activeBoard.officialMvpPlayerName}
                officialMvpTeamName={activeBoard.officialMvpTeamName}
              />
            </span>
          </>
        ) : (
          "Cargando pronósticos"
        )
      }
      className={MODAL_PANEL_CLASS}
      scrollContent={false}
      loading={isLoading}
      onSwipeLeft={canSwipe && !carouselPanelSlide ? () => handleStartSlide(1) : undefined}
      onSwipeRight={canSwipe && !carouselPanelSlide ? () => handleStartSlide(-1) : undefined}
      belowPanel={
        canSwipe ? (
          <CarouselSwipeDots activeIndex={activeIndex} total={carouselMatches.length} />
        ) : undefined
      }
      panelSlide={carouselPanelSlide}
    >
      <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
        {error ? (
          <div className="flex flex-1 items-center justify-center px-3">
            <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
              {error}
            </p>
          </div>
        ) : activeBoard ? (
          <MatchPredictionsBoardContent
            board={activeBoard}
            currentProfileId={currentProfileId}
            showSignOutcomeTicks={showSignOutcomeTicks}
          />
        ) : (
          <div className={cn("flex-1", MODAL_LOADING_MIN_H)} aria-hidden="true" />
        )}
      </div>
    </Modal>
  );
}
