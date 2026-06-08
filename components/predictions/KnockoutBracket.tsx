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
  buildBracketConnectorPaths,
  buildBracketGeometry,
  scorePosition,
  slotPosition,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
import {
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
} from "@/lib/predictions/knockout-bracket-layout";
import { knockoutTeamLabel } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

const BRACKET_GEOMETRY = buildBracketGeometry();
const BRACKET_CONNECTORS = buildBracketConnectorPaths(BRACKET_GEOMETRY);

function BracketTeamSlot({ name }: { name: string }) {
  const label = knockoutTeamLabel(name);

  return (
    <span className="tm-ko-slot" title={name}>
      <span className="tm-ko-slot-label">{label}</span>
    </span>
  );
}

function BracketMatchNode({
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
  const scoreText = match ? formatListScore(savedHome, savedAway) : " ";
  const isLive = match?.status === "live";
  const homePos = slotPosition(geom, "home");
  const awayPos = slotPosition(geom, "away");
  const scorePos = scorePosition(geom);
  const isFinal = geom.round === "final";

  return (
    <button
      type="button"
      disabled={!match}
      onClick={() => match && onOpen(match)}
      className={cn(
        "tm-ko-match",
        isFinal && "tm-ko-match--final",
        !match && "tm-ko-match--missing",
        isLive && "tm-ko-match--live",
        state === "saved" && "tm-ko-match--saved",
        state === "locked" && "tm-ko-match--locked"
      )}
      aria-label={
        match
          ? `Pronostico ${homeName} contra ${awayName}`
          : `Partido ${geom.matchNumber} sin datos`
      }
    >
      <span
        className="tm-ko-match-slot tm-ko-match-slot--home"
        style={{ left: `${homePos.x}%`, top: `${homePos.y}%` }}
      >
        <BracketTeamSlot name={homeName} />
      </span>
      {scoreText.trim() ? (
        <span
          className="tm-ko-node-score"
          style={{ left: `${scorePos.x}%`, top: `${scorePos.y}%` }}
        >
          {scoreText}
        </span>
      ) : null}
      <span
        className="tm-ko-match-slot tm-ko-match-slot--away"
        style={{ left: `${awayPos.x}%`, top: `${awayPos.y}%` }}
      >
        <BracketTeamSlot name={awayName} />
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
            {BRACKET_CONNECTORS.map((path, index) => (
              <path
                key={`wire-${index}`}
                d={path}
                className="tm-ko-wire"
                vectorEffect="non-scaling-stroke"
              />
            ))}
          </svg>

          <div className="tm-ko-columns" aria-hidden>
            {Array.from({ length: 9 }, (_, column) => (
              <div key={column} className="tm-ko-col" />
            ))}
          </div>

          <div className="tm-ko-nodes">
            {BRACKET_GEOMETRY.map((geom) => (
              <BracketMatchNode
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
