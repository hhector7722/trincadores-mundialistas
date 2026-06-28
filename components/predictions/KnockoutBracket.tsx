"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { useKnockoutViewportLayout } from "@/components/predictions/useKnockoutViewportLayout";
import { usePathname } from "next/navigation";
import { QuickPredictionModal } from "@/components/predictions/QuickPredictionModal";
import { ImageLightboxModal } from "@/components/ui/image-lightbox-modal";
import { trackUsageModalOpen } from "@/lib/usage/client";

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
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { cn } from "@/lib/utils";

type KnockoutBracketProps = {
  poolId: string;
  matches: MatchWithPrediction[];
  currentProfileId?: string;
  isAdminUser?: boolean;
  onOpenMatch?: (match: MatchWithPrediction) => void;
};

const BRACKET_GEOMETRY = buildBracketGeometry();
const BRACKET_CONNECTORS = buildBracketConnectorPaths(BRACKET_GEOMETRY);
const FINAL_CENTER_Y = finalCenterYFromGeometry(BRACKET_GEOMETRY);
const KO_MASCOT_SRC = "/icons/psoe.png";
const RULES_IMG_SRC = "/icons/normas.png";

const PERRETE_CENTER_Y = gridRowToPercentY(1.7);
const NORMAS_CENTER_Y = gridRowToPercentY(12.8);

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
  isFinished,
  isLive,
  isSaved,
  side,
}: {
  teamName: string;
  layout: TeamSlotLayout;
  isWinner?: boolean;
  isFinished?: boolean;
  isLive?: boolean;
  isSaved?: boolean;
  side: "left" | "right" | "center";
}) {
  const trimmed = teamName.trim();
  if (!trimmed) return null;

  const isPlaceholder = isPlaceholderTeam(trimmed);
  const label = isPlaceholder ? knockoutBracketSlotLabel(teamName) : teamAbbr(teamName);
  const title = isPlaceholder ? label : teamNameEs(teamName);
  const fullName = isPlaceholder ? label : teamNameEs(teamName);

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
      {isPlaceholder ? (
        <span className="tm-ko-orb-label">{label}</span>
      ) : (
        <>
          <TeamFlagBadge 
            name={teamName} 
            size="sm" 
            className={cn("tm-ko-orb-flag", isFinished && "brightness-[0.6] grayscale-[0.5]")}
          />
          <span className={cn("tm-ko-orb-name", `tm-ko-orb-name--${side}`)}>
            {fullName}
          </span>
        </>
      )}
    </div>
  );
}

function BracketMatchNode({
  geom,
  match,
  matchMap,
  onOpen,
}: {
  geom: BracketMatchGeometry;
  match: MatchWithPrediction | null;
  matchMap: Map<number, MatchWithPrediction>;
  onOpen: (match: MatchWithPrediction) => void;
}) {
  const fallback = placeholderPairForMatchNumber(geom.matchNumber);
    
  function resolveDynamicTeamName(raw: string | undefined | null): string {
    const rawTrimmed = (raw ?? "").trim();
    // Si es un W__ o L__, intentamos autocompletarlo localmente buscando el resultado del partido previo
    if ((rawTrimmed.startsWith("W") || rawTrimmed.startsWith("L")) && !isNaN(Number(rawTrimmed.slice(1)))) {
      const isLoser = rawTrimmed.startsWith("L");
      const prevMatchNumber = Number(rawTrimmed.slice(1));
      const prevMatch = matchMap.get(prevMatchNumber);
      if (prevMatch && prevMatch.status === "finished" && prevMatch.officialHome != null && prevMatch.officialAway != null) {
        if (prevMatch.officialHome > prevMatch.officialAway) return isLoser ? prevMatch.away_team : prevMatch.home_team;
        else if (prevMatch.officialAway > prevMatch.officialHome) return isLoser ? prevMatch.home_team : prevMatch.away_team;
      }
    }
    // Si no pudimos autocompletar, aplicamos la regla de display normal
    return bracketSlotTeamName(rawTrimmed, geom.round);
  }

  const homeName = resolveDynamicTeamName(match?.home_team ?? fallback?.home);
  const awayName = resolveDynamicTeamName(match?.away_team ?? fallback?.away);
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
  const isFinished = match?.status === "finished";
  const displayHome = isFinished ? match?.officialHome : savedHome;
  const displayAway = isFinished ? match?.officialAway : savedAway;
  const hasScoreToDisplay = displayHome != null && displayAway != null;
  const scoreSummary = hasScoreToDisplay ? formatListScore(displayHome, displayAway) : " ";
  const isSaved = state === "saved";
  const isFinal = geom.round === "final";
  // Colocar los marcadores individuales debajo de cada bandera
  const homeScoreY = geom.homeY + 3.8;
  const awayScoreY = geom.awayY + 3.8;

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
        isWinner={!isFinished && savedHome != null && savedAway != null && savedHome > savedAway}
        isFinished={isFinished}
        isLive={isLive}
        isSaved={isSaved}
        side={geom.side}
      />
      <BracketTeamOrb
        teamName={awayName}
        layout={slots.away}
        isWinner={!isFinished && savedHome != null && savedAway != null && savedAway > savedHome}
        isFinished={isFinished}
        isLive={isLive}
        isSaved={isSaved}
        side={geom.side}
      />
      {hasScoreToDisplay ? (
        <>
          <span
            className={cn(
              "tm-ko-match-score font-normal",
              !isFinished ? "text-[#CCFF00]" : "text-white"
            )}
            style={{ left: `${slots.home.x}%`, top: `${homeScoreY}%` }}
            aria-hidden
          >
            {displayHome}
          </span>
          <span
            className={cn(
              "tm-ko-match-score font-normal",
              !isFinished ? "text-[#CCFF00]" : "text-white"
            )}
            style={{ left: `${slots.away.x}%`, top: `${awayScoreY}%` }}
            aria-hidden
          >
            {displayAway}
          </span>
        </>
      ) : null}
    </>
  );
}

