"use client";

import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

type QuizStartConfirmModalProps = {
  open: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
};

export function QuizStartConfirmModal({
  open,
  title,
  body,
  confirmLabel = "Empezar",
  onConfirm,
  onClose,
}: QuizStartConfirmModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} wrapperClassName="w-full max-w-sm">
      <div className="flex flex-col gap-4 px-1 pb-1">
        <p className="text-sm leading-relaxed text-[var(--tm-muted)]">{body}</p>
        <div className="flex shrink-0 flex-col gap-2">
          <Button type="button" className="w-full" onClick={onConfirm}>
            {confirmLabel}
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      </div>
    </Modal>
  );
}
