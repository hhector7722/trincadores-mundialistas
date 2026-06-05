import { cn } from "@/lib/utils";

function avatarInitials(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return "?";
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return trimmed.slice(0, 1).toUpperCase();
}

export function ProfileAvatar({
  avatarUrl,
  label,
  className = "h-8 w-8",
}: {
  avatarUrl: string | null;
  label: string;
  className?: string;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn("shrink-0 rounded-full object-cover", className)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-[var(--tm-border)] bg-[var(--tm-surface-elevated)] text-xs font-semibold text-[var(--tm-muted)]",
        className
      )}
      aria-hidden
    >
      {avatarInitials(label)}
    </span>
  );
}
