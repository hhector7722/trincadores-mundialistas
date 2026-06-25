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
    <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-x-0.5 gap-y-0 w-full">
      <TeamFlagBadge name={team} size="xxs" loading="eager" className="shrink-0" />
      <span
        className={cn(
          "line-clamp-2 break-words text-right text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight",
          abbrClassName
        )}
      >
        {teamAbbr(team)}
      </span>
    </span>
  );
}

export function HomeFinalistsTeamValue({ teamA, teamB }: { teamA: string; teamB: string }) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center justify-end gap-x-0.5 gap-y-0 text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight text-[#CCFF00] w-full">
      <span className="break-words">{teamAbbr(teamA)}</span>
      <span className="text-white/40">-</span>
      <span className="break-words">{teamAbbr(teamB)}</span>
    </span>
  );
}
