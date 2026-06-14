"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRankingEvolutionAction } from "@/actions/ranking";
import { RankingEvolutionChart } from "@/components/ranking/RankingEvolutionChart";
import { Modal } from "@/components/ui/modal";
import { RangeSlider } from "@/components/ui/range-slider";
import type { RankingEvolutionData } from "@/lib/ranking/evolution";

type RankingEvolutionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
};

const MODAL_PANEL_CLASS =
  "flex max-h-[min(94dvh,48rem)] w-full max-w-lg flex-col";

export function RankingEvolutionModal({ open, onClose, poolId }: RankingEvolutionModalProps) {
  const [data, setData] = useState<RankingEvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endMatchdayIndex, setEndMatchdayIndex] = useState(0);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const result = await fetchRankingEvolutionAction(poolId);
    if (!result.ok) {
      setError(result.error);
      setData(null);
      setLoading(false);
      return;
    }
    setData(result.data);
    const lastIndex = Math.max(0, result.data.matchdays.length - 1);
    setEndMatchdayIndex(lastIndex);
    setLoading(false);
  }, [poolId]);

  useEffect(() => {
    if (!open) return;
    void loadData();
  }, [open, loadData]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Evolución de la tabla"
      hideHeaderDivider
      className={MODAL_PANEL_CLASS}
      loading={loading}
      scrollContent={false}
    >
      <div className="flex flex-col gap-3 px-3 pb-3 pt-1">
        {error ? (
          <p className="shrink-0 text-center text-sm text-red-400">{error}</p>
        ) : null}

        <div className="shrink-0 overflow-hidden rounded-xl border border-[var(--tm-border)] bg-[var(--tm-bg-elevated)] px-2 pt-2 pb-1">
          {data && data.matchdays.length > 0 ? (
            <RankingEvolutionChart data={data} endMatchdayIndex={endMatchdayIndex} />
          ) : !loading && !error ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--tm-muted)]">
              Aun no hay jornadas con partidos finalizados.
            </div>
          ) : null}
        </div>

        {data && data.matchdays.length > 0 ? (
          <div className="shrink-0 px-1">
            <RangeSlider
              min={0}
              max={data.matchdays.length - 1}
              value={endMatchdayIndex}
              onChange={setEndMatchdayIndex}
              thumbImageSrc="/icons/slider.png?v=3"
              aria-label="Jornada final visible en el grafico"
            />
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
