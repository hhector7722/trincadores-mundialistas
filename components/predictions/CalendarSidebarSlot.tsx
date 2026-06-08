import { CalendarGroupsPanel } from "@/components/predictions/CalendarGroupsPanel";
import { CalendarSidebarAccessDock } from "@/components/predictions/CalendarSidebarAccessDock";
import type { GroupStandingRow } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type CalendarSidebarSlotProps = {
  groups: GroupStandingRow[];
  gridColumn: string;
  gridRow: number;
  onGroupClick?: (groupCode: string) => void;
  onOpenAllGroups?: () => void;
  onOpenStats?: () => void;
  onOpenSquads?: () => void;
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
          className="tm-cal-sidebar-card tm-cal-sidebar-groups-card flex min-h-0 min-w-0 shrink-0 flex-col"
          aria-label="Panel de grupos del calendario"
        >
          <div className="tm-cal-sidebar-card-inner h-full min-h-0 min-w-0 flex-1">
            <section className="tm-cal-groups-section flex min-h-0 min-w-0 flex-col">
              <h3 className="tm-cal-groups-title shrink-0">GRUPOS</h3>
              <CalendarGroupsPanel groups={groups} onGroupClick={onGroupClick} />
            </section>
          </div>
        </div>

        <div
          className="tm-cal-sidebar-card tm-cal-sidebar-access-card flex min-h-0 min-w-0 shrink-0 flex-col"
          aria-label="Accesos del calendario"
        >
          <div className="tm-cal-sidebar-card-inner h-full min-h-0 min-w-0 flex-1">
            <CalendarSidebarAccessDock
              onOpenAllGroups={() => onOpenAllGroups?.()}
              onOpenStats={() => onOpenStats?.()}
              onOpenSquads={() => onOpenSquads?.()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
