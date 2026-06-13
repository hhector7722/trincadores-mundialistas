"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import type { LabQuestionVideoPlayEnd } from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabVideoPlayEndStageProps = {
  question: LabQuestionVideoPlayEnd;
  playing?: boolean;
};

export function LabVideoPlayEndStage({
  question,
  playing = false,
}: LabVideoPlayEndStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [phase, setPhase] = useState<"idle" | "playing" | "stopped">("idle");
  const [mediaError, setMediaError] = useState(false);
  const [needsTapToPlay, setNeedsTapToPlay] = useState(false);

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
      setPhase("idle");
      setMediaError(false);
      setNeedsTapToPlay(false);
      video.pause();
      video.currentTime = 0;
      return;
    }

    setPhase("playing");
    setMediaError(false);
    setNeedsTapToPlay(false);
    video.currentTime = 0;
    video.load();

    const stopAt = question.stopAtSeconds;

    const onCanPlay = () => {
      void tryPlay();
    };

    const onTimeUpdate = () => {
      if (video.currentTime >= stopAt) {
        video.pause();
        video.currentTime = stopAt;
        setPhase("stopped");
        setNeedsTapToPlay(false);
      }
    };

    const onEnded = () => {
      setPhase("stopped");
      setNeedsTapToPlay(false);
    };

    video.addEventListener("canplay", onCanPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 2) {
      void tryPlay();
    }

    return () => {
      video.removeEventListener("canplay", onCanPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [playing, question.stopAtSeconds, question.videoUrl, tryPlay]);

  const frozen = phase === "stopped";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <video
        ref={videoRef}
        key={question.videoUrl}
        src={question.videoUrl}
        className={cn("h-full w-full object-contain", frozen && "opacity-95")}
        playsInline
        muted
        preload="auto"
        onError={() => setMediaError(true)}
      />
      {mediaError ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/85 px-4 text-center text-sm text-[var(--lab-fg)]">
          <p>No se pudo cargar el vídeo.</p>
          <p className="text-xs text-[var(--lab-muted)]">
            Usa una ruta local (p. ej. /icons/gabri-video.mp4) o revisa la URL.
          </p>
        </div>
      ) : null}
      {!mediaError && needsTapToPlay && playing && !frozen ? (
        <button
          type="button"
          onClick={() => void tryPlay()}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/50 text-[var(--lab-fg)]"
        >
          <span className="flex h-14 w-14 items-center justify-center rounded-full border border-[var(--lab-accent)] bg-black/70">
            <Play className="h-7 w-7 fill-current text-[var(--lab-accent)]" />
          </span>
          <span className="font-display text-sm uppercase tracking-wider">Toca para reproducir</span>
        </button>
      ) : null}
      {frozen ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/35">
          <span className="rounded-xl border border-[var(--lab-accent)] bg-black/80 px-4 py-2 font-display text-sm uppercase tracking-wider text-[var(--lab-fg)]">
            ¿Cómo acabó?
          </span>
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-3 text-center">
        <span className="rounded-lg bg-black/60 px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--lab-fg)]">
          {phase === "playing"
            ? `Reproduciendo… corte en ${question.stopAtSeconds}s`
            : `Corte en ${question.stopAtSeconds}s`}
        </span>
      </div>
    </div>
  );
}
