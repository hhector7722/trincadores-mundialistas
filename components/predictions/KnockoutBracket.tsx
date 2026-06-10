"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useKnockoutViewportLayout } from "@/components/predictions/useKnockoutViewportLayout";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { patchMatchMvpPrediction } from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  buildBracketGeometry,
  FINAL_CENTER_X,
  FINAL_CUP_OFFSET_ABOVE_FINAL,
  finalCenterYFromGeometry,
  finalHitSpanPercent,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
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

const BRACKET_GEOMETRY = buildBracketGeometry();
const FINAL_CENTER_Y = finalCenterYFromGeometry(BRACKET_GEOMETRY);

type TeamSlotLayout = {
  x: number;
  y: number;
};

function teamSlotLayouts(geom: BracketMatchGeometry): {
  home: TeamSlotLayout;
  away: TeamSlotLayout;
} {
  return {
    home: { x: geom.homeX ?? geom.columnX, y: geom.homeY },
    away: { x: geom.awayX ?? geom.columnX, y: geom.awayY },
  };
}

function BracketTeamOrb({
  teamName,
  layout,
  isWinner,
  isLive,
  isSaved,
}: {
  teamName: string;
  layout: TeamSlotLayout;
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
        isWinner && "tm-ko-orb--winner",
        isLive && "tm-ko-orb--live",
        isSaved && "tm-ko-orb--saved"
      )}
      style={{ left: `${layout.x}%`, top: `${layout.y}%` }}
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
  const slots = teamSlotLayouts(geom);
  const hasScore = savedHome != null && savedAway != null;
  const homeWins = hasScore && savedHome > savedAway;
  const awayWins = hasScore && savedAway > savedHome;
  const scoreSummary = match ? formatListScore(savedHome, savedAway) : " ";
  const isSaved = state === "saved";
  const isFinal = geom.round === "final";

  const scoreY = geom.midY;
  const hitStyle: CSSProperties = isFinal
    ? {
        left: `${geom.columnX}%`,
        top: `${geom.midY}%`,
        width: `${finalHitSpanPercent()}%`,
        minHeight: "max(48px, var(--tm-ko-orb-size))",
      }
    : { left: `${geom.columnX}%`, top: `${geom.midY}%` };

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
        style={hitStyle}
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
        layout={slots.home}
        isWinner={homeWins}
        isLive={isLive}
        isSaved={isSaved}
      />
      <BracketTeamOrb
        teamName={awayName}
        layout={slots.away}
        isWinner={awayWins}
        isLive={isLive}
        isSaved={isSaved}
      />
      {hasScore ? (
        <span
          className="tm-ko-match-score"
          style={{ left: `${geom.columnX}%`, top: `${scoreY}%` }}
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
  const [localMatches, setLocalMatches] = useState(matches);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const matchMap = useMemo(() => buildKnockoutMatchMap(localMatches), [localMatches]);

  useEffect(() => {
    setLocalMatches(matches);
  }, [matches]);

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
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}:${activeMatch.mvpPrediction?.updated_at ?? "no-mvp"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
          onMvpSaved={(matchId, playerName, teamName) => {
            const patch = (current: MatchWithPrediction) =>
              patchMatchMvpPrediction(current, playerName, teamName);

            setLocalMatches((current) =>
              current.map((item) => (item.id === matchId ? patch(item) : item))
            );
            setActiveMatch((current) =>
              current?.id === matchId ? patch(current) : current
            );
          }}
        />
      ) : null}
    </div>
  );
}
