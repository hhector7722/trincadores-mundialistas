import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type LineupFormationInfoProps = {
  teamName: string;
  formationLabel?: string;
  className?: string;
};

/** Formación fuera del césped: bandera · selección · sistema táctico. */
export function LineupFormationInfo({
  teamName,
  formationLabel,
  className,
}: LineupFormationInfoProps) {
  if (!formationLabel) return null;

  return (
    <div
      className={cn(
        "flex w-full shrink-0 items-center justify-center gap-1 px-1 py-0.5",
        className
      )}
    >
      <TeamFlagBadge name={teamName} size="xs" />
      <span className="text-[10px] font-medium text-[var(--tm-fg)]">{teamNameEs(teamName)}</span>
      <span aria-hidden className="text-[10px] text-[var(--tm-muted)]">
        ·
      </span>
      <span className="text-[10px] font-semibold tabular-nums text-[var(--tm-fg)]">
        {formationLabel}
      </span>
    </div>
  );
}
