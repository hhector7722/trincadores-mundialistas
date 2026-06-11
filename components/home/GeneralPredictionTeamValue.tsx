import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr } from "@/lib/teams/display";

export function HomeChampionTeamValue({ team }: { team: string }) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-0.5 text-[10px] font-medium leading-none">
      <TeamFlagBadge name={team} size="text" loading="eager" className="shrink-0" />
      <span className="truncate text-[#CCFF00]">{teamAbbr(team)}</span>
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
