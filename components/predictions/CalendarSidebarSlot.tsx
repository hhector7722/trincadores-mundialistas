import { CalendarGroupsPanel } from "@/components/predictions/CalendarGroupsPanel";
import { CalendarSidebarAccessDock } from "@/components/predictions/CalendarSidebarAccessDock";
import type { GroupStandingRow } from "@/lib/pool/group-standings";
import type { CalendarModalOpener } from "@/lib/predictions/calendar-data-access";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type CalendarSidebarSlotProps = {
  groups: GroupStandingRow[];
  gridColumn: string;
  gridRow: number;
  onGroupClick?: (groupCode: string) => void;
  onOpenAllGroups?: CalendarModalOpener;
  onOpenStats?: CalendarModalOpener;
  onOpenSquads?: CalendarModalOpener;
  className?: string;
};

export function CalendarSidebarSlot({
  groups,
  gridColumn,
  gridRow,
  onGroupClick,
  onOpenAllGroups,
  onOpenStats,
  onOpenSquads,
  className,
}: CalendarSidebarSlotProps) {
  const style: CSSProperties = {
    gridColumn,
    gridRow,
  };

  return (
    <div
      style={style}
      className={cn("tm-cal-sidebar-slot flex h-full min-h-0 min-w-0 flex-col", className)}
      aria-label="Panel lateral del calendario"
    >
      <span className="tm-cal-day-num shrink-0 opacity-0" aria-hidden="true">
        0
      </span>
      <div className="tm-cal-sidebar-body mt-0.5 flex min-h-0 min-w-0 flex-1 flex-col">
        <div
          className="tm-cal-sidebar-card tm-cal-sidebar-unified-card flex min-h-0 min-w-0 shrink-0 flex-col"
          aria-label="Panel de grupos y accesos del calendario"
        >
          <div className="tm-cal-sidebar-card-inner flex min-h-0 min-w-0 flex-1 flex-col">
            <h3 className="tm-cal-groups-title shrink-0">GRUPOS</h3>
            <div className="tm-cal-groups-block flex min-h-0 min-w-0 flex-1 flex-col justify-center">
              <CalendarGroupsPanel groups={groups} onGroupClick={onGroupClick} />
            </div>
            <CalendarSidebarAccessDock
              onOpenAllGroups={(options) => onOpenAllGroups?.(options)}
              onOpenStats={(options) => onOpenStats?.(options)}
              onOpenSquads={(options) => onOpenSquads?.(options)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
