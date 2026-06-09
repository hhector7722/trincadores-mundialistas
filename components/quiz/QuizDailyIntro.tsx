"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { introCountdownFromRemaining } from "@/lib/quiz/intro-countdown";
import {
  QUIZ_INTRO_CROSSFADE_MS,
  QUIZ_INTRO_OUTRO_LEAD_S,
  QUIZ_INTRO_OUTRO_MS,
  QUIZ_INTRO_TITLE_MS,
  QUIZ_INTRO_VIDEO_SRC,
} from "@/lib/quiz/intro";
import { cn } from "@/lib/utils";

type QuizDailyIntroProps = {
  onComplete: () => void;
  /** Se dispara al iniciar el fade-out final (solapa con la entrada del quiz). */
  onOutroStart?: () => void;
};

type IntroStage = "splash" | "video" | "outro";

export function QuizDailyIntro({ onComplete, onOutroStart }: QuizDailyIntroProps) {
  const [stage, setStage] = useState<IntroStage>("splash");
  const [splashMinElapsed, setSplashMinElapsed] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [remainingSec, setRemainingSec] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const completedRef = useRef(false);

  const finish = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    onComplete();
  }, [onComplete]);

  const beginOutro = useCallback(() => {
    setStage((current) => {
      if (current === "outro") return current;
      onOutroStart?.();
      return "outro";
    });
  }, [onOutroStart]);

  useEffect(() => {
    const timer = window.setTimeout(() => setSplashMinElapsed(true), QUIZ_INTRO_TITLE_MS);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fallback = window.setTimeout(() => {
      setVideoReady(true);
    }, QUIZ_INTRO_TITLE_MS + 3500);
    return () => window.clearTimeout(fallback);
  }, []);

  useEffect(() => {
    if (stage !== "splash" || !splashMinElapsed || !videoReady) return;
    setStage("video");
  }, [splashMinElapsed, stage, videoReady]);

  useEffect(() => {
    if (stage !== "video") return;
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = 0;
    void video.play().catch(() => {
      beginOutro();
    });
  }, [beginOutro, stage]);

  useEffect(() => {
    if (stage !== "outro") return;
    const timer = window.setTimeout(finish, QUIZ_INTRO_OUTRO_MS);
    return () => window.clearTimeout(timer);
  }, [finish, stage]);

  const handleCanPlayThrough = () => {
    setVideoReady(true);
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) {
      setRemainingSec(video.duration);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;

    const remaining = Math.max(0, video.duration - video.currentTime);
    setRemainingSec(remaining);

    if (stage === "video" && remaining <= QUIZ_INTRO_OUTRO_LEAD_S) {
      beginOutro();
    }
  };

  const handleEnded = () => {
    beginOutro();
  };

  const showSplash = stage === "splash";
  const showVideo = stage === "video" || stage === "outro";
  const isOutro = stage === "outro";

  const countdown =
    remainingSec !== null ? introCountdownFromRemaining(remainingSec) : null;

  return (
    <div
      className={cn(
        "tm-quiz-intro absolute inset-0 z-10 flex min-h-0 flex-col items-center justify-center px-4 py-6",
        isOutro && "tm-quiz-intro--outro"
      )}
      aria-live="polite"
      aria-label="Entradilla del quiz diario"
      style={
        isOutro
          ? { transition: `opacity ${QUIZ_INTRO_OUTRO_MS}ms ease-in-out` }
          : undefined
      }
    >
      <div className="tm-quiz-intro-stage relative flex w-full max-w-md flex-1 flex-col items-center justify-center">
        <div
          className={cn(
            "tm-quiz-intro-splash-layer absolute inset-0 flex flex-col items-center justify-center gap-1",
            showSplash ? "tm-quiz-intro-layer--visible" : "tm-quiz-intro-layer--hidden"
          )}
          style={{ transitionDuration: `${QUIZ_INTRO_CROSSFADE_MS}ms` }}
          aria-hidden={!showSplash}
        >
          <span className="tm-quiz-intro-eyebrow font-display text-xs uppercase tracking-[0.45em] text-[var(--tm-muted)]">
            Trincadores
          </span>
          <span className="tm-quiz-intro-word tm-quiz-intro-word--quiz font-display text-4xl uppercase tracking-[0.2em] text-[var(--tm-fg)] sm:text-5xl">
            Quiz
          </span>
          <span className="tm-quiz-intro-word tm-quiz-intro-word--diario font-display text-5xl uppercase tracking-[0.35em] text-[var(--tm-accent)] sm:text-6xl">
            Diario
          </span>
          <div className="tm-quiz-intro-scanlines mt-4 h-px w-32 bg-[var(--tm-accent)]/60" />
        </div>

        <div
          className={cn(
            "tm-quiz-intro-video-layer flex w-full flex-col items-center gap-5",
            showVideo ? "tm-quiz-intro-layer--visible" : "tm-quiz-intro-layer--hidden"
          )}
          style={{ transitionDuration: `${QUIZ_INTRO_CROSSFADE_MS}ms` }}
          aria-hidden={!showVideo}
        >
          <div className="tm-quiz-intro-video-stage shrink-0">
            <div className="tm-quiz-intro-video-wrap">
              <video
                ref={videoRef}
                src={QUIZ_INTRO_VIDEO_SRC}
                className="tm-quiz-intro-video"
                playsInline
                preload="auto"
                onCanPlayThrough={handleCanPlayThrough}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleEnded}
              />
              <div className="tm-quiz-intro-video-scanlines" aria-hidden="true" />
            </div>
          </div>

          <div
            className={cn(
              "tm-quiz-intro-countdown shrink-0 text-center",
              isOutro && "tm-quiz-intro-countdown--outro"
            )}
            style={
              isOutro
                ? { transition: `opacity ${QUIZ_INTRO_OUTRO_MS}ms ease-in-out` }
                : undefined
            }
            aria-live="polite"
          >
            {countdown ? (
              <>
                {countdown.eyebrow ? (
                  <p
                    className={cn(
                      "font-display uppercase tracking-[0.35em] text-[var(--tm-muted)]",
                      countdown.emphasis ? "text-[11px]" : "text-[10px]"
                    )}
                  >
                    {countdown.eyebrow}
                  </p>
                ) : null}
                <p
                  className={cn(
                    "tm-quiz-intro-countdown-main font-display uppercase tracking-wide text-[var(--tm-accent)]",
                    countdown.emphasis ? "text-5xl tabular-nums" : "text-sm text-[var(--tm-fg)]"
                  )}
                  key={countdown.main}
                >
                  {countdown.main}
                </p>
              </>
            ) : (
              <p className="text-sm text-[var(--tm-muted)]">Cargando vídeo…</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
