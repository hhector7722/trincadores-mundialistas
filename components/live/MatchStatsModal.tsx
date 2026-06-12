"use client";

import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal } from "@/components/ui/modal";
import { MatchStatsTable } from "@/components/live/MatchStatsTable";
import { buildMatchStatRows } from "@/lib/live/match-stats-rows";
import { displayGoals } from "@/lib/predictions/edit-state";
import type { MatchLiveStats } from "@/lib/live/types";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type MatchStatsOpenButtonProps = {
  onClick: () => void;
  className?: string;
  /** `muted` = enlace secundario bajo el CTA principal. */
  tone?: "live" | "muted";
};

export function MatchStatsOpenButton({ onClick, className, tone = "live" }: MatchStatsOpenButtonProps) {
  const muted = tone === "muted";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-12 w-full items-center justify-center transition-opacity hover:opacity-80 active:opacity-70",
        muted
          ? "min-h-10 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/50 hover:text-white/70"
          : "font-semibold uppercase tracking-[0.12em] text-[var(--tm-live)] text-[10px]",
        className,
      )}
    >
      Estadísticas
    </button>
  );
}

type MatchStatsModalProps = {
  open: boolean;
  onClose: () => void;
  homeTeam: string;
  awayTeam: string;
  homeGoals: number | null;
  awayGoals: number | null;
  stats: MatchLiveStats | null;
};

export function MatchStatsModal({
  open,
  onClose,
  homeTeam,
  awayTeam,
  homeGoals,
  awayGoals,
  stats,
}: MatchStatsModalProps) {
  const title = `${teamNameEs(homeTeam)} vs ${teamNameEs(awayTeam)}`;
  const scoreLabel =
    homeGoals != null && awayGoals != null ? displayGoals(homeGoals, awayGoals) : null;
  const hasStats = stats != null && buildMatchStatRows(stats).length > 0;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      stackElevated
      opaque
      className="max-h-[min(78dvh,34rem)]"
    >
      <div className="flex flex-col gap-3 p-4">
        <div className="relative flex min-h-[4.5rem] items-center justify-center">
          <div className="absolute left-[15%] top-1/2 z-[2] -translate-x-1/2 -translate-y-1/2">
            <TeamFlagBadge name={homeTeam} size="lg" />
          </div>
          <div className="absolute right-[15%] top-1/2 z-[2] -translate-y-1/2 translate-x-1/2">
            <TeamFlagBadge name={awayTeam} size="lg" />
          </div>
          {scoreLabel ? (
            <p className="font-display text-xl font-semibold tabular-nums text-white/95">{scoreLabel}</p>
          ) : null}
        </div>

        <div className="grid grid-cols-2 gap-2 px-1 text-center text-[10px] font-semibold uppercase tracking-wide text-white/70">
          <p className="truncate">{teamNameEs(homeTeam)}</p>
          <p className="truncate">{teamNameEs(awayTeam)}</p>
        </div>

        {hasStats && stats ? (
          <MatchStatsTable stats={stats} title="Estadísticas" />
        ) : (
          <p className="py-6 text-center text-sm text-[var(--tm-muted)]">
            Estadísticas no disponibles para este partido.
          </p>
        )}
      </div>
    </Modal>
  );
}
