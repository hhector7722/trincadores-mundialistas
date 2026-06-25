import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

export function HomeChampionTeamValue({
  team,
  abbrClassName = "text-[#CCFF00]",
}: {
  team: string;
  abbrClassName?: string;
}) {
  return (
    <span className="inline-flex max-w-full flex-nowrap items-center justify-end gap-x-0.5 gap-y-0 w-full">
      <TeamFlagBadge name={team} size="xxs" loading="eager" className="shrink-0" />
      <span
        className={cn(
          "whitespace-nowrap text-right text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight",
          abbrClassName
        )}
      >
        {teamNameEs(team)}
      </span>
    </span>
  );
}

export function HomeFinalistsTeamValue({ teamA, teamB }: { teamA: string; teamB: string }) {
  return (
    <span className="inline-flex max-w-full flex-nowrap items-center justify-end gap-x-1 w-full">
      <TeamFlagBadge name={teamA} size="xxs" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight text-[#CCFF00]">{teamNameEs(teamA)}</span>
      <span className="text-white/40 shrink-0">-</span>
      <TeamFlagBadge name={teamB} size="xxs" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap text-[clamp(8px,2.4cqw,10px)] font-medium leading-tight text-[#CCFF00]">{teamNameEs(teamB)}</span>
    </span>
  );
}
