import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import { formatListScore, resolvePredictionUiState } from "@/lib/predictions/edit-state";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import type { MatchWithPrediction } from "@/lib/predictions/queries";

export function MatchPredictionCard({ match }: { match: MatchWithPrediction }) {
  const savedHome = match.prediction?.home_goals ?? null;
  const savedAway = match.prediction?.away_goals ?? null;
  const state = resolvePredictionUiState({
    savedHome,
    savedAway,
    draftHome: savedHome ?? 0,
    draftAway: savedAway ?? 0,
    draftDirty: false,
    matchStatus: match.status,
    serverEditable: match.serverEditable,
  });

  const scoreText = formatListScore(savedHome, savedAway);

  return (
    <Link
      href={`/predictions/${match.id}`}
      className="flex min-h-14 items-center justify-between gap-3 border-b border-[var(--tm-border)] py-3 last:border-0"
    >
      <div className="min-w-0 flex-1">
        {match.matchday_name && (
          <p className="text-xs text-[var(--tm-muted)]">{match.matchday_name}</p>
        )}
        <p className="truncate text-sm font-medium text-[var(--tm-fg)]">
          {match.home_team} — {match.away_team}
        </p>
        <p className="text-xs text-[var(--tm-subtle)]">{formatKickoff(match.kickoff_at)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <div className="text-right">
          <PredictionStatusBadge state={state} />
          <p className="mt-1 font-display text-sm text-[var(--tm-fg)]">{scoreText}</p>
        </div>
        <ChevronRight className="h-5 w-5 text-[var(--tm-muted)]" />
      </div>
    </Link>
  );
}