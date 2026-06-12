"use client";

import { useEffect, useState } from "react";
import { fetchMatchPredictionsBoardAction } from "@/actions/predictions";
import { CalendarGuideModal } from "@/components/predictions/CalendarGuideModal";
import { MatchPredictionsBoardTable } from "@/components/predictions/MatchPredictionsBoardTable";
import { Modal } from "@/components/ui/modal";
import type { MatchPredictionsBoard } from "@/lib/predictions/queries";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

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
  const [guideOpen, setGuideOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      setBoard(null);
      setError(null);
      setLoading(false);
      setGuideOpen(false);
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
    <>
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
            />
          )}

          <button
            type="button"
            onClick={() => setGuideOpen(true)}
            className={cn(
              "mt-2 flex min-h-12 shrink-0 items-center justify-center rounded-xl px-3",
              "text-xs font-semibold uppercase tracking-wide text-[var(--tm-muted)]",
              "transition-colors hover:bg-[var(--tm-surface-elevated)]/60 hover:text-[var(--tm-fg)]",
            )}
          >
            Guía del calendario
          </button>
        </div>
      </Modal>

      <CalendarGuideModal
        open={guideOpen}
        stackElevated
        onClose={() => setGuideOpen(false)}
        onBack={() => setGuideOpen(false)}
      />
    </>
  );
}
