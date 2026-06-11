"use client";

import { Suspense, createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { QuizActiveNotificationModal } from "@/components/notifications/QuizActiveNotificationModal";
import { QUIZ_ACTIVE_NOTIFICATION_QUERY } from "@/lib/push/urls";

type QuizActiveNotificationContextValue = {
  openQuizActiveModal: () => void;
};

const QuizActiveNotificationContext = createContext<QuizActiveNotificationContextValue | null>(
  null,
);

export function useQuizActiveNotificationModal(): QuizActiveNotificationContextValue {
  const ctx = useContext(QuizActiveNotificationContext);
  if (!ctx) {
    throw new Error("useQuizActiveNotificationModal debe usarse dentro del provider.");
  }
  return ctx;
}

function QuizActiveNotificationUrlOpener() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openQuizActiveModal } = useQuizActiveNotificationModal();

  useEffect(() => {
    if (searchParams.get(QUIZ_ACTIVE_NOTIFICATION_QUERY) !== "1") return;

    openQuizActiveModal();

    const params = new URLSearchParams(searchParams.toString());
    params.delete(QUIZ_ACTIVE_NOTIFICATION_QUERY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [openQuizActiveModal, pathname, router, searchParams]);

  return null;
}

export function QuizActiveNotificationProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  const openQuizActiveModal = useCallback(() => {
    setOpen(true);
  }, []);

  const value = useMemo(() => ({ openQuizActiveModal }), [openQuizActiveModal]);

  return (
    <QuizActiveNotificationContext.Provider value={value}>
      {children}
      <QuizActiveNotificationModal open={open} onClose={() => setOpen(false)} />
      <Suspense fallback={null}>
        <QuizActiveNotificationUrlOpener />
      </Suspense>
    </QuizActiveNotificationContext.Provider>
  );
}
