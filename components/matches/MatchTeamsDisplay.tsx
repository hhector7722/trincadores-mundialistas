import type { ReactNode } from "react";
import { formatKickoff } from "@/lib/pool/format-kickoff";
import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { cn } from "@/lib/utils";

function TeamBlock({ name }: { name: string }) {
  const flagCode = teamFlagCode(name);

  return (
    <div className="inline-flex w-max flex-col items-center gap-1">
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
        {name}
      </p>
    </div>
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
}: MatchTeamsDisplayProps) {
  return (
    <>
      {showSectionLabel && (
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[var(--tm-accent)]">
          {isLive ? "En juego" : "Proximo partido"}
        </p>
      )}

      <div className={cn("relative w-full min-h-[4.25rem]", showSectionLabel && "mt-2")}>
        <div className="absolute left-[15%] top-0 -translate-x-1/2">
          <TeamBlock name={homeTeam} />
        </div>

        <div className="absolute left-[85%] top-0 -translate-x-1/2">
          <TeamBlock name={awayTeam} />
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
