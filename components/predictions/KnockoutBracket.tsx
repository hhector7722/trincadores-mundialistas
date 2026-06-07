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
  BRACKET_THIRD_PLACE,
  BRACKET_TREE_LAYOUT,
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
  type BracketTreeSlot,
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

function BracketTreeMatch({
  slot,
  match,
  onOpen,
}: {
  slot: BracketTreeSlot;
  match: MatchWithPrediction | null;
  onOpen: (match: MatchWithPrediction) => void;
}) {
  const fallback = placeholderPairForMatchNumber(slot.matchNumber);
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
  const isLive = match?.status === "live";

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
        "tm-ko-node",
        slot.round === "final" && "tm-ko-node--final",
        slot.side === "left" && "tm-ko-node--left",
        slot.side === "right" && "tm-ko-node--right",
        slot.side === "center" && "tm-ko-node--center",
        slot.horizontal && "tm-ko-node--horizontal",
        !match && "tm-ko-node--missing",
        isLive && "tm-ko-node--live",
        state === "saved" && "tm-ko-node--saved",
        state === "locked" && "tm-ko-node--locked"
      )}
      aria-label={
        match
          ? `Pronostico ${homeName} contra ${awayName}`
          : `Partido ${slot.matchNumber} sin datos`
      }
    >
      <span
        className={cn(
          "tm-ko-node-pair",
          slot.horizontal && "tm-ko-node-pair--horizontal"
        )}
      >
        <BracketTeamSlot name={homeName} />
        {scoreText.trim() ? <span className="tm-ko-node-score">{scoreText}</span> : null}
        <BracketTeamSlot name={awayName} />
      </span>
    </button>
  );
}

export function KnockoutBracket({ poolId, matches }: KnockoutBracketProps) {
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const matchMap = useMemo(() => buildKnockoutMatchMap(matches), [matches]);
  const thirdPlaceMatch = resolveBracketMatch(matchMap, BRACKET_THIRD_PLACE.matchNumber);

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
        <div className="tm-ko-tree" role="img" aria-label="Cuadro de eliminatorias Mundial 2026">
          {BRACKET_TREE_LAYOUT.map((slot) => (
            <BracketTreeMatch
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
          <span className="tm-ko-third-label">3.er</span>
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
