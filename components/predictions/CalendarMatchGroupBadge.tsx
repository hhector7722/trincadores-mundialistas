type CalendarMatchGroupBadgeProps = {
  groupCode?: string | null;
};

/** Letra de grupo en esquina superior izquierda de la card del calendario. */
export function CalendarMatchGroupBadge({ groupCode }: CalendarMatchGroupBadgeProps) {
  const group = groupCode?.trim();
  if (!group) return null;

  return (
    <span className="tm-cal-match-group tm-cal-match-group-badge pointer-events-none absolute left-0 top-0 z-[6] uppercase leading-none text-[var(--tm-accent)]">
      {group.toUpperCase()}
    </span>
  );
}
