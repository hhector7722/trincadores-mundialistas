"use client";

import Link from "next/link";
import { useMemo, useState, type CSSProperties } from "react";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  buildBracketConnectorPaths,
  buildBracketGeometry,
  matchPosition,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
import {
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
} from "@/lib/predictions/knockout-bracket-layout";
import { isPlaceholderTeam } from "@/lib/openfootball/slug";
import { knockoutTeamLabel, teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

const BRACKET_GEOMETRY = buildBracketGeometry();
const BRACKET_CONNECTORS = buildBracketConnectorPaths(BRACKET_GEOMETRY);

function BracketTeamRow({
  name,
  goals,
  isWinner,
}: {
  name: string;
  goals: number | null;
  isWinner?: boolean;
}) {
  const trimmed = name.trim();
  const primary = knockoutTeamLabel(name);
  const secondary =
    trimmed && !isPlaceholderTeam(trimmed) ? teamNameEs(name) : null;
  const showSecondary = secondary && secondary.trim() !== primary.trim();

  return (
    <div
      className={cn("tm-ko-card-row", isWinner && "tm-ko-card-row--winner")}
    >
      <div className="tm-ko-card-row-text">
        <span className="tm-ko-card-row-primary">{primary}</span>
        {showSecondary ? (
          <span className="tm-ko-card-row-secondary">{secondary}</span>
        ) : null}
      </div>
      <span className="tm-ko-card-row-score">{goals != null ? goals : " "}</span>
    </div>
  );
}

function BracketMatchCard({
  geom,
  match,
  onOpen,
}: {
  geom: BracketMatchGeometry;
  match: MatchWithPrediction | null;
  onOpen: (match: MatchWithPrediction) => void;
}) {
  const fallback = placeholderPairForMatchNumber(geom.matchNumber);
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
  const isLive = match?.status === "live";
  const pos = matchPosition(geom);
  const hasScore = savedHome != null && savedAway != null;
  const homeWins = hasScore && savedHome > savedAway;
  const awayWins = hasScore && savedAway > savedHome;
  const scoreSummary = match ? formatListScore(savedHome, savedAway) : " ";

  return (
    <button
      type="button"
      disabled={!match}
      onClick={() => match && onOpen(match)}
      style={
        {
          left: `${pos.x}%`,
          top: `${pos.y}%`,
          "--tm-ko-card-scale": geom.layoutScale,
        } as CSSProperties
      }
      className={cn(
        "tm-ko-card",
        `tm-ko-card--${geom.round}`,
        geom.side === "left" && "tm-ko-card--left",
        geom.side === "right" && "tm-ko-card--right",
        !match && "tm-ko-card--missing",
        isLive && "tm-ko-card--live",
        state === "saved" && "tm-ko-card--saved",
        state === "locked" && "tm-ko-card--locked"
      )}
      aria-label={
        match
          ? `Pronostico ${homeName} contra ${awayName}${
              scoreSummary.trim() ? `, ${scoreSummary}` : ""
            }`
          : `Partido ${geom.matchNumber} sin datos`
      }
    >
      <BracketTeamRow name={homeName} goals={savedHome} isWinner={homeWins} />
      <div className="tm-ko-card-divider" aria-hidden />
      <BracketTeamRow name={awayName} goals={savedAway} isWinner={awayWins} />
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
        <div
          className="tm-ko-canvas"
          role="img"
          aria-label="Cuadro de eliminatorias Mundial 2026"
        >
          <svg
            className="tm-ko-wires"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {BRACKET_CONNECTORS.map((segment, index) => (
              <path
                key={`wire-${index}`}
                d={segment.d}
                className={cn(
                  "tm-ko-wire",
                  segment.variant === "pair" && "tm-ko-wire--pair",
                  segment.variant === "final" && "tm-ko-wire--final"
                )}
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="tm-ko-nodes">
            {BRACKET_GEOMETRY.map((geom) => (
              <BracketMatchCard
                key={geom.matchNumber}
                geom={geom}
                match={resolveBracketMatch(matchMap, geom.matchNumber)}
                onOpen={setActiveMatch}
              />
            ))}
          </div>
        </div>
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
