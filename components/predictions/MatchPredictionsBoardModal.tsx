"use client";

import { useEffect, useState } from "react";
import { fetchMatchPredictionsBoardAction } from "@/actions/predictions";
import {
  MatchPredictionsBoardHeaderTitle,
  matchPredictionsBoardAriaTitle,
} from "@/components/predictions/MatchPredictionsBoardHeaderTitle";
import { MatchPredictionsBoardLegend } from "@/components/predictions/MatchPredictionsBoardLegend";
import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";

type MatchPredictionsBoardModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  matchId: string;
  homeTeam: string;
  awayTeam: string;
  currentProfileId: string;
};

const MODAL_PANEL_CLASS =
  "flex min-h-[min(78dvh,34rem)] max-h-[min(78dvh,34rem)] w-full max-w-lg flex-col";

export function MatchPredictionsBoardModal({
  open,
  onClose,
  poolId,
  matchId,
  homeTeam,
  awayTeam,
  currentProfileId,
}: MatchPredictionsBoardModalProps) {
  const [board, setBoard] = useState<MatchPredictionsBoard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setBoard(null);
      setError(null);
      setLoading(false);
      return;
    }

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
          return;
        }
        setBoard(result.board);
      })
      .catch(() => {
        if (cancelled) return;
        setLoading(false);
        setError("No se pudieron cargar los pronosticos. Comprueba la conexion.");
      });

    return () => {
      cancelled = true;
    };
  }, [open, poolId, matchId]);

  const tableHomeTeam = board?.homeTeam ?? homeTeam;
  const tableAwayTeam = board?.awayTeam ?? awayTeam;
  const officialHome = board?.officialHome ?? null;
  const officialAway = board?.officialAway ?? null;
  const showOutcomes = board?.showOutcomes ?? false;
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
      loading={loading}
    >
      <div className="flex min-h-0 flex-1 flex-col px-1 pb-2">
        {error ? (
          <div className="flex flex-1 items-center justify-center px-3">
            <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
              {error}
            </p>
          </div>
        ) : (
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
        )}
      </div>
    </Modal>
  );
}
