"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { startQuiz, submitQuiz } from "@/actions/quiz";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
import { QuizDailyIntro } from "@/components/quiz/QuizDailyIntro";
import { QuizQuestionStage } from "@/components/quiz/QuizQuestionStage";
import { LoadingCenter } from "@/components/ui/spinner";
import type { QuestionPhase } from "@/lib/quiz/play-flow";
import {
  FEEDBACK_DELAY_MS,
  nextStepAfterFeedback,
  pickWrongOptionId,
  QUESTION_TIME_SEC,
  shouldAutoSubmit,
} from "@/lib/quiz/play-flow";
import { QUIZ_PLAY_ENTER_MS } from "@/lib/quiz/intro";
import type { QuizStartSession } from "@/lib/quiz/types";
import { cn } from "@/lib/utils";

type QuizPlaySessionProps = {
  poolId: string;
  quizId: string;
  /** Sin entradilla al reanudar un intento en curso. */
  skipIntro?: boolean;
};

const PLAY_TITLE = "¿QUIEN SHANELA MÁS DE LOS MUNDIALES?";

export function QuizPlaySession({ poolId, quizId, skipIntro = false }: QuizPlaySessionProps) {
  const router = useRouter();
  const { navigate } = useAppNavigation();
  const [introDone, setIntroDone] = useState(skipIntro);
  const [quizRevealed, setQuizRevealed] = useState(skipIntro);
  const [session, setSession] = useState<QuizStartSession | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<QuestionPhase>("answering");
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_TIME_SEC);
  const [loading, startLoading] = useTransition();
  const [submitting, startSubmitting] = useTransition();

  const submittedRef = useRef(false);
  const advancingRef = useRef(false);
  const feedbackTimerRef = useRef<number | null>(null);
  const questionTimerRef = useRef<number | null>(null);
  const playScrollRef = useRef<HTMLDivElement>(null);
  const pendingRevealRef = useRef(skipIntro);
  const stepRef = useRef(step);
  const phaseRef = useRef(phase);
  const sessionRef = useRef(session);
  const answersRef = useRef(answers);

  const playReady = Boolean(session) && !loading && !loadError;
  const contentVisible =
    (playReady && (skipIntro || (quizRevealed && introDone))) ||
    (Boolean(loadError) && (skipIntro || introDone));

  useEffect(() => {
    stepRef.current = step;
  }, [step]);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);

  const clearQuestionTimer = useCallback(() => {
    if (questionTimerRef.current !== null) {
      window.clearInterval(questionTimerRef.current);
      questionTimerRef.current = null;
    }
  }, []);

  const clearFeedbackTimer = useCallback(() => {
    if (feedbackTimerRef.current !== null) {
      window.clearTimeout(feedbackTimerRef.current);
      feedbackTimerRef.current = null;
    }
    advancingRef.current = false;
  }, []);

  const clearAllTimers = useCallback(() => {
    clearQuestionTimer();
    clearFeedbackTimer();
  }, [clearQuestionTimer, clearFeedbackTimer]);

  useEffect(() => {
    startLoading(async () => {
      const result = await startQuiz(poolId, quizId);
      if (!result.ok) {
        setLoadError(result.error);
        return;
      }
      setSession(result.data);
      setLoadError(null);
    });
  }, [poolId, quizId]);

  const questions = session?.questions ?? [];
  const currentQuestion = questions[step] ?? null;

  const handleSubmit = useCallback(
    (finalAnswers: Record<string, string>) => {
      const activeSession = sessionRef.current;
      if (!activeSession || submittedRef.current) return;
      submittedRef.current = true;
      clearAllTimers();
      setSubmitError(null);

      startSubmitting(async () => {
        const result = await submitQuiz(poolId, activeSession.attempt_id, finalAnswers);
        if (!result.ok) {
          submittedRef.current = false;
          setSubmitError(result.error);
          return;
        }
        navigate(`/quiz/result?attempt=${activeSession.attempt_id}`);
        router.refresh();
      });
    },
    [clearAllTimers, navigate, poolId, router]
  );

  const scheduleAdvance = useCallback(
    (nextAnswers: Record<string, string>) => {
      if (advancingRef.current) return;
      clearFeedbackTimer();
      advancingRef.current = true;

      feedbackTimerRef.current = window.setTimeout(() => {
        feedbackTimerRef.current = null;
        advancingRef.current = false;

        const activeSession = sessionRef.current;
        const currentStep = stepRef.current;
        const total = activeSession?.questions.length ?? 0;
        if (!activeSession || total === 0) return;

        if (shouldAutoSubmit(currentStep, total)) {
          handleSubmit(nextAnswers);
          return;
        }

        const next = nextStepAfterFeedback(currentStep, total);
        if (next !== null) {
          setStep(next);
          setPhase("answering");
          setSecondsLeft(QUESTION_TIME_SEC);
        }
      }, FEEDBACK_DELAY_MS);
    },
    [clearFeedbackTimer, handleSubmit]
  );

  const resolveAnswer = useCallback(
    (optionId: string) => {
      const question = sessionRef.current?.questions[stepRef.current];
      if (!question || phaseRef.current !== "answering" || advancingRef.current) return;

      clearQuestionTimer();
      const next = { ...answersRef.current, [question.id]: optionId };
      setAnswers(next);
      setPhase("feedback");
      scheduleAdvance(next);
    },
    [clearQuestionTimer, scheduleAdvance]
  );

  const handleTimeout = useCallback(() => {
    const question = sessionRef.current?.questions[stepRef.current];
    if (!question || phaseRef.current !== "answering" || advancingRef.current) return;

    clearQuestionTimer();
    const wrongId = pickWrongOptionId(question.options, question.correct_option_id);
    const next = { ...answersRef.current, [question.id]: wrongId };
    setAnswers(next);
    setPhase("feedback");
    scheduleAdvance(next);
  }, [clearQuestionTimer, scheduleAdvance]);

  useEffect(() => {
    if (!currentQuestion || phase !== "answering" || !contentVisible) {
      clearQuestionTimer();
      return;
    }

    setSecondsLeft(QUESTION_TIME_SEC);
    clearQuestionTimer();

    questionTimerRef.current = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearQuestionTimer();
          window.setTimeout(() => handleTimeout(), 0);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return clearQuestionTimer;
  }, [clearQuestionTimer, contentVisible, currentQuestion?.id, handleTimeout, phase, step]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  useEffect(() => {
    if (!pendingRevealRef.current || !playReady) return;
    setQuizRevealed(true);
  }, [playReady]);

  useEffect(() => {
    if (!contentVisible || !currentQuestion) return;
    const scrollEl = playScrollRef.current;
    if (!scrollEl) return;
    scrollEl.scrollTop = 0;
  }, [contentVisible, currentQuestion?.id, step]);

  const handleOutroStart = useCallback(() => {
    pendingRevealRef.current = true;
    if (sessionRef.current) {
      setQuizRevealed(true);
    }
  }, []);

  const handleIntroComplete = useCallback(() => {
    setIntroDone(true);
  }, []);

  let body: ReactNode;

  if (loadError) {
    body = (
      <CardMessage
        title="No se pudo iniciar"
        body={loadError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  } else if (!playReady) {
    body = null;
  } else if (submitError) {
    body = (
      <CardMessage
        title="Error al enviar"
        body={submitError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  } else if (submitting) {
    body = <LoadingCenter label="Calculando resultado…" minHeightClassName="min-h-[12rem]" />;
  } else if (!currentQuestion) {
    body = (
      <CardMessage
        title="Sin preguntas"
        body="Este quiz no tiene preguntas publicadas."
        actionHref="/quiz"
        actionLabel="Volver"
      />
    );
  } else {
    body = (
      <div className="tm-quiz-play-session flex min-h-0 flex-1 flex-col">
        <div
          ref={playScrollRef}
          className="tm-quiz-play-scroll flex min-h-0 flex-1 flex-col gap-4"
        >
          <h1 className="tm-quiz-play-title shrink-0 text-center font-display text-base uppercase leading-snug tracking-wide text-[var(--tm-accent)] sm:text-lg">
            {PLAY_TITLE}
          </h1>

          <QuizQuestionStage
            question={currentQuestion}
            selectedOptionId={answers[currentQuestion.id] ?? null}
            phase={phase}
            secondsLeft={secondsLeft}
            locked={phase === "feedback"}
            onSelect={resolveAnswer}
          />
        </div>
      </div>
    );
  }

  const showIntro = !skipIntro && !introDone;
  const showPreparing = !playReady && !loadError && (skipIntro || introDone);

  return (
    <div className="tm-quiz-play-root flex min-h-0 flex-1 flex-col">
      {showIntro && (
        <QuizDailyIntro onOutroStart={handleOutroStart} onComplete={handleIntroComplete} />
      )}

      {showPreparing && (
        <div className="absolute inset-0 z-[5] flex items-center justify-center">
          <LoadingCenter label="Preparando preguntas…" minHeightClassName="min-h-[12rem]" />
        </div>
      )}

      <div
        className={cn(
          "tm-quiz-play-content flex min-h-0 flex-1 flex-col",
          contentVisible && "tm-quiz-play-content--visible",
          (showIntro || showPreparing) && "pointer-events-none"
        )}
        style={{ transitionDuration: `${QUIZ_PLAY_ENTER_MS}ms` }}
        aria-hidden={!contentVisible}
      >
        {body}
      </div>
    </div>
  );
}

function CardMessage({
  title,
  body,
  actionHref,
  actionLabel,
}: {
  title: string;
  body: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <div className="space-y-4 rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)] p-5">
      <p className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
        {title}
      </p>
      <p className="text-sm text-[var(--tm-muted)]">{body}</p>
      <Link href={actionHref} className="inline-flex min-h-12 items-center text-sm font-medium text-[var(--tm-primary)]">
        {actionLabel}
      </Link>
    </div>
  );
}
