"use client";

import { useState } from "react";
import { CalendarDataAccessModal } from "@/components/predictions/CalendarDataAccessModal";
import type { CalendarModalOpener } from "@/lib/predictions/calendar-data-access";
import { cn } from "@/lib/utils";

type CalendarSidebarAccessDockProps = {
  onOpenAllGroups: CalendarModalOpener;
  onOpenStats: CalendarModalOpener;
  onOpenSquads: CalendarModalOpener;
  className?: string;
};

function wrapDataAccessOpen(
  setDataAccessOpen: (open: boolean) => void,
  openChild: CalendarModalOpener
): CalendarModalOpener {
  return (options) => {
    setDataAccessOpen(false);
    openChild({
      fromDataAccess: true,
      reopenDataAccess: () => setDataAccessOpen(true),
      ...options,
    });
  };
}

export function CalendarSidebarAccessDock({
  onOpenAllGroups,
  onOpenStats,
  onOpenSquads,
  className,
}: CalendarSidebarAccessDockProps) {
  const [dataAccessOpen, setDataAccessOpen] = useState(false);

  return (
    <>
      <div className={cn("tm-cal-sidebar-access-dock shrink-0", className)}>
        <div className="tm-cal-sidebar-access-grid">
          <button
            type="button"
            onClick={() => setDataAccessOpen(true)}
            className="tm-cal-sidebar-access-btn"
          >
            Ver datos
          </button>
        </div>
      </div>

      <CalendarDataAccessModal
        open={dataAccessOpen}
        onClose={() => setDataAccessOpen(false)}
        onOpenAllGroups={wrapDataAccessOpen(setDataAccessOpen, onOpenAllGroups)}
        onOpenStats={wrapDataAccessOpen(setDataAccessOpen, onOpenStats)}
        onOpenSquads={wrapDataAccessOpen(setDataAccessOpen, onOpenSquads)}
      />
    </>
  );
}
