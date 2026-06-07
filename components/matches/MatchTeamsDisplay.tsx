import type { MouseEvent, ReactNode } from "react";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

function TeamBlock({ name, onClick }: { name: string; onClick?: () => void }) {
  const flagCode = teamFlagCode(name);
  const displayName = teamNameEs(name);

  const content = (
    <>
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
      <p className="whitespace-nowrap text-center text-[10px] font-semibold leading-tight text-[var(--tm-fg)] sm:text-xs">
        {displayName}
      </p>
    </>
  );

  if (!onClick) {
    return <div className="inline-flex w-max flex-col items-center gap-1">{content}</div>;
  }

  return (
    <button
      type="button"
      onClick={(event: MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        onClick();
      }}
      className="inline-flex min-h-12 w-max shrink-0 flex-col items-center justify-center gap-1 rounded-lg transition-opacity hover:opacity-80 active:opacity-70"
      aria-label={`Ver alineación de ${displayName}`}
    >
      {content}
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
  /** Modal de pronóstico: equipos en 10%/90%, etiqueta arriba y steppers bajo cada bandera. */
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
      <div className="relative w-full min-h-[6.75rem]">
        <p className="absolute left-1/2 top-0 -translate-x-1/2 whitespace-nowrap text-center text-[9px] font-semibold uppercase tracking-wider text-white/60">
          {predictionLabel}
        </p>

        <div className="absolute left-[10%] top-[1.15rem] flex -translate-x-1/2 flex-col items-center gap-0.5">
          <TeamBlock name={homeTeam} onClick={onHomeTeamClick} />
          {homeScoreSlot}
        </div>

        <div className="absolute left-[90%] top-[1.15rem] flex -translate-x-1/2 flex-col items-center gap-0.5">
          <TeamBlock name={awayTeam} onClick={onAwayTeamClick} />
          {awayScoreSlot}
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
          {centerSlot}
        </div>
      </div>
    </>
  );
}
