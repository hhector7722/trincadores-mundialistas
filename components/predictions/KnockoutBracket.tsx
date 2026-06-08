"use client";

import Image from "next/image";
import { useMemo, useRef, useState, type CSSProperties } from "react";
import { useKnockoutViewportLayout } from "@/components/predictions/useKnockoutViewportLayout";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  applyQfOppositeFooterAlignment,
  buildBracketConnectorPaths,
  buildBracketGeometry,
  FINAL_CENTER_X,
  FINAL_CUP_OFFSET_ABOVE_FINAL,
  finalCenterYFromGeometry,
  matchPosition,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
import {
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
} from "@/lib/predictions/knockout-bracket-layout";
import { knockoutBracketDisplayName } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

const BRACKET_GEOMETRY = applyQfOppositeFooterAlignment(buildBracketGeometry());
const BRACKET_CONNECTORS = buildBracketConnectorPaths(BRACKET_GEOMETRY);
const FINAL_CENTER_Y = finalCenterYFromGeometry(BRACKET_GEOMETRY);

function BracketTeamRow({
  name,
  goals,
  isWinner,
}: {
  name: string;
  goals: number | null;
  isWinner?: boolean;
}) {
  const label = knockoutBracketDisplayName(name);

  return (
    <div className={cn("tm-ko-card-row", isWinner && "tm-ko-card-row--winner")}>
      <span className="tm-ko-card-row-primary" title={name}>
        {label}
      </span>
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
  const pageRef = useRef<HTMLDivElement>(null);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const matchMap = useMemo(() => buildKnockoutMatchMap(matches), [matches]);

  useKnockoutViewportLayout(pageRef);

  if (!matches.length) {
    return (
      <p className="py-8 text-center text-sm text-[var(--tm-muted)]">
        No hay partidos de fase eliminatoria cargados.
      </p>
    );
  }

  return (
    <div ref={pageRef} className="tm-ko-page">
      <div className="tm-ko-stage">
        <div
          className="tm-ko-canvas"
          role="img"
          aria-label="Cuadro de eliminatorias Mundial 2026"
        >
          <div className="tm-ko-header-band" aria-hidden />

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

          <div
            className="tm-ko-cup"
            style={{
              left: `${FINAL_CENTER_X}%`,
              top: `${FINAL_CENTER_Y - FINAL_CUP_OFFSET_ABOVE_FINAL}%`,
            }}
            aria-hidden
          >
            <Image
              src="/icons/copa.png"
              alt=""
              width={56}
              height={56}
              className="tm-ko-cup-img"
              priority
            />
          </div>

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
