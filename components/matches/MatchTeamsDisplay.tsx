import type { MouseEvent, ReactNode } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

/** predictionModal: borde inferior de la fila de nombres (ancla MVP). */
export const PREDICTION_MODAL_NAMES_BOTTOM_CLASS =
  "top-[calc(1.15rem+2.5rem+0.25rem+0.625rem)] sm:top-[calc(1.15rem+2.75rem+0.25rem+0.625rem)]";

/** Altura reservada para plantilla / posibles alineaciones bajo el MVP (card inicio). */
export const PREDICTION_MODAL_ACTIONS_ROW_CLASS = "h-8";

/** Modal pronóstico: plantilla + MVP arriba, posibles alineaciones abajo. */
export const PREDICTION_MODAL_ACTIONS_STACKED_CLASS = "h-16";

/** Altura mínima del bloque equipos + acciones en modal pronóstico. */
export const PREDICTION_MODAL_TEAMS_BLOCK_MIN_H_CLASS = "min-h-[10.5rem]";

/** Card inicio: borde inferior de la fila de nombres de equipo (ancla MVP). */
export const HOME_CARD_NAMES_BOTTOM_CLASS =
  "top-[calc(2.5rem+0.25rem+0.625rem)] sm:top-[calc(2.75rem+0.25rem+0.625rem)]";

/** Card inicio: plantilla + MVP arriba, posibles alineaciones abajo. */
export const HOME_CARD_ACTIONS_STACKED_CLASS = "h-[4.5rem]";

/** Card próximo partido: acciones justo bajo plantilla (sin hueco central como en live). */
export const HOME_CARD_SCHEDULED_ACTIONS_TOP_CLASS = "top-[3rem]";

/**
 * Card próximo partido: 3 filas de acciones + 2 huecos gap-1.
 * 1.25rem + 0.25rem + 1rem + 0.25rem + 1.25rem ≈ 4rem; reserva 4.5rem.
 */
export const HOME_CARD_SCHEDULED_ACTIONS_STACKED_CLASS = "h-[4.5rem]";

/** Card inicio con carrusel: compensa mt-2 + h-1.5 de los indicadores inferiores. */
export const HOME_CARD_CAROUSEL_INDICATORS_OFFSET = "0.875rem";

/** Card próximo partido: bloque equipos ajustado al contenido (3.25rem + 4.25rem). */
export const HOME_CARD_SCHEDULED_TEAMS_BLOCK_CLASS = "relative mt-2 h-[7.5rem] overflow-hidden";

export const HOME_CARD_SCHEDULED_TEAMS_BLOCK_CAROUSEL_CLASS = `relative mt-2 h-[calc(7.5rem-${HOME_CARD_CAROUSEL_INDICATORS_OFFSET})] overflow-hidden`;

/** Card inicio: bloque equipos + acciones apiladas (altura fija, igual live / próximo). */
export const HOME_CARD_TEAMS_BLOCK_CLASS = "relative mt-2 h-[8.5rem] overflow-hidden";

export const HOME_CARD_TEAMS_BLOCK_CAROUSEL_CLASS = `relative mt-2 h-[calc(8.5rem-${HOME_CARD_CAROUSEL_INDICATORS_OFFSET})] overflow-hidden`;

/** Card inicio: cabecera fija (badge EN JUEGO / Próximo partido). */
export const HOME_CARD_HEADER_CLASS =
  "relative flex h-6 shrink-0 items-center justify-between overflow-hidden";

/** Card inicio: slot reservado para dots del carrusel (mt-2 + h-1.5). */
export const HOME_CARD_CAROUSEL_INDICATORS_SLOT_CLASS =
  "mt-2 flex h-1.5 shrink-0 items-center justify-center gap-1.5";

/** Card inicio: altura mínima del cuerpo (cabecera + mt-2 + bloque equipos). */
export const HOME_CARD_BODY_MIN_H_CLASS = "min-h-[calc(1.5rem+0.5rem+8.5rem)]";

/** Card inicio: altura fija del cuerpo (evita que el slide crezca con el contenido). */
export const HOME_CARD_BODY_H_CLASS = "h-[calc(1.5rem+0.5rem+8.5rem)]";

/** Card próximo partido (sin carrusel): cuerpo ajustado al contenido compacto. */
export const HOME_CARD_SCHEDULED_BODY_H_CLASS = "h-[calc(1.5rem+0.5rem+7.5rem)]";

/** Card inicio en carrusel: cabecera + bloque equipos compacto (indicadores fuera del slide). */
export const HOME_CARD_BODY_MIN_H_CAROUSEL_CLASS = `min-h-[calc(1.5rem+0.5rem+8.5rem-${HOME_CARD_CAROUSEL_INDICATORS_OFFSET})]`;

/** Card inicio en carrusel: altura fija del slide. */
export const HOME_CARD_BODY_H_CAROUSEL_CLASS = `h-[calc(1.5rem+0.5rem+8.5rem-${HOME_CARD_CAROUSEL_INDICATORS_OFFSET})]`;

