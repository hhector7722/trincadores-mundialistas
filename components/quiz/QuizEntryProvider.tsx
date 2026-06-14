"use client";

import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { fetchQuizDayHubAction } from "@/actions/quiz";
import { QuizStartConfirmModal } from "@/components/quiz/QuizStartConfirmModal";
import { QuizWaitModal } from "@/components/quiz/QuizWaitModal";
import { QUIZ_COMING_SOON_MESSAGE } from "@/lib/quiz/date";
import { resolveQuizEntryAction } from "@/lib/quiz/entry-action";
import { buildQuizStartConfirmCopy } from "@/lib/quiz/start-confirm-copy";
import type { QuizDayHub } from "@/lib/quiz/types";
import { QUIZ_ACTIVE_NOTIFICATION_QUERY } from "@/lib/push/urls";

type QuizEntryContextValue = {
  requestQuizEntry: () => void;
  navigateQuizHub: () => void;
};

const QuizEntryContext = createContext<QuizEntryContextValue | null>(null);

export function useQuizEntry(): QuizEntryContextValue {
  const ctx = useContext(QuizEntryContext);
  if (!ctx) {
    throw new Error("useQuizEntry debe usarse dentro de QuizEntryProvider.");
  }
  return ctx;
}

const ALREADY_PLAYED_MESSAGE = "Hoy ya has jugado al quiz diario crack.";

function QuizEntryUrlOpener({ onOpen }: { onOpen: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get(QUIZ_ACTIVE_NOTIFICATION_QUERY) !== "1") return;

    onOpen();

    const params = new URLSearchParams(searchParams.toString());
    params.delete(QUIZ_ACTIVE_NOTIFICATION_QUERY);
    const nextQuery = params.toString();
    router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });
  }, [onOpen, pathname, router, searchParams]);

  return null;
}

export function QuizEntryProvider({
  quizHub: initialQuizHub,
  poolId,
  children,
}: {
  quizHub: QuizDayHub;
  poolId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [quizHub, setQuizHub] = useState(initialQuizHub);
  const [startConfirmOpen, setStartConfirmOpen] = useState(false);
  const [alreadyPlayedOpen, setAlreadyPlayedOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [pendingPlayHref, setPendingPlayHref] = useState<string | null>(null);
  const [confirmHub, setConfirmHub] = useState<QuizDayHub | null>(null);

  useEffect(() => {
    setQuizHub(initialQuizHub);
  }, [initialQuizHub]);

  const startConfirmCopy = useMemo(
    () => buildQuizStartConfirmCopy(confirmHub ?? quizHub),
    [confirmHub, quizHub]
  );
  const confirmLabel =
    startConfirmCopy.title === "Continuar quiz" ? "Continuar" : "Empezar";

  const runEntryAction = useCallback(
    async (hub: QuizDayHub) => {
      const action = resolveQuizEntryAction(hub);

      switch (action.type) {
        case "coming_soon":
          setComingSoonOpen(true);
          return;
        case "already_played":
          setAlreadyPlayedOpen(true);
          return;
        case "navigate":
          router.push(action.href);
          return;
        case "confirm_start":
          setConfirmHub(hub);
          setPendingPlayHref(action.href);
          setStartConfirmOpen(true);
          return;
      }
    },
    [router]
  );

  const requestQuizEntry = useCallback(() => {
    void (async () => {
      const fresh = await fetchQuizDayHubAction(poolId);
      const hub = fresh.ok ? fresh.data : initialQuizHub;
      setQuizHub(hub);
      await runEntryAction(hub);
    })();
  }, [initialQuizHub, poolId, runEntryAction]);

  const navigateQuizHub = useCallback(() => {
    router.push("/quiz");
  }, [router]);

  const confirmStart = useCallback(() => {
    if (!pendingPlayHref) return;
    setStartConfirmOpen(false);
    setConfirmHub(null);
    router.push(pendingPlayHref);
    setPendingPlayHref(null);
  }, [pendingPlayHref, router]);

  const closeStartConfirm = useCallback(() => {
    setStartConfirmOpen(false);
    setPendingPlayHref(null);
    setConfirmHub(null);
  }, []);

  const value = useMemo(
    () => ({ requestQuizEntry, navigateQuizHub }),
    [navigateQuizHub, requestQuizEntry]
  );

  return (
    <QuizEntryContext.Provider value={value}>
      {children}

      <QuizStartConfirmModal
        open={startConfirmOpen}
        title={startConfirmCopy.title}
        body={startConfirmCopy.body}
        confirmLabel={confirmLabel}
        onConfirm={confirmStart}
        onClose={closeStartConfirm}
      />

      <QuizWaitModal
        open={alreadyPlayedOpen}
        onClose={() => setAlreadyPlayedOpen(false)}
        message={ALREADY_PLAYED_MESSAGE}
      />

      <QuizWaitModal
        open={comingSoonOpen}
        onClose={() => setComingSoonOpen(false)}
        message={QUIZ_COMING_SOON_MESSAGE}
      />

      <Suspense fallback={null}>
        <QuizEntryUrlOpener onOpen={requestQuizEntry} />
      </Suspense>
    </QuizEntryContext.Provider>
  );
}
