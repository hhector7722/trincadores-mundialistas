"use client";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type QuizWaitModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  /** Mensaje corto en una sola línea (fuente más pequeña). */
  compact?: boolean;
};

export function QuizWaitModal({
  open,
  onClose,
  title,
  message,
  compact = false,
}: QuizWaitModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      headerTitleAlign="center"
      hideHeaderDivider
      wrapperClassName={cn("w-full", compact ? "max-w-sm" : "max-w-md")}
    >
      <div className={cn("text-center", compact ? "px-8 py-6" : "px-6 py-8")}>
        <p
          className={cn(
            "text-[var(--tm-fg)]",
            compact
              ? "text-[11px] leading-snug tracking-tight sm:text-xs"
              : "text-pretty text-base leading-relaxed"
          )}
        >
          {message}
        </p>
      </div>
    </Modal>
  );
}
