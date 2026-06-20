"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchRankingEvolutionAction } from "@/actions/ranking";
import {
  RANKING_EVOLUTION_MEMBER_SLOTS,
  RankingEvolutionChart,
  rankingEvolutionChartHeight,
} from "@/components/ranking/RankingEvolutionChart";
import { Modal } from "@/components/ui/modal";
import { RangeSlider } from "@/components/ui/range-slider";
import type { RankingEvolutionData } from "@/lib/ranking/evolution";

type RankingEvolutionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
};

const MODAL_PANEL_CLASS =
  "flex max-h-[min(94dvh,46rem)] w-full max-w-lg flex-col";

/** Altura reservada del slider con bandera (`.tm-flag-range-slider`). */
const EVOLUTION_SLIDER_RESERVED_HEIGHT = "calc(56px + 0.5rem)";

/** Espacio mínimo entre la barra del slider y el borde inferior del modal. */
const EVOLUTION_SLIDER_BOTTOM_PADDING = "0.75rem";

const LOADING_CHART_HEIGHT_PX = rankingEvolutionChartHeight(
  RANKING_EVOLUTION_MEMBER_SLOTS
);

export function RankingEvolutionModal({ open, onClose, poolId }: RankingEvolutionModalProps) {
  const [data, setData] = useState<RankingEvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endMatchdayIndex, setEndMatchdayIndex] = useState(0);
  const [highlightedProfileId, setHighlightedProfileId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!open) setHighlightedProfileId(null);
  }, [open]);

  const hasMatchdayData = Boolean(data && data.matchdays.length > 0);
  const showFullLayout = loading || hasMatchdayData;
  const chartHeightPx = data
    ? rankingEvolutionChartHeight(data.members.length)
    : LOADING_CHART_HEIGHT_PX;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Evolución por jornada"
      hideHeaderDivider
      className={MODAL_PANEL_CLASS}
      loading={loading}
      scrollContent={false}
    >
      <div
        className="flex flex-col gap-3 px-3 pt-1 pb-0"
        onClick={() => setHighlightedProfileId(null)}
      >
        {error ? (
          <p className="shrink-0 text-center text-sm text-red-400">{error}</p>
        ) : null}

        <div
          className="shrink-0 overflow-hidden rounded-xl border border-[var(--tm-border)] bg-[var(--tm-bg-elevated)] px-2 pt-1 pb-1"
          style={showFullLayout ? { minHeight: chartHeightPx + 4 } : undefined}
        >
          {hasMatchdayData ? (
            <RankingEvolutionChart
              data={data!}
              endMatchdayIndex={endMatchdayIndex}
              highlightedProfileId={highlightedProfileId}
              onHighlightProfileId={setHighlightedProfileId}
            />
          ) : showFullLayout ? (
            <div
              className="w-full"
              style={{ height: chartHeightPx }}
              aria-hidden="true"
            />
          ) : !error ? (
            <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--tm-muted)]">
              Aun no hay jornadas con partidos finalizados.
            </div>
          ) : null}
        </div>

        {showFullLayout ? (
          <div
            className="shrink-0 px-1"
            style={{
              minHeight: EVOLUTION_SLIDER_RESERVED_HEIGHT,
              paddingBottom: EVOLUTION_SLIDER_BOTTOM_PADDING,
            }}
          >
            {hasMatchdayData ? (
              <RangeSlider
                min={0}
                max={data!.matchdays.length - 1}
                value={endMatchdayIndex}
                onChange={setEndMatchdayIndex}
                thumbImageSrc="/icons/slider.png?v=3"
                aria-label="Jornada final visible en el grafico"
              />
            ) : (
              <div className="tm-flag-range-slider" aria-hidden="true" />
            )}
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
