"use client";

import { useState, type MouseEvent } from "react";
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { ProfileAvatar, type ProfileAvatarVariant } from "@/components/profile/ProfileAvatar";
import { cn } from "@/lib/utils";

type Props = {
  avatarUrl: string | null;
  label: string;
  className?: string;
  variant?: ProfileAvatarVariant;
  /** Evita navegacion cuando el avatar va dentro de un enlace (ranking). */
  stopNavigation?: boolean;
};

export function ProfileAvatarButton({
  avatarUrl,
  label,
  className,
  variant = "badge",
  stopNavigation = false,
}: Props) {
  const [open, setOpen] = useState(false);

  if (!avatarUrl) {
    return (
      <ProfileAvatar avatarUrl={null} label={label} className={className} variant={variant} />
    );
  }

  function onActivate(event: MouseEvent<HTMLButtonElement>) {
    if (stopNavigation) {
      event.preventDefault();
      event.stopPropagation();
    }
    setOpen(true);
  }

  return (
    <>
      <button
        type="button"
        aria-label={`Ver avatar de ${label}`}
        onClick={onActivate}
        className={cn(
          "shrink-0 outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tm-purple-deep)]",
          variant === "badge" && "rounded-full",
          variant === "profile" && "cursor-pointer rounded-xl",
          className
        )}
      >
        {variant === "profile" ? (
          <AvatarDisplay avatarUrl={avatarUrl} label={label} size="profile" />
        ) : (
          <ProfileAvatar
            avatarUrl={avatarUrl}
            label={label}
            className={className}
            variant={variant}
          />
        )}
      </button>
      <AvatarPreviewModal
        open={open}
        onClose={() => setOpen(false)}
        avatarUrl={avatarUrl}
        label={label}
      />
    </>
  );
}
