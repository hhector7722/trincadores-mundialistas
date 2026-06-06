import { CalendarGroupsPanel } from "@/components/predictions/CalendarGroupsPanel";
import { CalendarSidebarFooter } from "@/components/predictions/CalendarSidebarFooter";
import type { LeaderboardRow } from "@/lib/ranking/queries";
import type { GroupStandingRow } from "@/lib/pool/group-standings";
import type { TournamentScorerRow } from "@/lib/pool/tournament-stats";
import { cn } from "@/lib/utils";
import type { CSSProperties } from "react";

type CalendarSidebarCardProps = {
  groups: GroupStandingRow[];
  scorers: TournamentScorerRow[];
  leaderboardRows: LeaderboardRow[];
  currentProfileId?: string;
  gridColumn: string;
  gridRow: number;
  onGroupClick?: (groupCode: string) => void;
  onOpenAllGroups?: () => void;
  onOpenStats?: () => void;
  className?: string;
};

export function CalendarSidebarCard({
  groups,
  scorers,
  leaderboardRows,
  currentProfileId,
  gridColumn,
  gridRow,
  onGroupClick,
  onOpenAllGroups,
  onOpenStats,
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
        <section className="tm-cal-groups-section flex min-h-0 min-w-0 flex-col">
          <h3 className="tm-cal-groups-title shrink-0">GRUPOS</h3>
          <CalendarGroupsPanel groups={groups} onGroupClick={onGroupClick} />
        </section>

        <CalendarSidebarFooter
          scorers={scorers}
          leaderboardRows={leaderboardRows}
          currentProfileId={currentProfileId}
          onOpenAllGroups={() => onOpenAllGroups?.()}
          onOpenStats={() => onOpenStats?.()}
        />
      </div>
    </div>
  );
}
