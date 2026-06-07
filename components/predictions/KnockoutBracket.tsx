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
  BRACKET_MATCH_LAYOUT,
  BRACKET_THIRD_PLACE,
  buildKnockoutMatchMap,
  resolveBracketMatch,
  type BracketSlot,
} from "@/lib/predictions/knockout-bracket-layout";
import { knockoutTeamLabel } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

function BracketTeamSlot({
  name,
  compact,
}: {
  name: string;
  compact?: boolean;
}) {
  const label = knockoutTeamLabel(name);

  return (
    <span
      className={cn(
        "tm-ko-slot flex shrink-0 items-center justify-center overflow-hidden rounded-[3px] border border-[var(--tm-ko-slot-border)] bg-[var(--tm-ko-slot-bg)] font-display leading-none text-[var(--tm-accent)]",
        compact ? "tm-ko-slot--compact" : "tm-ko-slot--regular"
      )}
      title={name}
    >
      <span className="tm-ko-slot-label">{label}</span>
    </span>
  );
}

function BracketMatchCell({
  match,
  slot,
  onOpen,
}: {
  match: MatchWithPrediction | null;
  slot: BracketSlot;
  onOpen: (match: MatchWithPrediction) => void;
}) {
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
  const isFinal = slot.round === "final";
  const isThird = slot.round === "third";
  const isLive = match?.status === "live";
  const isCompactPair = slot.round === "r32";
  const homeName = match?.home_team ?? " ";
  const awayName = match?.away_team ?? " ";

  return (
    <button
      type="button"
      disabled={!match}
      onClick={() => match && onOpen(match)}
      style={{
        gridColumn: slot.column + 1,
        gridRow: `${slot.rowStart} / span ${slot.rowSpan}`,
      }}
      className={cn(
        "tm-ko-match group relative flex min-h-0 min-w-0 items-center justify-center p-0",
        slot.side === "left" && "tm-ko-match--left",
        slot.side === "right" && "tm-ko-match--right",
        slot.side === "center" && "tm-ko-match--center",
        isFinal && "tm-ko-match--final",
        isThird && "tm-ko-match--third",
        !match && "tm-ko-match--missing",
        isLive && "tm-ko-match--live",
        state === "saved" && "tm-ko-match--saved",
        state === "locked" && "tm-ko-match--locked"
      )}
      aria-label={
        match
          ? `Pronostico ${homeName} contra ${awayName}`
          : `Partido ${slot.matchNumber} sin datos`
      }
    >
      <span className="tm-ko-match-inner">
        <span
          className={cn(
            "flex min-h-0 min-w-0 flex-col items-center justify-center gap-[1px]",
            isCompactPair ? "h-full w-full max-w-[18px]" : "gap-[2px]"
          )}
        >
          <BracketTeamSlot name={homeName} compact={isCompactPair} />
          {!isCompactPair && scoreText.trim() ? (
            <span className="tm-ko-score">{scoreText}</span>
          ) : null}
          <BracketTeamSlot name={awayName} compact={isCompactPair} />
        </span>
      </span>
    </button>
  );
}

export function KnockoutBracket({ poolId, matches }: KnockoutBracketProps) {
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);

  const matchMap = useMemo(() => buildKnockoutMatchMap(matches), [matches]);

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase eliminatoria cargados.
      </p>
    );
  }

  const thirdPlaceMatch = resolveBracketMatch(matchMap, BRACKET_THIRD_PLACE.matchNumber);

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
        <div className="tm-ko-grid" role="img" aria-label="Cuadro de eliminatorias Mundial 2026">
          {BRACKET_MATCH_LAYOUT.map((slot) => (
            <BracketMatchCell
              key={`${slot.side}-${slot.round}-${slot.matchNumber}`}
              slot={slot}
              match={resolveBracketMatch(matchMap, slot.matchNumber)}
              onOpen={setActiveMatch}
            />
          ))}
        </div>
      </div>

      {thirdPlaceMatch ? (
        <div className="tm-ko-third">
          <span className="tm-ko-third-label">3.er puesto</span>
          <button
            type="button"
            onClick={() => setActiveMatch(thirdPlaceMatch)}
            className="tm-ko-third-btn"
          >
            <BracketTeamSlot name={thirdPlaceMatch.home_team} />
            <span className="tm-ko-third-score">
              {formatListScore(
                thirdPlaceMatch.prediction?.home_goals ?? null,
                thirdPlaceMatch.prediction?.away_goals ?? null
              )}
            </span>
            <BracketTeamSlot name={thirdPlaceMatch.away_team} />
          </button>
        </div>
      ) : null}

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
