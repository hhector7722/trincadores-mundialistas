import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function HomeChampionTeamValue({
  team,
  abbrClassName = "text-[#CCFF00]",
}: {
  team: string;
  abbrClassName?: string;
}) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-0.5">
      <TeamFlagBadge name={team} size="xxs" loading="eager" className="shrink-0" />
      <span className={cn("truncate text-[10px] font-medium", abbrClassName)}>{teamAbbr(team)}</span>
    </span>
  );
}

export function HomeFinalistsTeamValue({ teamA, teamB }: { teamA: string; teamB: string }) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-0.5 text-[10px] font-medium text-[#CCFF00]">
      <span className="whitespace-nowrap">{teamAbbr(teamA)}</span>
      <span className="text-white/40">-</span>
      <span className="whitespace-nowrap">{teamAbbr(teamB)}</span>
    </span>
  );
}
