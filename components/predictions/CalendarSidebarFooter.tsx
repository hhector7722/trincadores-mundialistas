"use client";

import type { ReactNode } from "react";
import { HeroCtaButton, HeroCtaLink } from "@/components/ui/hero-cta";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import type { TournamentScorerRow } from "@/lib/pool/tournament-stats";
import { cn } from "@/lib/utils";

type CalendarSidebarFooterProps = {
  scorers: TournamentScorerRow[];
  leaderboardRows: LeaderboardRow[];
  currentProfileId?: string;
  onOpenAllGroups: () => void;
  onOpenStats: () => void;
  className?: string;
};

function SidebarColumnTitle({ children }: { children: ReactNode }) {
  return (
    <p className="tm-cal-sidebar-col-title shrink-0 truncate text-[clamp(6px,1.6cqw,8px)] font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
      {children}
    </p>
  );
}

export function CalendarSidebarFooter({
  scorers,
  leaderboardRows,
  currentProfileId,
  onOpenAllGroups,
  onOpenStats,
  className,
}: CalendarSidebarFooterProps) {
  return (
    <div className={cn("tm-cal-sidebar-footer min-h-0", className)}>
      <div className="tm-cal-sidebar-col flex min-h-0 min-w-0 flex-col overflow-hidden">
        <SidebarColumnTitle>Goleadores</SidebarColumnTitle>
        <ul className="tm-cal-sidebar-scorers mt-0.5 min-h-0 flex-1 overflow-hidden">
          {scorers.length === 0 ? (
            <li className="tm-cal-sidebar-list-row text-[var(--tm-muted)]">Sin datos</li>
          ) : (
            scorers.map((row) => (
              <li key={row.player} className="tm-cal-sidebar-list-row flex min-w-0 items-baseline gap-1">
                <span className="min-w-0 flex-1 truncate">{row.player}</span>
                <span className="shrink-0 tabular-nums text-[var(--tm-accent)]">{row.goals}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="tm-cal-sidebar-col flex min-h-0 min-w-0 flex-col overflow-hidden">
        <SidebarColumnTitle>Tabla</SidebarColumnTitle>
        <ul className="tm-cal-sidebar-ranking mt-0.5 min-h-0 flex-1 overflow-hidden">
          {leaderboardRows.length === 0 ? (
            <li className="tm-cal-sidebar-list-row text-[var(--tm-muted)]">Sin datos</li>
          ) : (
            leaderboardRows.map((row) => (
              <li
                key={row.profileId}
                className={cn(
                  "tm-cal-sidebar-list-row flex min-w-0 items-baseline gap-1",
                  row.profileId === currentProfileId && "text-[var(--tm-accent)]"
                )}
              >
                <span className="w-3 shrink-0 tabular-nums">{row.position}</span>
                <span className="min-w-0 flex-1 truncate">{row.label}</span>
                <span className="shrink-0 tabular-nums">{row.cumulativePoints}</span>
              </li>
            ))
          )}
        </ul>
      </div>

      <div className="tm-cal-sidebar-col flex min-h-0 min-w-0 flex-col gap-1 overflow-hidden">
        <SidebarColumnTitle>Accesos</SidebarColumnTitle>
        <div className="flex min-h-0 flex-1 flex-col justify-evenly gap-0.5">
          <HeroCtaLink href="/predictions/knockout" className="min-h-0 py-0.5">
            Ver cuadro
          </HeroCtaLink>
          <HeroCtaButton onClick={onOpenAllGroups} className="min-h-0 py-0.5">
            Ver grupos
          </HeroCtaButton>
          <HeroCtaButton onClick={onOpenStats} className="min-h-0 py-0.5">
            Ver stats
          </HeroCtaButton>
        </div>
      </div>
    </div>
  );
}
