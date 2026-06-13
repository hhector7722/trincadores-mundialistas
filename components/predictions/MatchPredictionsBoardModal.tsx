"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchMatchPredictionsBoardAction } from "@/actions/predictions";
import {
  MatchPredictionsBoardHeaderTitle,
  matchPredictionsBoardAriaTitle,
} from "@/components/predictions/MatchPredictionsBoardHeaderTitle";
import { MatchPredictionsBoardLegend } from "@/components/predictions/MatchPredictionsBoardLegend";
import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import type { MatchPredictionsBoardCarouselMatch } from "@/lib/predictions/board-carousel";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";
import { CarouselSwipeDots, useCarouselSlide } from "@/lib/ui/use-carousel-slide";

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
};

const MODAL_PANEL_CLASS =
  "flex min-h-[min(78dvh,34rem)] max-h-[min(78dvh,34rem)] w-full max-w-lg flex-col";

function MatchPredictionsBoardBody({
  loading,
  error,
  board,
  homeTeam,
  awayTeam,
  currentProfileId,
}: {
  loading: boolean;
  error: string | null;
  board: MatchPredictionsBoard | null;
  homeTeam: string;
  awayTeam: string;
  currentProfileId: string;
}) {
  const tableHomeTeam = board?.homeTeam ?? homeTeam;
  const tableAwayTeam = board?.awayTeam ?? awayTeam;
  const showOutcomes = board?.showOutcomes ?? false;

  if (error) {
    return (
      <div className="flex flex-1 items-center justify-center px-3">
        <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      </div>
    );
  }

  return (
    <>
      <MatchPredictionsBoardTable
        loading={loading}
        rows={board?.rows ?? []}
        currentProfileId={currentProfileId}
        homeTeam={tableHomeTeam}
        awayTeam={tableAwayTeam}
        showOutcomes={showOutcomes}
      />
      {!loading && showOutcomes ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <MatchPredictionsBoardLegend />
        </div>
      ) : null}
    </>
  );
}

function MatchPredictionsBoardPanel({
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  currentProfileId,
  onBoardLoaded,
}: {
  poolId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentProfileId: string;
  onBoardLoaded?: (board: MatchPredictionsBoard | null) => void;
}) {
  const [board, setBoard] = useState<MatchPredictionsBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setBoard(null);

    void fetchMatchPredictionsBoardAction(poolId, matchId)
      .then((result) => {
        if (cancelled) return;
        setLoading(false);
        if (!result.ok) {
          setError(result.error);
          onBoardLoaded?.(null);
          return;
        }
        setBoard(result.board);
        onBoardLoaded?.(result.board);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError("No se pudieron cargar los pronosticos. Comprueba la conexion.");
        onBoardLoaded?.(null);
      });

    return () => {
      cancelled = true;
    };
  }, [poolId, matchId, onBoardLoaded]);

  return (
    <MatchPredictionsBoardBody
      loading={loading}
      error={error}
      board={board}
      homeTeam={homeTeam}
      awayTeam={awayTeam}
      currentProfileId={currentProfileId}
    />
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
}: MatchPredictionsBoardModalProps) {
  const fallbackMatch = useMemo(
    () => ({ id: matchId, homeTeam, awayTeam }),
    [matchId, homeTeam, awayTeam],
  );

  const carouselMatches = carouselMatchesProp ?? finishedMatches ?? [];
  const canSwipeBoard =
    carouselMatches.length > 1 && carouselMatches.some((item) => item.id === matchId);

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
  const [headerBoard, setHeaderBoard] = useState<MatchPredictionsBoard | null>(null);

  useEffect(() => {
    if (!open) setHeaderBoard(null);
  }, [open]);

  const carouselPanelSlide = canSwipe
    ? buildCarouselPanelSlide((item) => (
        <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
          <MatchPredictionsBoardPanel
            poolId={poolId}
            matchId={item.id}
            homeTeam={item.homeTeam}
            awayTeam={item.awayTeam}
            currentProfileId={currentProfileId}
          />
        </div>
      ))
    : null;

  const tableHomeTeam = headerBoard?.homeTeam ?? displayMatch.homeTeam;
  const tableAwayTeam = headerBoard?.awayTeam ?? displayMatch.awayTeam;
  const officialHome = headerBoard?.officialHome ?? null;
  const officialAway = headerBoard?.officialAway ?? null;
  const ariaTitle = matchPredictionsBoardAriaTitle(
    tableHomeTeam,
    tableAwayTeam,
    officialHome,
    officialAway,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      hideHeaderDivider
      title={
        <>
          <span className="sr-only">{ariaTitle}</span>
          <span
            aria-hidden
            className="flex w-full min-w-0 normal-case tracking-normal"
          >
            <MatchPredictionsBoardHeaderTitle
              homeTeam={tableHomeTeam}
              awayTeam={tableAwayTeam}
              homeGoals={officialHome}
              awayGoals={officialAway}
            />
          </span>
        </>
      }
      className={MODAL_PANEL_CLASS}
      scrollContent={false}
      onSwipeLeft={canSwipe && !carouselPanelSlide ? () => startSlide(1) : undefined}
      onSwipeRight={canSwipe && !carouselPanelSlide ? () => startSlide(-1) : undefined}
      belowPanel={
        canSwipe ? (
          <CarouselSwipeDots activeIndex={activeIndex} total={carouselMatches.length} />
        ) : undefined
      }
      panelSlide={carouselPanelSlide}
    >
      <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
        <MatchPredictionsBoardPanel
          poolId={poolId}
          matchId={displayMatch.id}
          homeTeam={displayMatch.homeTeam}
          awayTeam={displayMatch.awayTeam}
          currentProfileId={currentProfileId}
          onBoardLoaded={setHeaderBoard}
        />
      </div>
    </Modal>
  );
}
