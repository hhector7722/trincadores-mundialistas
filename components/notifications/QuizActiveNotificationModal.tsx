"use client";

import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { buildQuizActiveModalCopy } from "@/lib/notifications/quiz-active-copy";
import { QUIZ_PLAY_HREF } from "@/lib/quiz/play-routes";

type QuizActiveNotificationModalProps = {
  open: boolean;
  onClose: () => void;
};

const copy = buildQuizActiveModalCopy();

export function QuizActiveNotificationModal({ open, onClose }: QuizActiveNotificationModalProps) {
  const router = useRouter();

  function handlePlay() {
    onClose();
    router.push(QUIZ_PLAY_HREF);
  }

  return (
    <Modal open={open} onClose={onClose} title={copy.title} wrapperClassName="w-full max-w-sm">
      <div className="flex flex-col gap-4 px-1 pb-1">
        <p className="text-sm leading-relaxed text-[var(--tm-muted)]">{copy.body}</p>
        <div className="flex shrink-0 flex-col gap-2">
          <Button type="button" className="w-full" onClick={handlePlay}>
            Jugar
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={onClose}>
            Ahora no
          </Button>
        </div>
      </div>
    </Modal>
  );
}
