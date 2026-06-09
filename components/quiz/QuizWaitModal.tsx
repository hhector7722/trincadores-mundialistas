"use client";

import { Modal } from "@/components/ui/modal";

type QuizWaitModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
};

export function QuizWaitModal({ open, onClose, title, message }: QuizWaitModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      headerTitleAlign="center"
      hideHeaderDivider
      wrapperClassName="w-full max-w-md"
    >
      <div className="px-6 py-8 text-center">
        <p className="text-pretty text-base leading-relaxed text-[var(--tm-fg)]">{message}</p>
      </div>
    </Modal>
  );
}
