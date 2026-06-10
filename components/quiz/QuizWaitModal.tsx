"use client";

import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";

type QuizWaitModalProps = {
  open: boolean;
  onClose: () => void;
  message: string;
};

export function QuizWaitModal({ open, onClose, message }: QuizWaitModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={message}
      hideTitle
      headerCompact
      hideHeaderDivider
      ariaLabel={message}
      wrapperClassName="w-full max-w-[min(100vw-1rem,28rem)]"
    >
      <div className="px-3 py-5 sm:px-4">
        <p
          className={cn(
            "whitespace-nowrap text-center font-semibold leading-tight tracking-tight text-[var(--tm-fg)]",
            "text-[length:clamp(0.6875rem,3.6vw,1.25rem)]"
          )}
        >
          {message}
        </p>
      </div>
    </Modal>
  );
}
