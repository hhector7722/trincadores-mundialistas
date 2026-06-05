"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { PredictionStatusBadge } from "@/components/predictions/PredictionStatusBadge";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  KNOCKOUT_ROUND_LABELS,
  KNOCKOUT_ROUND_ORDER,
} from "@/lib/predictions/stage-filter";
import { formatCalendarKickoffHour } from "@/lib/pool/match-calendar";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function KnockoutMatchRow({
  match,
  onOpen,
}: {
  match: MatchWithPrediction;
  onOpen: () => void;
}) {
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
  const hour = formatCalendarKickoffHour(match.kickoff_at);

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex min-h-14 w-full items-center gap-2 border-b border-[var(--tm-border)] px-3 py-2 text-left transition-colors last:border-0 hover:bg-[rgba(111,43,255,0.12)]",
        match.status === "live" && "bg-[rgba(212,255,0,0.06)]"
      )}
    >
      <span className="w-8 shrink-0 text-xs font-medium text-white">{hour}</span>
      <TeamFlagBadge name={match.home_team} size="xs" />
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
        {teamNameEs(match.home_team)} — {teamNameEs(match.away_team)}
      </span>
      <TeamFlagBadge name={match.away_team} size="xs" />
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <PredictionStatusBadge state={state} />
        <span className="font-display text-sm text-[var(--tm-fg)]">{scoreText}</span>
      </div>
    </button>
  );
}

export function KnockoutBracket({ poolId, matches }: KnockoutBracketProps) {
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);

  const rounds = useMemo(() => {
    const byKey = new Map<string, MatchWithPrediction[]>();
    for (const match of matches) {
      const key = match.matchday_external_key ?? "unknown";
      const bucket = byKey.get(key);
      if (bucket) bucket.push(match);
      else byKey.set(key, [match]);
    }

    return KNOCKOUT_ROUND_ORDER.filter((key) => byKey.has(key)).map((key) => ({
      key,
      label: KNOCKOUT_ROUND_LABELS[key] ?? key,
      matches: byKey.get(key) ?? [],
    }));
  }, [matches]);

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase eliminatoria cargados.
      </p>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-[var(--tm-border)] px-3 py-2">
        <h1 className="font-display text-sm uppercase tracking-wide text-[var(--tm-fg)] sm:text-base">
          Fase eliminatoria
        </h1>
        <Link href="/predictions" className="tm-cal-ko-link shrink-0">
          ver fase de grupos
        </Link>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto pb-2">
        {rounds.map((round) => (
          <section
            key={round.key}
            className="tm-glass-card mx-0 mb-2 overflow-hidden rounded-none border-x-0"
          >
            <h2 className="border-b border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
              {round.label}
            </h2>
            {round.matches.map((match) => (
              <KnockoutMatchRow
                key={match.id}
                match={match}
                onOpen={() => setActiveMatch(match)}
              />
            ))}
          </section>
        ))}
      </div>

      {activeMatch && (
        <QuickPredictionModal
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
        />
      )}
    </div>
  );
}
