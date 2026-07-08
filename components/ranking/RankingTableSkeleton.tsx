import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function RankingSkeletonHeader() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span />
      <span className="text-center" style={{ gridColumn: "span 2" }}>
        TRINCADOR
      </span>
      <span className="text-center">Total</span>
      <span className="text-center" />
      <span className="text-center" />
      <span className="text-center" />
      <span className="text-center" />
      <span className="text-center" />
    </div>
  );
}

function RankingSkeletonRow() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "tm-ranking-row w-full border-b border-[var(--tm-border)] px-3 last:border-0"
      )}
      aria-hidden="true"
    >
      <span />
      <span />
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="size-9 shrink-0 rounded-full bg-[var(--tm-border)]/35" />
        <span className="min-w-0 flex-1 truncate">&nbsp;</span>
      </div>
      <span />
      <span />
      <span />
      <span />
      <span />
      <span />
    </div>
  );
}

export function RankingTableSkeleton() {
  return (
    <div className="tm-ranking-table" aria-busy="true" aria-label="Cargando ranking">
      <RankingSkeletonHeader />
      <div className="tm-ranking-body">
        {Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
          <RankingSkeletonRow key={`ranking-skeleton-${index}`} />
        ))}
      </div>
    </div>
  );
}
