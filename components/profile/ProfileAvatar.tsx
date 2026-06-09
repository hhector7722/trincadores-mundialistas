import { cn } from "@/lib/utils";

export type ProfileAvatarVariant = "badge" | "profile" | "tile";

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
  variant = "badge",
}: {
  avatarUrl: string | null;
  label: string;
  className?: string;
  variant?: ProfileAvatarVariant;
}) {
  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        className={cn(
          variant === "tile" ? "h-full w-full object-cover" : "shrink-0 object-contain",
          variant === "badge" && "rounded-full",
          (variant === "profile" || variant === "tile") && "rounded-xl",
          className
        )}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex items-center justify-center bg-[var(--tm-surface-elevated)] text-xs font-semibold text-[var(--tm-muted)]",
        variant === "badge" ? "shrink-0 rounded-full" : "h-full w-full rounded-xl",
        className
      )}
      aria-hidden
    >
      {avatarInitials(label)}
    </span>
  );
}
