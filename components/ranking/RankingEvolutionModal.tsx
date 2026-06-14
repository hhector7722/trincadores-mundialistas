"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
import { fetchRankingEvolutionAction } from "@/actions/ranking";
import { RankingEvolutionChart } from "@/components/ranking/RankingEvolutionChart";
import { RankingEvolutionFilterModal } from "@/components/ranking/RankingEvolutionFilterModal";
import { Modal } from "@/components/ui/modal";
import { RangeSlider } from "@/components/ui/range-slider";
import type { RankingEvolutionData } from "@/lib/ranking/evolution";
import { cn } from "@/lib/utils";

type RankingEvolutionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
};

const MODAL_PANEL_CLASS =
  "flex min-h-[min(78dvh,34rem)] max-h-[min(78dvh,34rem)] w-full max-w-lg flex-col";

export function RankingEvolutionModal({ open, onClose, poolId }: RankingEvolutionModalProps) {
  const [data, setData] = useState<RankingEvolutionData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [endMatchdayIndex, setEndMatchdayIndex] = useState(0);
  const [filterOpen, setFilterOpen] = useState(false);
  const [appliedFilterIds, setAppliedFilterIds] = useState<Set<string>>(new Set());

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
    setAppliedFilterIds(new Set(result.data.members.map((member) => member.profileId)));
    setLoading(false);
  }, [poolId]);

  useEffect(() => {
    if (!open) return;
    void loadData();
  }, [open, loadData]);

  const filterActive = useMemo(() => {
    if (!data) return false;
    return appliedFilterIds.size < data.members.length;
  }, [appliedFilterIds.size, data]);

  const currentMatchday = data?.matchdays[endMatchdayIndex] ?? null;

  function clearFilter() {
    if (!data) return;
    setAppliedFilterIds(new Set(data.members.map((member) => member.profileId)));
  }

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Evolución de la tabla"
        hideHeaderDivider
        className={MODAL_PANEL_CLASS}
        loading={loading}
        scrollContent={false}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-3 px-3 pb-3 pt-1">
          <div className="flex shrink-0 justify-center">
            <div className="relative">
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className={cn(
                "inline-flex min-h-10 items-center justify-center rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.1)] px-4 text-[11px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] transition-colors hover:border-[var(--tm-accent-muted)]"
              )}
            >
              Filtrar por trincador
            </button>
            {filterActive ? (
              <button
                type="button"
                aria-label="Quitar filtros"
                onClick={clearFilter}
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
              >
                <X className="size-3" strokeWidth={3} aria-hidden />
              </button>
            ) : null}
            </div>
          </div>

          {error ? (
            <p className="shrink-0 text-center text-sm text-red-400">{error}</p>
          ) : null}

          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-[var(--tm-border)]/40 bg-[#0a0618] p-2">
            {data && data.matchdays.length > 0 ? (
              <RankingEvolutionChart
                data={data}
                endMatchdayIndex={endMatchdayIndex}
                filteredProfileIds={appliedFilterIds}
              />
            ) : !loading && !error ? (
              <div className="flex h-full min-h-[12rem] items-center justify-center px-4 text-center text-sm text-[var(--tm-muted)]">
                Aun no hay jornadas con partidos finalizados.
              </div>
            ) : null}
          </div>

          {data && data.matchdays.length > 0 ? (
            <div className="shrink-0 space-y-2 px-1">
              <p className="text-center text-[11px] font-medium uppercase tracking-wide text-[var(--tm-muted)]">
                Hasta jornada {endMatchdayIndex + 1}
                {currentMatchday ? ` — ${currentMatchday.name}` : ""}
              </p>
              <RangeSlider
                min={0}
                max={data.matchdays.length - 1}
                value={endMatchdayIndex}
                onChange={setEndMatchdayIndex}
                aria-label="Jornada final visible en el grafico"
              />
            </div>
          ) : null}
        </div>
      </Modal>

      {data ? (
        <RankingEvolutionFilterModal
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          members={data.members}
          appliedIds={appliedFilterIds}
          onApply={setAppliedFilterIds}
        />
      ) : null}
    </>
  );
}
