"use client";

import { createContext, useContext, useMemo } from "react";
import { useQuizEntry } from "@/components/quiz/QuizEntryProvider";

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

export function QuizActiveNotificationProvider({ children }: { children: React.ReactNode }) {
  const { requestQuizEntry } = useQuizEntry();

  const value = useMemo(
    () => ({ openQuizActiveModal: requestQuizEntry }),
    [requestQuizEntry],
  );

  return (
    <QuizActiveNotificationContext.Provider value={value}>
      {children}
    </QuizActiveNotificationContext.Provider>
  );
}
