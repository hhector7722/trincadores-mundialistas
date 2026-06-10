import type { MouseEvent, ReactNode } from "react";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

/** predictionModal: borde inferior de la fila de nombres (ancla MVP). */
export const PREDICTION_MODAL_NAMES_BOTTOM_CLASS =
  "top-[calc(1.15rem+2.5rem+0.25rem+0.625rem)] sm:top-[calc(1.15rem+2.75rem+0.25rem+0.625rem)]";

/** Altura reservada para plantilla / posibles alineaciones bajo el MVP. */
export const PREDICTION_MODAL_ACTIONS_ROW_CLASS = "h-8";

/** Card inicio: borde inferior de la fila de nombres de equipo (ancla MVP). */
export const HOME_CARD_NAMES_BOTTOM_CLASS =
  "top-[calc(2.5rem+0.25rem+0.625rem)] sm:top-[calc(2.75rem+0.25rem+0.625rem)]";

function TeamFlagCircle({ name }: { name: string }) {
  const flagCode = teamFlagCode(name);

  return (
    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)] sm:h-11 sm:w-11">
      {flagCode ? (
        <img
          src={teamFlagUrl(flagCode, 160)}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-display text-base text-[var(--tm-accent)]">
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}

function TeamNameLabel({ name }: { name: string }) {
  return (
    <p className="whitespace-nowrap text-center text-[10px] font-semibold leading-tight text-[var(--tm-fg)] sm:text-xs">
      {teamNameEs(name)}
    </p>
  );
}

function TeamFlagButton({ name, onClick }: { name: string; onClick?: () => void }) {
  const displayName = teamNameEs(name);

  if (!onClick) {
    return <TeamFlagCircle name={name} />;
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
      <TeamFlagCircle name={name} />
    </button>
  );
}

function TeamBlock({ name, onClick }: { name: string; onClick?: () => void }) {
  const displayName = teamNameEs(name);

  if (!onClick) {
    return (
      <div className="inline-flex w-max flex-col items-center gap-1">
        <TeamFlagCircle name={name} />
        <TeamNameLabel name={name} />
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
      <TeamFlagCircle name={name} />
      <TeamNameLabel name={name} />
    </button>
  );
}

type MatchTeamsDisplayProps = {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  isLive: boolean;
  groupCode?: string | null;
  showSectionLabel?: boolean;
  centerKickoff?: boolean;
  centerSlot?: ReactNode;
  /** Alinea centerSlot con el eje vertical de los nombres de equipo (debajo de la bandera). */
  centerSlotAlign?: "default" | "teamNames";
  /** Modal de pronóstico: equipos en 10%/90%, steppers en 34%/66% (entre bandera y centro). */
  layout?: "default" | "predictionModal";
  predictionLabel?: string;
  homeScoreSlot?: ReactNode;
  awayScoreSlot?: ReactNode;
  onHomeTeamClick?: () => void;
  onAwayTeamClick?: () => void;
};

export function MatchTeamsDisplay({
  homeTeam,
  awayTeam,
  kickoffAt,
  isLive,
  groupCode,
  showSectionLabel = false,
  centerKickoff = false,
  centerSlot,
  centerSlotAlign = "default",
  layout = "default",
  predictionLabel = "Mi pronóstico",
  homeScoreSlot,
  awayScoreSlot,
  onHomeTeamClick,
  onAwayTeamClick,
}: MatchTeamsDisplayProps) {
  const isPredictionModal = layout === "predictionModal";
  const homeAnchor = isPredictionModal ? "10%" : "15%";
  const awayAnchor = isPredictionModal ? "90%" : "85%";

  if (isPredictionModal) {
    return (
      <div className="relative w-full min-h-[calc(1.15rem+2.5rem+0.25rem+0.625rem)] sm:min-h-[calc(1.15rem+2.75rem+0.25rem+0.625rem)]">
        <p className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
          {predictionLabel}
        </p>

        <div className="absolute left-[10%] top-[1.15rem] flex -translate-x-1/2 flex-col items-center gap-1">
          <TeamFlagButton name={homeTeam} onClick={onHomeTeamClick} />
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
          <TeamFlagButton name={awayTeam} onClick={onAwayTeamClick} />
          <TeamNameLabel name={awayTeam} />
        </div>
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
        <div className={cn("absolute top-0 -translate-x-1/2")} style={{ left: homeAnchor }}>
          <TeamBlock name={homeTeam} onClick={onHomeTeamClick} />
        </div>

        <div className={cn("absolute top-0 -translate-x-1/2")} style={{ left: awayAnchor }}>
          <TeamBlock name={awayTeam} onClick={onAwayTeamClick} />
        </div>

        <div
          className={cn(
            "absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1",
            centerKickoff ? "top-1/2 -translate-y-1/2" : "top-0 pt-0.5"
          )}
        >
          <p className="text-center font-display text-xs font-semibold leading-tight text-[var(--tm-accent)] sm:text-sm">
            {formatKickoff(kickoffAt)}
          </p>
          {groupCode && (
            <p className="text-center text-[9px] font-semibold uppercase tracking-[0.12em] text-[var(--tm-muted)] sm:text-[10px]">
              GRUPO &apos;{groupCode.toUpperCase()}&apos;
            </p>
          )}
          {isLive && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-[var(--tm-live)]">
              Live
            </span>
          )}
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
