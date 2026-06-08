"use client";

import Image from "next/image";
import { Modal } from "@/components/ui/modal";

type Props = {
  open: boolean;
  onClose: () => void;
  avatarUrl: string;
  label: string;
};

export function AvatarPreviewModal({ open, onClose, avatarUrl, label }: Props) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={label}
      hideTitle
      hideHeaderDivider
      ariaLabel={`Avatar ampliado de ${label}`}
      className="max-w-xs border-[var(--tm-accent)]/20"
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="relative size-56 overflow-hidden rounded-full border-2 border-[var(--tm-accent)] shadow-[0_0_48px_rgba(217,255,0,0.2)]">
          <Image
            src={avatarUrl}
            alt={`Avatar de ${label}`}
            width={448}
            height={448}
            className="size-full object-cover"
          />
        </div>
        <p className="text-center font-display text-sm uppercase tracking-wide text-[var(--tm-fg)]">
          {label}
        </p>
      </div>
    </Modal>
  );
}
