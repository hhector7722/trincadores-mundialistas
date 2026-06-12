import { RankingRow } from "@/components/ranking/RankingRow";
import { RANKING_GRID } from "@/components/ranking/ranking-grid";
import {
  formatReferenceMatchDate,
  formatReferenceMatchLabel,
} from "@/lib/ranking/format";
import type { LeaderboardRow, ReferenceMatch } from "@/lib/ranking/queries";
import { cn } from "@/lib/utils";

const EMPTY_ROW_COUNT = 11;

function RankingReferenceCaption({
  referenceMatch,
  previousReferenceMatch,
}: {
  referenceMatch: ReferenceMatch | null;
  previousReferenceMatch: ReferenceMatch | null;
}) {
  if (!referenceMatch) return null;

  return (
    <div className="shrink-0 border-b border-[var(--tm-border)] px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-[var(--tm-muted)]">
        Tras {formatReferenceMatchDate(referenceMatch.kickoffAt)} ·{" "}
        {formatReferenceMatchLabel(referenceMatch.homeTeam, referenceMatch.awayTeam)}
      </p>
      {previousReferenceMatch ? (
        <p className="mt-0.5 text-[10px] text-[var(--tm-subtle)]">
          Flechas vs {formatReferenceMatchDate(previousReferenceMatch.kickoffAt)} ·{" "}
          {formatReferenceMatchLabel(
            previousReferenceMatch.homeTeam,
            previousReferenceMatch.awayTeam
          )}
        </p>
      ) : null}
    </div>
  );
}

function RankingTableHeader() {
  return (
    <div
      className={cn(
        RANKING_GRID,
        "shrink-0 border-b border-[var(--tm-border)] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-[var(--tm-muted)]"
      )}
    >
      <span aria-hidden="true" />
      <span className="text-left">Pos</span>
      <span className="text-left">Trincador</span>
      <span className="text-center">Pts</span>
      <span className="text-center">Fiab</span>
      <span className="text-center">Quiz</span>
    </div>
  );
}

function RankingEmptyRow() {
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
    </div>
  );
}

export function RankingTable({
  rows,
  currentProfileId,
  referenceMatch = null,
  previousReferenceMatch = null,
}: {
  rows: LeaderboardRow[];
  currentProfileId: string;
  referenceMatch?: ReferenceMatch | null;
  previousReferenceMatch?: ReferenceMatch | null;
}) {
  return (
    <div className="tm-ranking-table">
      <RankingReferenceCaption
        referenceMatch={referenceMatch}
        previousReferenceMatch={previousReferenceMatch}
      />
      <RankingTableHeader />
      <div className="tm-ranking-body">
        {rows.length === 0
          ? Array.from({ length: EMPTY_ROW_COUNT }, (_, index) => (
              <RankingEmptyRow key={`empty-${index}`} />
            ))
          : rows.map((row) => (
              <RankingRow
                key={row.profileId}
                row={row}
                isCurrentUser={row.profileId === currentProfileId}
              />
            ))}
      </div>
    </div>
  );
}
