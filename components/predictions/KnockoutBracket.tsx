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
  buildBracketGeometry,
  FINAL_CENTER_X,
  FINAL_CUP_OFFSET_ABOVE_FINAL,
  finalCenterYFromGeometry,
  matchPosition,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
import type { BracketRoundKey } from "@/lib/predictions/knockout-bracket-layout";
import {
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
} from "@/lib/predictions/knockout-bracket-layout";
import { isPlaceholderTeam } from "@/lib/openfootball/slug";
import {
  knockoutBracketSlotLabel,
  teamAbbr,
  teamNameEs,
} from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
};

const BRACKET_GEOMETRY = applyQfOppositeFooterAlignment(buildBracketGeometry());
const FINAL_CENTER_Y = finalCenterYFromGeometry(BRACKET_GEOMETRY);

const ORB_PAIR_HALF: Record<BracketRoundKey, number> = {
  r32: 1.45,
  r16: 1.15,
  qf: 1.2,
  sf: 1.25,
  final: 0,
};

type TeamSlotLayout = {
  x: number;
  y: number;
};

function teamSlotLayouts(geom: BracketMatchGeometry, columnX: number): {
  home: TeamSlotLayout;
  away: TeamSlotLayout;
} {
  if (geom.round === "r32") {
    return {
      home: { x: columnX, y: geom.homeY },
      away: { x: columnX, y: geom.awayY },
    };
  }

  if (geom.round === "final") {
    const spread = 1.35 * geom.layoutScale;
    return {
      home: { x: columnX - spread, y: geom.midY },
      away: { x: columnX + spread, y: geom.midY },
    };
  }

  const half = ORB_PAIR_HALF[geom.round] * geom.layoutScale;
  return {
    home: { x: columnX, y: geom.midY - half },
    away: { x: columnX, y: geom.midY + half },
  };
}

function BracketTeamOrb({
  teamName,
  round,
  layout,
  layoutScale,
  isWinner,
  isLive,
  isSaved,
}: {
  teamName: string;
  round: BracketRoundKey | "final";
  layout: TeamSlotLayout;
  layoutScale: number;
  isWinner?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
}) {
  const trimmed = teamName.trim();
  const isPlaceholder = !trimmed || isPlaceholderTeam(trimmed);
  const label = isPlaceholder ? knockoutBracketSlotLabel(teamName) : teamAbbr(teamName);
  const title = isPlaceholder ? label : teamNameEs(teamName);

  return (
    <div
      className={cn(
        "tm-ko-orb",
        round === "r32" && "tm-ko-orb--r32",
        isWinner && "tm-ko-orb--winner",
        isLive && "tm-ko-orb--live",
        isSaved && "tm-ko-orb--saved"
      )}
      style={
        {
          left: `${layout.x}%`,
          top: `${layout.y}%`,
          "--tm-ko-orb-scale": layoutScale,
        } as CSSProperties
      }
      title={title}
      aria-hidden
    >
      <span className="tm-ko-orb-label">{label}</span>
    </div>
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
  const isLive = match?.status === "live";
  const columnX = matchPosition(geom).x;
  const slots = teamSlotLayouts(geom, columnX);
  const hasScore = savedHome != null && savedAway != null;
  const homeWins = hasScore && savedHome > savedAway;
  const awayWins = hasScore && savedAway > savedHome;
  const scoreSummary = match ? formatListScore(savedHome, savedAway) : " ";
  const isSaved = state === "saved";

  const scoreY = (slots.home.y + slots.away.y) / 2;

  return (
    <>
      <button
        type="button"
        disabled={!match}
        className={cn(
          "tm-ko-match-hit",
          `tm-ko-match-hit--${geom.round}`,
          !match && "tm-ko-match-hit--missing",
          isLive && "tm-ko-match-hit--live",
          isSaved && "tm-ko-match-hit--saved",
          state === "locked" && "tm-ko-match-hit--locked"
        )}
        style={
          {
            left: `${columnX}%`,
            top: `${geom.midY}%`,
            "--tm-ko-orb-scale": geom.layoutScale,
          } as CSSProperties
        }
        onClick={() => match && onOpen(match)}
        aria-label={
          match
            ? `Pronostico ${homeName} contra ${awayName}${
                scoreSummary.trim() ? `, ${scoreSummary}` : ""
              }`
            : `Partido ${geom.matchNumber} sin datos`
        }
      />
      <BracketTeamOrb
        teamName={homeName}
        round={geom.round}
        layout={slots.home}
        layoutScale={geom.layoutScale}
        isWinner={homeWins}
        isLive={isLive}
        isSaved={isSaved}
      />
      <BracketTeamOrb
        teamName={awayName}
        round={geom.round}
        layout={slots.away}
        layoutScale={geom.layoutScale}
        isWinner={awayWins}
        isLive={isLive}
        isSaved={isSaved}
      />
      {hasScore ? (
        <span
          className="tm-ko-match-score"
          style={{ left: `${columnX}%`, top: `${scoreY}%` }}
          aria-hidden
        >
          {scoreSummary}
        </span>
      ) : null}
    </>
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