function TeamFlagCircle({
  name,
  placeholderStyle,
  size = "lg",
}: {
  name: string;
  placeholderStyle?: "default" | "knockout";
  size?: "sm" | "md" | "lg";
}) {
  return (
    <TeamFlagBadge
      name={name}
      size={size}
      loading="eager"
      placeholderStyle={placeholderStyle}
    />
  );
}

function TeamNameLabel({ name, compact }: { name: string; compact?: boolean }) {
  return (
    <p
      className={cn(
        "whitespace-nowrap text-center font-semibold leading-tight text-[var(--tm-fg)]",
        compact ? "text-[9px]" : "text-[10px] sm:text-xs",
      )}
    >
      {teamNameEs(name)}
    </p>
  );
}

function TeamFlagButton({
  name,
  onClick,
  placeholderStyle,
}: {
  name: string;
  onClick?: () => void;
  placeholderStyle?: "default" | "knockout";
}) {
  const displayName = teamNameEs(name);

  if (!onClick) {
    return <TeamFlagCircle name={name} placeholderStyle={placeholderStyle} />;
  }

  return (
    <button
      type="button"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick();
      }}
      className="shrink-0 rounded-full transition-opacity hover:opacity-80 active:opacity-70"
      aria-label={`Ver plantilla de ${displayName}`}
    >
      <TeamFlagCircle name={name} placeholderStyle={placeholderStyle} />
    </button>
  );
}

