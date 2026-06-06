"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import type { TournamentScorerRow } from "@/lib/pool/tournament-stats";
import { cn } from "@/lib/utils";

type CalendarSidebarFooterProps = {
  scorers: TournamentScorerRow[];
  onOpenAllGroups: () => void;
  onOpenStats: () => void;
  className?: string;
};

function SidebarColumnTitle({ children }: { children: ReactNode }) {
  return (
    <p className="tm-cal-sidebar-col-title shrink-0 truncate">
      {children}
    </p>
  );
}

export function CalendarSidebarFooter({
  scorers,
  onOpenAllGroups,
  onOpenStats,
  className,
}: CalendarSidebarFooterProps) {
  return (
    <div className={cn("tm-cal-sidebar-footer min-h-0", className)}>
      <div className="tm-cal-sidebar-col flex min-h-0 min-w-0 flex-col overflow-hidden">
        <SidebarColumnTitle>Goles</SidebarColumnTitle>
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

      <div className="tm-cal-sidebar-col tm-cal-sidebar-access-col flex min-h-0 min-w-0 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 flex-col items-stretch justify-evenly gap-1 px-0.5">
          <Link href="/predictions/knockout" className="tm-cal-sidebar-access-btn">
            Ver cuadro
          </Link>
          <button type="button" onClick={onOpenAllGroups} className="tm-cal-sidebar-access-btn">
            Ver grupos
          </button>
          <button type="button" onClick={onOpenStats} className="tm-cal-sidebar-access-btn">
            Ver stats
          </button>
        </div>
      </div>
    </div>
  );
}
