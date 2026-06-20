"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Brain } from "lucide-react";
import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useCurrentUsername } from "@/lib/auth/current-username-context";
import {
  ACTIVE_QUIZ_RESEED_ANNOUNCEMENT,
  shouldShowQuizReseedAnnouncement,
} from "@/lib/quiz/reseed-announcement";
import {
  dismissQuizReseedAnnouncement,
  isQuizReseedAnnouncementDismissed,
} from "@/lib/quiz/reseed-announcement-storage";

type QuizReseedAnnouncementModalProps = {
  quizDate: string;
};

export function QuizReseedAnnouncementModal({ quizDate }: QuizReseedAnnouncementModalProps) {
  const username = useCurrentUsername();
  const pathname = usePathname();
  const { requestQuizEntry } = useQuizEntry();
  const [open, setOpen] = useState(false);
  const checkedRef = useRef(false);

  const eligible = shouldShowQuizReseedAnnouncement(username, quizDate);
  const onQuizPlay = pathname.startsWith("/quiz/play");

  const close = useCallback(() => {
    dismissQuizReseedAnnouncement(ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.announcementId);
    setOpen(false);
  }, []);

  useEffect(() => {
    if (!eligible || onQuizPlay || checkedRef.current) return;
    checkedRef.current = true;

    if (isQuizReseedAnnouncementDismissed(ACTIVE_QUIZ_RESEED_ANNOUNCEMENT.announcementId)) {
      return;
    }

    setOpen(true);
  }, [eligible, onQuizPlay]);

  if (!eligible) return null;

  return (
    <Modal
      open={open}
      onClose={close}
      title="Quiz actualizado"
      usageId="quiz-reseed-announcement"
      usageLabel="Quiz actualizado"
      opaque
      wrapperClassName="w-full max-w-[min(100vw-1rem,28rem)]"
    >
      <div className="flex flex-col gap-4 px-4 py-5 sm:px-5">
        <div className="flex justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--tm-accent)]/15 text-[var(--tm-accent)]">
            <Brain className="h-7 w-7" aria-hidden />
          </span>
        </div>

        <div className="space-y-3 text-center text-sm leading-relaxed text-[var(--tm-fg)]">
          <p>
            El quiz de hoy incluía una pregunta repetida e inválida (la respuesta se veía en la
            imagen). Lo hemos sustituido por un quiz nuevo con tres preguntas distintas.
          </p>
          <p className="text-[var(--tm-muted)]">
            Si ya habías jugado, tu intento anterior no cuenta: vuelve a hacer el quiz de hoy.
          </p>
        </div>

        <div className="flex w-full flex-col gap-2">
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              close();
              requestQuizEntry();
            }}
          >
            Ir al quiz de hoy
          </Button>
          <Button type="button" variant="ghost" className="w-full" onClick={close}>
            Entendido
          </Button>
        </div>
      </div>
    </Modal>
  );
}
