"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { LabQuestionVideoPlayEnd } from "@/lib/quiz/lab/types";

export type VideoPlayEndPhase =
  | "idle"
  | "intro"
  | "awaiting_answer"
  | "revealing"
  | "ended";

type LabVideoPlayEndStageProps = {
  question: LabQuestionVideoPlayEnd;
  playing?: boolean;
  showFeedback?: boolean;
  onPhaseChange?: (phase: VideoPlayEndPhase) => void;
  onMediaError?: () => void;
};

export function LabVideoPlayEndStage({
  question,
  playing = false,
  showFeedback = false,
  onPhaseChange,
  onMediaError,
}: LabVideoPlayEndStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const phaseRef = useRef<VideoPlayEndPhase>("idle");
  const pauseAtRef = useRef(question.stopAtSeconds);
  const [phase, setPhase] = useState<VideoPlayEndPhase>("idle");
  const [mediaError, setMediaError] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

  pauseAtRef.current = question.stopAtSeconds;

  const setPhaseSafe = useCallback(
    (next: VideoPlayEndPhase) => {
      phaseRef.current = next;
      setPhase(next);
      onPhaseChange?.(next);
    },
    [onPhaseChange]
  );

  const tryPlay = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return false;

    video.muted = true;
    try {
      await video.play();
      setNeedsTapToPlay(false);
      setMediaError(false);
      return true;
    } catch {
      setNeedsTapToPlay(true);
      return false;
    }
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playing) {
      setPhaseSafe("idle");
      setMediaError(false);
      setNeedsTapToPlay(false);
      video.pause();
      video.currentTime = 0;
      return;
    }

    setPhaseSafe("intro");
    setMediaError(false);
    setNeedsTapToPlay(false);
    video.currentTime = 0;
    video.load();

    const onCanPlay = () => {
      void tryPlay();
    };

    const onLoadedMetadata = () => {
      if (
        Number.isFinite(video.duration) &&
        video.duration > 0 &&
        video.duration < pauseAtRef.current
      ) {
        pauseAtRef.current = Math.max(0.5, video.duration - 0.3);
      }
    };

    const onTimeUpdate = () => {
      if (phaseRef.current === "intro" && video.currentTime >= pauseAtRef.current) {
        video.pause();
        video.currentTime = pauseAtRef.current;
        setPhaseSafe("awaiting_answer");
        setNeedsTapToPlay(false);
      }
    };

    const onEnded = () => {
      if (phaseRef.current === "intro") {
        setPhaseSafe("awaiting_answer");
        setNeedsTapToPlay(false);
        return;
      }
      setPhaseSafe("ended");
      setNeedsTapToPlay(false);
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("loadedmetadata", onLoadedMetadata);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 2) {
      void tryPlay();
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("loadedmetadata", onLoadedMetadata);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, question.stopAtSeconds, question.videoUrl, tryPlay, setPhaseSafe]);

  useEffect(() => {
    if (!showFeedback || phase !== "awaiting_answer") return;

    const video = videoRef.current;
    if (!video) return;

    setPhaseSafe("revealing");
    void tryPlay();
  }, [showFeedback, phase, setPhaseSafe, tryPlay]);

  const showQuestionOverlay = phase === "awaiting_answer" && !showFeedback;
  const showRevealOverlay = showFeedback && (phase === "revealing" || phase === "ended");
  const showTapOverlay =
    !mediaError &&
    needsTapToPlay &&
    playing &&
    (phase === "intro" || phase === "revealing");

  return (
    <div className="relative aspect-video w-full overflow-hidden border-b border-[var(--lab-border)] bg-black">
      <video
        ref={videoRef}
        key={question.videoUrl}
        src={question.videoUrl}
        className="h-full w-full object-contain"
        playsInline
        muted
        preload="auto"
        onError={() => {
          setMediaError(true);
          onMediaError?.();
        }}
      />
      {mediaError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-4 text-center text-sm text-white">
          <p>No se pudo cargar el vídeo.</p>
          <p className="text-xs text-[var(--lab-muted)]">
            Pulsa «Generar» en la pregunta de vídeo o importa un clip.
          </p>
        </div>
      ) : null}
      {showTapOverlay ? (
        <button
          type="button"
          onClick={() => void tryPlay()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-white"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--lab-accent)] bg-black/70">
            <Play className="h-7 w-7 fill-current text-[var(--lab-accent)]" />
          </span>
          <span className="text-sm font-medium">Toca para reproducir</span>
        </button>
      ) : null}
      {showQuestionOverlay ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="rounded-md bg-black/75 px-4 py-2 text-sm font-semibold text-white">
            {question.prompt}
          </span>
        </div>
      ) : null}
      {showRevealOverlay ? (
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-4 py-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-[var(--lab-accent-soft)]">
            {phase === "ended" ? "Así acabó" : "Reproduciendo el final…"}
          </p>
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-2 text-center">
        <span className="rounded-md bg-black/55 px-2 py-0.5 text-[10px] text-white">
          {phase === "idle"
            ? `Pausa en ${question.stopAtSeconds}s · luego continúa al responder`
            : phase === "intro"
              ? `Reproduciendo hasta ${pauseAtRef.current}s…`
              : phase === "awaiting_answer"
                ? "Elige la respuesta"
                : phase === "revealing"
                  ? "Mostrando el desenlace"
                  : "Fin del clip"}
        </span>
      </div>
    </div>
  );
}
