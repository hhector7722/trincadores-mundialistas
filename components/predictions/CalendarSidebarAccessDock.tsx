"use client";

import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
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
  const { navigate } = useAppNavigation();

  return (
    <div className={cn("tm-cal-sidebar-access-dock shrink-0", className)}>
      <div className="tm-cal-sidebar-access-grid">
        <button
          type="button"
          onClick={() => navigate("/predictions/knockout")}
          className="tm-cal-sidebar-access-btn"
        >
          Ver cuadro
        </button>
        <button type="button" onClick={onOpenAllGroups} className="tm-cal-sidebar-access-btn">
          Ver grupos
        </button>
        <button type="button" onClick={onOpenStats} className="tm-cal-sidebar-access-btn">
          Ver stats
        </button>
        <button type="button" onClick={onOpenSquads} className="tm-cal-sidebar-access-btn">
          Ver equipos
        </button>
      </div>
    </div>
  );
}
