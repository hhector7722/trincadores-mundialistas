import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";

export function HomeChampionTeamValue({ team }: { team: string }) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-0.5">
      <TeamFlagBadge name={team} size="xxs" loading="eager" className="shrink-0" />
      <span className="truncate text-[10px] font-medium text-[#CCFF00]">{teamNameEs(team)}</span>
    </span>
  );
}

export function HomeFinalistsTeamValue({ teamA, teamB }: { teamA: string; teamB: string }) {
  return (
    <span className="inline-flex max-w-full items-center justify-center gap-0.5 text-[10px] font-medium text-[#CCFF00]">
      <TeamFlagBadge name={teamA} size="xxs" loading="eager" className="shrink-0" />
      <span className="whitespace-nowrap">{teamAbbr(teamA)}</span>
      <span className="text-white/40">-</span>
      <span className="whitespace-nowrap">{teamAbbr(teamB)}</span>
      <TeamFlagBadge name={teamB} size="xxs" loading="eager" className="shrink-0" />
    </span>
  );
}
