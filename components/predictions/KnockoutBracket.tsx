"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  buildKnockoutMatchMap,
  KNOCKOUT_STAGGERED_ROUNDS,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
} from "@/lib/predictions/knockout-bracket-layout";
import { knockoutTeamLabel } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function BracketTeamSlot({ name }: { name: string }) {
  const label = knockoutTeamLabel(name);

  return (
    <span className="tm-ko-slot" title={name}>
      <span className="tm-ko-slot-label">{label}</span>
    </span>
  );
}

function StaggeredMatchPair({
  match,
  matchNumber,
  index,
  onOpen,
}: {
  match: MatchWithPrediction | null;
  matchNumber: number;
  index: number;
  onOpen: (match: MatchWithPrediction) => void;
}) {
  const fallback = placeholderPairForMatchNumber(matchNumber);
  const homeName = match?.home_team ?? fallback?.home ?? " ";
  const awayName = match?.away_team ?? fallback?.away ?? " ";
  const savedHome = match?.prediction?.home_goals ?? null;
  const savedAway = match?.prediction?.away_goals ?? null;
  const state = match
    ? resolvePredictionUiState({
        savedHome,
        savedAway,
        draftHome: savedHome ?? 0,
        draftAway: savedAway ?? 0,
        draftDirty: false,
        matchStatus: match.status,
        serverEditable: match.serverEditable,
      })
    : "empty";
  const scoreText = match ? formatListScore(savedHome, savedAway) : " ";
  const alignLeft = index % 2 === 0;
  const isLive = match?.status === "live";

  return (
    <button
      type="button"
      disabled={!match}
      onClick={() => match && onOpen(match)}
      className={cn(
        "tm-ko-pair",
        alignLeft ? "tm-ko-pair--left" : "tm-ko-pair--right",
        !match && "tm-ko-pair--missing",
        isLive && "tm-ko-pair--live",
        state === "saved" && "tm-ko-pair--saved",
        state === "locked" && "tm-ko-pair--locked"
      )}
      aria-label={
        match
          ? `Pronostico ${homeName} contra ${awayName}`
          : `Partido ${matchNumber} sin datos`
      }
    >
      <BracketTeamSlot name={homeName} />
      {scoreText.trim() ? <span className="tm-ko-pair-score">{scoreText}</span> : null}
      <BracketTeamSlot name={awayName} />
    </button>
  );
}

export function KnockoutBracket({ poolId, matches }: KnockoutBracketProps) {
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const matchMap = useMemo(() => buildKnockoutMatchMap(matches), [matches]);

  const rounds = useMemo(
    () =>
      KNOCKOUT_STAGGERED_ROUNDS.map((round) => ({
        ...round,
        entries: round.matchNumbers
          .map((matchNumber) => ({
            matchNumber,
            match: resolveBracketMatch(matchMap, matchNumber),
          }))
          .filter((entry) => entry.match || placeholderPairForMatchNumber(entry.matchNumber)),
      })).filter((round) => round.entries.length > 0),
    [matchMap]
  );

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase eliminatoria cargados.
      </p>
    );
  }

  return (
    <div className="tm-ko-page">
      <div className="tm-ko-header">
        <h1 className="font-display text-xs uppercase tracking-wide text-[var(--tm-fg)] sm:text-sm">
          Fase eliminatoria
        </h1>
        <Link href="/predictions" className="tm-cal-ko-link shrink-0">
          VER FASE DE GRUPOS
        </Link>
      </div>

      <div className="tm-ko-stage">
        {rounds.map((round) => (
          <section key={round.key} className="tm-ko-round">
            <h2 className="tm-ko-round-title">{round.label}</h2>
            <div className="tm-ko-round-track">
              {round.entries.map((entry, index) => (
                <StaggeredMatchPair
                  key={entry.matchNumber}
                  match={entry.match}
                  matchNumber={entry.matchNumber}
                  index={index}
                  onOpen={setActiveMatch}
                />
              ))}
            </div>
          </section>
        ))}
      </div>

      {activeMatch ? (
        <QuickPredictionModal
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
        />
      ) : null}
    </div>
  );
}
