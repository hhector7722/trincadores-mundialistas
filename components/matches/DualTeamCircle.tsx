"use client";

import { TeamCamiFront } from "@/components/matches/TeamCamiFront";
import { cn } from "@/lib/utils";

type DualTeamCircleProps = {
  teams: string[];
  size?: "sm" | "md";
};

const dualSizeMap: Record<string, "sm" | "md"> = {
  sm: "sm",
  md: "sm",
};

export function DualTeamCircle({ teams, size = "md" }: DualTeamCircleProps) {
  const displayTeams = teams.slice(0, 2);
  if (displayTeams.length < 2) return null;

  const jerseySize = dualSizeMap[size];

  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <div className={cn(
        "relative flex items-center gap-0.5",
        size === "sm" ? "h-8" : "h-[3.25rem]"
      )}>
        <div className="relative z-[1] -mr-1">
          <TeamCamiFront team={displayTeams[0]} size={jerseySize} />
        </div>
        <span className={cn(
          "z-[2] flex shrink-0 items-center justify-center font-black leading-none text-[var(--tm-accent)]",
          size === "sm" ? "text-[6px] px-[1px]" : "text-[7px] px-0.5"
        )}>
          VS
        </span>
        <div className="relative z-[1] -ml-1">
          <TeamCamiFront team={displayTeams[1]} size={jerseySize} />
        </div>
      </div>
    </div>
  );
}
