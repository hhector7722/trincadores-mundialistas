import { Badge } from "@/components/ui/badge";
import type { PoolMatchRow } from "@/lib/pool/queries";
import { formatKickoff } from "@/lib/pool/queries";

export function MatchRow({ match, showDay }: { match: PoolMatchRow; showDay?: boolean }) {
  const isLive = match.status === "live";
  return (
    <div className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--tm-border)] py-3 last:border-0">
      <div className="min-w-0 flex-1">
        {showDay && match.matchday_name && (
          <p className="text-xs text-[var(--tm-muted)]">{match.matchday_name}</p>
        )}
        <p className="truncate text-sm font-medium text-[var(--tm-fg)]">
          {match.home_team} — {match.away_team}
        </p>
        <p className="text-xs text-[var(--tm-subtle)]">{formatKickoff(match.kickoff_at)}</p>
      </div>
      {isLive ? (
        <Badge variant="live">Live</Badge>
      ) : (
        <Badge variant="muted">{match.status}</Badge>
      )}
    </div>
  );
}
