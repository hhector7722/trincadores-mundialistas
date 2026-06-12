type CalendarGroupRowBadgeProps = {
  groupCode?: string | null;
};

export function CalendarGroupRowBadge({ groupCode }: CalendarGroupRowBadgeProps) {
  if (!groupCode) return null;

  return (
    <div className="tm-cal-match-group-row pointer-events-none absolute inset-x-0 top-0 z-[4] flex items-center justify-between px-0.5">
      <span className="tm-cal-match-group uppercase leading-none text-[var(--tm-accent)]">
        {groupCode.toUpperCase()}
      </span>
    </div>
  );
}
