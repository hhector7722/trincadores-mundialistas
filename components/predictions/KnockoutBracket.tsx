"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useKnockoutViewportLayout } from "@/components/predictions/useKnockoutViewportLayout";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { ImageLightboxModal } from "@/components/ui/image-lightbox-modal";
import { patchMatchMvpPrediction } from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import {
  formatListScore,
  resolvePredictionUiState,
} from "@/lib/predictions/edit-state";
import {
  buildBracketConnectorPaths,
  buildBracketGeometry,
  FINAL_CENTER_X,
  FINAL_CUP_OFFSET_ABOVE_FINAL,
  finalCenterYFromGeometry,
  finalHitSpanPercent,
  gridRowToPercentY,
  type BracketMatchGeometry,
} from "@/lib/predictions/knockout-bracket-geometry";
import {
  buildKnockoutMatchMap,
  placeholderPairForMatchNumber,
  resolveBracketMatch,
  type BracketRoundKey,
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
const BRACKET_CONNECTORS = buildBracketConnectorPaths(BRACKET_GEOMETRY);
const FINAL_CENTER_Y = finalCenterYFromGeometry(BRACKET_GEOMETRY);
/** Fila 2 de la rejilla guía (octavos superiores / banda cabecera). */
const PERRETE_CENTER_Y = gridRowToPercentY(2);
const KO_MASCOT_SRC = "/icons/psoe.png";

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

/** Solo dieciseisavos muestran placeholders (2A, 3º…); rondas posteriores quedan vacías hasta equipo real. */
function bracketSlotTeamName(
  raw: string | undefined | null,
  round: BracketRoundKey
): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return " ";
  if (round !== "r32" && isPlaceholderTeam(trimmed)) return " ";
  return trimmed;
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
  const fallback =
    geom.round === "r32" ? placeholderPairForMatchNumber(geom.matchNumber) : null;
  const homeName = bracketSlotTeamName(match?.home_team ?? fallback?.home, geom.round);
  const awayName = bracketSlotTeamName(match?.away_team ?? fallback?.away, geom.round);
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
            ? `Pronostico ${homeName.trim() || "pendiente"} contra ${
                awayName.trim() || "pendiente"
              }${scoreSummary.trim() ? `, ${scoreSummary}` : ""}`
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
  const [mascotPreviewOpen, setMascotPreviewOpen] = useState(false);
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
            className="tm-ko-perrete"
            style={{
              left: "50%",
              top: `${PERRETE_CENTER_Y}%`,
            }}
          >
            <button
              type="button"
              className="tm-ko-perrete-frame tm-ko-perrete-trigger tm-circle-depth overflow-hidden rounded-xl"
              onClick={() => setMascotPreviewOpen(true)}
              aria-label="Ampliar imagen"
            >
              <Image
                src={KO_MASCOT_SRC}
                alt=""
                width={1326}
                height={833}
                className="tm-ko-perrete-img"
                priority
              />
            </button>
          </div>

          <svg
            className="tm-ko-wires"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden
          >
            {BRACKET_CONNECTORS.map((segment, index) => (
              <path
                key={`${segment.variant}-${index}`}
                d={segment.d}
                className={cn(
                  "tm-ko-wire",
                  segment.variant !== "default" && `tm-ko-wire--${segment.variant}`
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

      <ImageLightboxModal
        open={mascotPreviewOpen}
        onClose={() => setMascotPreviewOpen(false)}
        src={KO_MASCOT_SRC}
      />

      {activeMatch ? (
        <QuickPredictionModal
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}:${activeMatch.mvpPrediction?.updated_at ?? "no-mvp"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
          onMvpSaved={(matchId, playerName, teamName, shirtNumber) => {
            const patch = (current: MatchWithPrediction) =>
              patchMatchMvpPrediction(current, playerName, teamName, shirtNumber);

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
