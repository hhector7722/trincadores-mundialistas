"use client";

import { useState } from "react";
import { CalendarDataAccessModal } from "@/components/predictions/CalendarDataAccessModal";
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
        onOpenAllGroups={onOpenAllGroups}
        onOpenStats={onOpenStats}
        onOpenSquads={onOpenSquads}
      />
    </>
  );
}
