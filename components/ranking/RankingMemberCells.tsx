"use client";

import { useState, type MouseEvent } from "react";
import { AvatarPreviewModal } from "@/components/profile/AvatarPreviewModal";
import { AvatarDisplay } from "@/components/profile/AvatarDisplay";
import { cn } from "@/lib/utils";

type Props = {
  avatarUrl: string | null;
  label: string;
  size: "ranking" | "mini";
  nameClassName?: string;
  /** Si false, el nombre no se trunca y la columna se ajusta al texto. */
  truncateName?: boolean;
  /** Evita navegacion del contenedor padre (p. ej. Link del home). */
  stopNavigation?: boolean;
};

export function RankingMemberCells({
  avatarUrl,
  label,
  size,
  nameClassName,
  truncateName = true,
  stopNavigation = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const canPreview = Boolean(avatarUrl);

  function onActivate(event: MouseEvent<HTMLButtonElement>) {
    if (stopNavigation) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (!canPreview) return;
    setOpen(true);
  }

  return (
    <>
      <div
        className={cn(
          "flex items-center gap-2.5",
          truncateName ? "min-w-0" : "w-max"
        )}
      >
        <button
          type="button"
          disabled={!canPreview}
          aria-label={canPreview ? `Ver avatar de ${label}` : undefined}
          onClick={onActivate}
          className={cn(
            "shrink-0 rounded-full outline-none transition-transform active:scale-95 focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tm-purple-deep)] disabled:cursor-default disabled:active:scale-100",
            canPreview && "cursor-pointer"
          )}
        >
          <AvatarDisplay avatarUrl={avatarUrl} label={label} size={size} />
        </button>
        <button
          type="button"
          disabled={!canPreview}
          onClick={onActivate}
          className={cn(
            "text-left outline-none transition-opacity focus-visible:ring-2 focus-visible:ring-[var(--tm-accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--tm-purple-deep)] disabled:cursor-default",
            truncateName ? "min-w-0 flex-1 truncate" : "whitespace-nowrap",
            canPreview && "cursor-pointer hover:opacity-80 active:opacity-70",
            nameClassName
          )}
        >
          {label}
        </button>
      </div>
      {canPreview ? (
        <AvatarPreviewModal
          open={open}
          onClose={() => setOpen(false)}
          avatarUrl={avatarUrl!}
          label={label}
        />
      ) : null}
    </>
  );
}
