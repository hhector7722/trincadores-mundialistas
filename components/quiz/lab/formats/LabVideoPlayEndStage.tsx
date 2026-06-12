"use client";

import { useEffect, useRef } from "react";
import type { LabQuestionVideoPlayEnd } from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabVideoPlayEndStageProps = {
  question: LabQuestionVideoPlayEnd;
  playing?: boolean;
  frozen?: boolean;
};

export function LabVideoPlayEndStage({
  question,
  playing = false,
  frozen = false,
}: LabVideoPlayEndStageProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !playing) return;

    video.currentTime = 0;
    void video.play().catch(() => undefined);

    const stopAt = question.stopAtSeconds;
    const onTimeUpdate = () => {
      if (video.currentTime >= stopAt) {
        video.pause();
        video.currentTime = stopAt;
      }
    };

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, [playing, question.stopAtSeconds, question.videoUrl]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <video
        ref={videoRef}
        src={question.videoUrl}
        className={cn("h-full w-full object-cover", frozen && "opacity-90")}
        playsInline
        muted
        preload="metadata"
      />
      {frozen ? (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
          <span className="rounded-xl border border-[var(--lab-accent)] bg-black/80 px-4 py-2 font-display text-sm uppercase tracking-wider text-[var(--lab-fg)]">
            ¿Cómo acabó?
          </span>
        </div>
      ) : null}
      <div className="absolute inset-x-0 top-3 text-center">
        <span className="rounded-lg bg-black/60 px-3 py-1 text-[10px] uppercase tracking-widest text-[var(--lab-fg)]">
          Corte en {question.stopAtSeconds}s
        </span>
      </div>
    </div>
  );
}