export function KnockoutBracket({ 
  poolId, 
  matches, 
  currentProfileId, 
  isAdminUser = false,
  onOpenMatch 
}: KnockoutBracketProps) {
  const pathname = usePathname();
  const pageRef = useRef<HTMLDivElement>(null);
  const { navigate } = useAppNavigation();
  const [localMatches, setLocalMatches] = useState(matches);
  const [activeMatch, setActiveMatch] = useState<MatchWithPrediction | null>(null);
  const [mascotPreviewOpen, setMascotPreviewOpen] = useState(false);
  const [rulesPreviewOpen, setRulesPreviewOpen] = useState(false);
  const matchMap = useMemo(() => buildKnockoutMatchMap(localMatches), [localMatches]);
  const handleOpenMatch = onOpenMatch ?? setActiveMatch;

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
              className="tm-ko-perrete-frame tm-ko-perrete-trigger tm-circle-depth overflow-hidden rounded-md"
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

          <div
            className="tm-ko-normas"
            style={{
              left: "50%",
              top: `${NORMAS_CENTER_Y}%`,
            }}
          >
            <button
              type="button"
              className="tm-ko-normas-frame tm-ko-normas-trigger tm-circle-depth overflow-hidden rounded-md"
              onClick={() => setRulesPreviewOpen(true)}
              aria-label="Ver normas de eliminatorias"
            >
              <Image
                src={RULES_IMG_SRC}
                alt="Normas de Eliminatorias"
                width={1080}
                height={1920}
                className="tm-ko-normas-img"
              />
            </button>
            <span className="tm-ko-normas-text">PUNTUACIÓN</span>
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
                matchMap={matchMap}
                onOpen={handleOpenMatch}
              />
            ))}
          </div>
        </div>
      </div>

      <ImageLightboxModal
        open={mascotPreviewOpen}
        onClose={() => setMascotPreviewOpen(false)}
        src={KO_MASCOT_SRC}
        ariaLabel="Mascota KO"
      />

      <ImageLightboxModal
        open={rulesPreviewOpen}
        onClose={() => setRulesPreviewOpen(false)}
        src={RULES_IMG_SRC}
        ariaLabel="Normas de eliminatorias"
      />

      {!onOpenMatch && activeMatch ? (
        <QuickPredictionModal
          key={`${activeMatch.id}:${activeMatch.prediction?.updated_at ?? "none"}:${activeMatch.mvpPrediction?.updated_at ?? "no-mvp"}`}
          open
          onClose={() => setActiveMatch(null)}
          poolId={poolId}
          match={activeMatch}
          currentProfileId={currentProfileId}
          isAdminUser={isAdminUser}
          flagPlaceholderStyle="knockout"
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