function TeamBlock({
  name,
  onClick,
  footerSlot,
  flagSize = "lg",
  compactName = false,
}: {
  name: string;
  onClick?: () => void;
  footerSlot?: ReactNode;
  flagSize?: "sm" | "md" | "lg";
  compactName?: boolean;
}) {
  const displayName = teamNameEs(name);

  if (footerSlot) {
    return (
      <div className="inline-flex w-max shrink-0 flex-col items-center gap-0.5">
        <TeamFlagCircle name={name} size={flagSize} />
        <TeamNameLabel name={name} compact={compactName} />
        {footerSlot}
      </div>
    );
  }

  if (!onClick) {
    return (
      <div className="inline-flex w-max flex-col items-center gap-1">
        <TeamFlagCircle name={name} size={flagSize} />
        <TeamNameLabel name={name} compact={compactName} />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex min-h-12 w-max shrink-0 flex-col items-center justify-center gap-1 rounded-lg transition-opacity hover:opacity-80 active:opacity-70"
      aria-label={`Ver plantilla de ${displayName}`}
    >
      <TeamFlagCircle name={name} size={flagSize} />
      <TeamNameLabel name={name} compact={compactName} />
    </button>
  );
}

type MatchTeamsDisplayProps = {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  isLive: boolean;
  hideKickoff?: boolean;
  groupCode?: string | null;
  showSectionLabel?: boolean;
  centerKickoff?: boolean;
  centerSlot?: ReactNode;
  /** Alinea centerSlot con el eje vertical de los nombres de equipo (debajo de la bandera). */
  centerSlotAlign?: "default" | "teamNames";
  /** Modal de pronóstico: equipos en 10%/90%, steppers en 34%/66% (entre bandera y centro). */
  layout?: "default" | "predictionModal";
  /** Texto placeholder del círculo de bandera (sin imagen). */
  flagPlaceholderStyle?: "default" | "knockout";
  predictionLabel?: string;
  hidePredictionLabel?: boolean;
  homeScoreSlot?: ReactNode;
  awayScoreSlot?: ReactNode;
  /** Desplazamiento vertical solo de bandera + nombre (p. ej. card inicio). */
  teamBlocksTopClass?: string;
  /** Enlace «Plantilla» bajo el nombre local. */
  homeFooterSlot?: ReactNode;
  /** Enlace «Plantilla» bajo el nombre visitante. */
  awayFooterSlot?: ReactNode;
  /** Bandera más compacta (card inicio con plantilla bajo el nombre). */
  compactTeamColumn?: boolean;
  onHomeTeamClick?: () => void;
  onAwayTeamClick?: () => void;
};

export function MatchTeamsDisplay({
  homeTeam,
  awayTeam,
  kickoffAt,
  isLive,
  hideKickoff = false,
  groupCode,
  showSectionLabel = false,
  centerKickoff = false,
  centerSlot,
  centerSlotAlign = "default",
  layout = "default",
  flagPlaceholderStyle = "default",
  predictionLabel = "Mi pronóstico",
  hidePredictionLabel = false,
  homeScoreSlot,
  awayScoreSlot,
  onHomeTeamClick,
  onAwayTeamClick,
  teamBlocksTopClass,
  homeFooterSlot,
  awayFooterSlot,
  compactTeamColumn = false,
}: MatchTeamsDisplayProps) {
  const isPredictionModal = layout === "predictionModal";
  const homeAnchor = isPredictionModal ? "10%" : "15%";
  const awayAnchor = isPredictionModal ? "90%" : "85%";
  const teamFlagSize = compactTeamColumn ? "sm" : "lg";
  const teamColumnCompact = compactTeamColumn || Boolean(homeFooterSlot || awayFooterSlot);

  if (isPredictionModal) {
    return (
      <div className="relative w-full min-h-[calc(1.15rem+2.5rem+0.25rem+0.625rem)] sm:min-h-[calc(1.15rem+2.75rem+0.25rem+0.625rem)]">
        {!hidePredictionLabel ? (
          <p className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
            {predictionLabel}
          </p>
        ) : null}

        <div className="absolute left-[10%] top-[1.15rem] flex -translate-x-1/2 flex-col items-center gap-1">
          <TeamFlagButton
            name={homeTeam}
            onClick={onHomeTeamClick}
            placeholderStyle={flagPlaceholderStyle}
          />
          <TeamNameLabel name={homeTeam} />
        </div>

        {homeScoreSlot ? (
          <div className="absolute left-[34%] top-[1.15rem] flex h-10 -translate-x-1/2 items-center sm:h-11">
            {homeScoreSlot}
          </div>
        ) : null}

        {awayScoreSlot ? (
          <div className="absolute left-[66%] top-[1.15rem] flex h-10 -translate-x-1/2 items-center sm:h-11">
            {awayScoreSlot}
          </div>
        ) : null}

        <div className="absolute left-[90%] top-[1.15rem] flex -translate-x-1/2 flex-col items-center gap-1">
          <TeamFlagButton
            name={awayTeam}
            onClick={onAwayTeamClick}
            placeholderStyle={flagPlaceholderStyle}
          />
          <TeamNameLabel name={awayTeam} />
        </div>

        {centerSlot ? (
          <div
            className={cn(
              "absolute left-1/2 -translate-x-1/2",
              centerSlotAlign === "teamNames"
                ? "top-[calc(1.15rem+2.5rem+0.25rem+0.625rem)] sm:top-[calc(1.15rem+2.75rem+0.25rem+0.625rem)]"
                : "top-[1.15rem]",
            )}
          >
            {centerSlot}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {showSectionLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
          {isLive ? "En juego" : "Proximo partido"}
        </p>
      )}

      <div className={cn("relative w-full min-h-[4.25rem]", showSectionLabel && "mt-2")}>
        <div
          className={cn("absolute top-0 -translate-x-1/2", teamBlocksTopClass)}
          style={{ left: homeAnchor }}
        >
          <TeamBlock
            name={homeTeam}
            onClick={homeFooterSlot ? undefined : onHomeTeamClick}
            footerSlot={homeFooterSlot}
            flagSize={teamFlagSize}
            compactName={teamColumnCompact}
          />
        </div>

        <div
          className={cn("absolute top-0 -translate-x-1/2", teamBlocksTopClass)}
          style={{ left: awayAnchor }}
        >
          <TeamBlock
            name={awayTeam}
            onClick={awayFooterSlot ? undefined : onAwayTeamClick}
            footerSlot={awayFooterSlot}
            flagSize={teamFlagSize}
            compactName={teamColumnCompact}
          />
        </div>

        {homeScoreSlot ? (
          <div
            className={cn(
              "absolute left-[32.5%] flex h-10 -translate-x-1/2 items-center sm:h-11",
              teamBlocksTopClass,
            )}
          >
            {homeScoreSlot}
          </div>
        ) : null}

        {awayScoreSlot ? (
          <div
            className={cn(
              "absolute left-[67.5%] flex h-10 -translate-x-1/2 items-center sm:h-11",
              teamBlocksTopClass,
            )}
          >
            {awayScoreSlot}
          </div>
        ) : null}

        <div
          className={cn(
            "absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1",
            centerKickoff ? "top-1/2 -translate-y-1/2" : "top-0 pt-0.5"
          )}
        >
          {!hideKickoff ? (
            <p className="text-center font-display text-xs font-semibold leading-tight text-[var(--tm-accent)] sm:text-sm">
              {formatKickoff(kickoffAt)}
            </p>
          ) : null}
          {groupCode && (
            <p className="text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-muted)] sm:text-[10px]">
              GRUPO &apos;{groupCode.toUpperCase()}&apos;
            </p>
          )}
          {isLive && !hideKickoff ? (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--tm-live)]">
              Live
            </span>
          ) : null}
          {centerSlotAlign === "default" ? centerSlot : null}
        </div>
        {centerSlot && centerSlotAlign === "teamNames" ? (
          <div className="absolute left-1/2 top-[calc(2.5rem+0.25rem+0.375rem)] -translate-x-1/2 -translate-y-1/2 sm:top-[calc(2.75rem+0.25rem+0.375rem)]">
            {centerSlot}
          </div>
        ) : null}
      </div>
    </>
  );
}
