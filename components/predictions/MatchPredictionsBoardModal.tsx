"use client";

import { useEffect, useState } from "react";
import { fetchMatchPredictionsBoardAction } from "@/actions/predictions";
import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";
import { teamNameEs } from "@/lib/teams/display";

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

  const title = `${teamNameEs(homeTeam)} vs ${teamNameEs(awayTeam)}`;
  const tableHomeTeam = board?.homeTeam ?? homeTeam;
  const tableAwayTeam = board?.awayTeam ?? awayTeam;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
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
          <MatchPredictionsBoardTable
            loading={loading}
            rows={board?.rows ?? []}
            currentProfileId={currentProfileId}
            homeTeam={tableHomeTeam}
            awayTeam={tableAwayTeam}
            showOutcomes={board?.showOutcomes ?? false}
          />
        )}
      </div>
    </Modal>
  );
}
