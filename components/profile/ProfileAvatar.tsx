import Image from "next/image";
import { getAvatarBadgeObjectPosition } from "@/lib/avatars/presets";
import { cn } from "@/lib/utils";

export type ProfileAvatarVariant = "badge" | "profile";

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
  if (variant === "profile") {
    if (avatarUrl) {
      return (
        <div className={cn("relative shrink-0 overflow-hidden rounded-xl", className)}>
          <Image
            src={avatarUrl}
            alt=""
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 200px"
          />
        </div>
      );
    }

    return (
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-xl bg-[var(--tm-surface-elevated)] text-xs font-semibold text-[var(--tm-muted)]",
          className
        )}
        aria-hidden
      >
        {avatarInitials(label)}
      </span>
    );
  }

  if (avatarUrl) {
    return (
      <div
        className={cn(
          "tm-circle-depth relative flex shrink-0 items-center justify-center overflow-hidden rounded-full",
          className
        )}
      >
        <Image
          src={avatarUrl}
          alt=""
          fill
          className="object-cover"
          style={{ objectPosition: getAvatarBadgeObjectPosition(avatarUrl) }}
          sizes="48px"
        />
      </div>
    );
  }

  return (
    <span
      className={cn(
        "tm-circle-depth flex shrink-0 items-center justify-center overflow-hidden rounded-full text-xs font-semibold text-[var(--tm-muted)]",
        className
      )}
      aria-hidden
    >
      {avatarInitials(label)}
    </span>
  );
}
