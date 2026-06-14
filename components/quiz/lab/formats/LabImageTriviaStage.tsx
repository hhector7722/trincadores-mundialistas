"use client";

import Image from "next/image";
import type { LabQuestionImageTrivia } from "@/lib/quiz/lab/types";

type LabImageTriviaStageProps = {
  question: LabQuestionImageTrivia;
};

export function LabImageTriviaStage({ question }: LabImageTriviaStageProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <div className="border-b border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2">
        <span className="font-display text-xs uppercase tracking-[0.2em] text-[var(--lab-accent)]">
          Momento histórico
        </span>
      </div>
      <div className="relative aspect-[4/3] w-full bg-[#0a0a0a]">
        <Image
          src={question.imageUrl}
          alt=""
          fill
          className="object-contain"
          sizes="(max-width: 640px) 100vw, 480px"
          unoptimized
        />
      </div>
    </div>
  );
}
