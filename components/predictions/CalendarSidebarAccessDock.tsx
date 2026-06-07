"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type CalendarSidebarAccessDockProps = {
  onOpenAllGroups: () => void;
  onOpenStats: () => void;
  onOpenSquads: () => void;
  className?: string;
};

export function CalendarSidebarAccessDock({
  onOpenAllGroups,
  onOpenStats,
  onOpenSquads,
  className,
}: CalendarSidebarAccessDockProps) {
  return (
    <div className={cn("tm-cal-sidebar-access-dock shrink-0", className)}>
      <div className="tm-cal-sidebar-access-grid">
        <Link href="/predictions/knockout" className="tm-cal-sidebar-access-btn">
          Ver cuadro
        </Link>
        <button type="button" onClick={onOpenAllGroups} className="tm-cal-sidebar-access-btn">
          Ver grupos
        </button>
        <button type="button" onClick={onOpenStats} className="tm-cal-sidebar-access-btn">
          Ver stats
        </button>
        <button type="button" onClick={onOpenSquads} className="tm-cal-sidebar-access-btn">
          Ver plantillas
        </button>
      </div>
    </div>
  );
}
