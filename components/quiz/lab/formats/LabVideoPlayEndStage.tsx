"use client";

import { useEffect, useRef, useState } from "react";
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
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!playing) {
      setPhase("idle");
      setLoadError(false);
      video.pause();
      video.currentTime = 0;
      return;
    }

    setPhase("playing");
    setLoadError(false);
    video.currentTime = 0;

    const stopAt = question.stopAtSeconds;

    const tryPlay = () => {
      void video.play().catch(() => setLoadError(true));
    };

    const onTimeUpdate = () => {
      if (video.currentTime >= stopAt) {
        video.pause();
        video.currentTime = stopAt;
        setPhase("stopped");
      }
    };

    const onEnded = () => setPhase("stopped");

    video.addEventListener("loadeddata", tryPlay);
    video.addEventListener("canplay", tryPlay);
    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);

    if (video.readyState >= 2) {
      tryPlay();
    }

    return () => {
      video.removeEventListener("loadeddata", tryPlay);
      video.removeEventListener("canplay", tryPlay);
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
    };
  }, [playing, question.stopAtSeconds, question.videoUrl]);

  const frozen = phase === "stopped";

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <video
        ref={videoRef}
        key={question.videoUrl}
        src={question.videoUrl}
        className={cn("h-full w-full object-cover", frozen && "opacity-95")}
        playsInline
        muted
        preload="auto"
        onError={() => setLoadError(true)}
      />
      {loadError ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-4 text-center text-sm text-[var(--lab-fg)]">
          No se pudo cargar el vídeo. Revisa la URL en el editor.
        </div>
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
          {phase === "playing" ? `Reproduciendo… corte en ${question.stopAtSeconds}s` : `Corte en ${question.stopAtSeconds}s`}
        </span>
      </div>
    </div>
  );
}
