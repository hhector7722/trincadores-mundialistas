"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { LabQuestionGuessImage } from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabGuessImageStageProps = {
  question: LabQuestionGuessImage;
  playing?: boolean;
  secondsLeft?: number;
};

export function LabGuessImageStage({
  question,
  playing = false,
  secondsLeft,
}: LabGuessImageStageProps) {
  const [blurPx, setBlurPx] = useState(question.blurStartPx);

  useEffect(() => {
    if (!playing) {
      setBlurPx(question.blurStartPx);
      return;
    }

    const total = question.revealSeconds;
    const elapsed = total - (secondsLeft ?? total);
    const progress = total > 0 ? Math.min(1, Math.max(0, elapsed / total)) : 1;
    setBlurPx(question.blurStartPx * (1 - progress));
  }, [playing, question.blurStartPx, question.revealSeconds, secondsLeft]);

  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--lab-border)]">
      <Image
        src={question.imageUrl}
        alt=""
        fill
        className="object-cover"
        style={{ filter: `blur(${blurPx}px)` }}
        sizes="(max-width: 640px) 100vw, 480px"
        unoptimized
      />
      <div className="absolute inset-x-0 top-3 flex justify-center">
        <span className="rounded-lg bg-black/60 px-3 py-1 font-display text-xs uppercase tracking-widest text-[var(--lab-fg)]">
          {question.prompt || "ADIVINA LA IMAGEN"}
        </span>
      </div>
      {playing && secondsLeft != null ? (
        <div className="absolute bottom-3 right-3 rounded-lg bg-black/70 px-2 py-1 font-mono text-sm text-[var(--lab-fg)]">
          {secondsLeft}s
        </div>
      ) : null}
    </div>
  );
}
