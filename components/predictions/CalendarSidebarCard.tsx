import { CalendarGroupsPanel } from "@/components/predictions/CalendarGroupsPanel";
import type { GroupStandingRow } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type CalendarSidebarCardProps = {
  groups: GroupStandingRow[];
  gridColumn: string;
  gridRow: number;
  onGroupClick?: (groupCode: string) => void;
  className?: string;
};

export function CalendarSidebarCard({
  groups,
  gridColumn,
  gridRow,
  onGroupClick,
  className,
}: CalendarSidebarCardProps) {
  const style: CSSProperties = {
    gridColumn,
    gridRow,
  };

  return (
    <div
      style={style}
      className={cn(
        "tm-cal-sidebar-card flex h-full min-h-0 min-w-0 flex-col",
        className
      )}
      aria-label="Panel de grupos del calendario"
    >
      <div className="tm-cal-sidebar-card-inner h-full min-h-0 min-w-0 flex-1">
        <CalendarGroupsPanel groups={groups} onGroupClick={onGroupClick} />
      </div>
    </div>
  );
}
