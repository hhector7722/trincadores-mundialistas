"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { startQuiz, submitQuiz } from "@/actions/quiz";
import { useAppNavigation } from "@/components/layout/NavigationLoadingProvider";
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
import type { QuizStartSession } from "@/lib/quiz/types";

type QuizPlaySessionProps = {
  poolId: string;
  quizId: string;
};

const PLAY_TITLE = "¿QUIEN SABE MÁS DE LOS MUNDIALES?";

export function QuizPlaySession({ poolId, quizId }: QuizPlaySessionProps) {
  const router = useRouter();
  const { navigate } = useAppNavigation();
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
  const stepRef = useRef(step);
  const phaseRef = useRef(phase);
  const sessionRef = useRef(session);
  const answersRef = useRef(answers);

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
    if (!currentQuestion || phase !== "answering") {
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
  }, [clearQuestionTimer, currentQuestion?.id, handleTimeout, phase, step]);

  useEffect(() => () => clearAllTimers(), [clearAllTimers]);

  if (loadError) {
    return (
      <CardMessage
        title="No se pudo iniciar"
        body={loadError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  }

  if (loading || !session) {
    return <LoadingCenter label="Preparando preguntas…" minHeightClassName="min-h-[12rem]" />;
  }

  if (submitError) {
    return (
      <CardMessage
        title="Error al enviar"
        body={submitError}
        actionHref="/quiz"
        actionLabel="Volver al quiz"
      />
    );
  }

  if (submitting) {
    return <LoadingCenter label="Calculando resultado…" minHeightClassName="min-h-[12rem]" />;
  }

  if (!currentQuestion) {
    return (
      <CardMessage
        title="Sin preguntas"
        body="Este quiz no tiene preguntas publicadas."
        actionHref="/quiz"
        actionLabel="Volver"
      />
    );
  }

  return (
    <div className="tm-quiz-play-session flex min-h-0 flex-1 flex-col">
      <h1 className="tm-quiz-play-title shrink-0 text-center font-display text-base uppercase leading-snug tracking-wide text-[var(--tm-accent)] sm:text-lg">
        {PLAY_TITLE}
      </h1>

      <div className="tm-quiz-stage-scroll flex min-h-0 flex-1 flex-col gap-4">
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
