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

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-lg"
      scrollContent
      loading={loading}
    >
      {error ? (
        <p className="px-3 py-4 text-sm text-[var(--tm-danger)]" role="alert">
          {error}
        </p>
      ) : board ? (
        <MatchPredictionsBoardTable
          rows={board.rows}
          currentProfileId={currentProfileId}
          homeTeam={board.homeTeam}
          awayTeam={board.awayTeam}
        />
      ) : !loading ? (
        <p className="px-3 py-4 text-sm text-[var(--tm-muted)]">Sin pronosticos disponibles.</p>
      ) : null}
    </Modal>
  );
}
