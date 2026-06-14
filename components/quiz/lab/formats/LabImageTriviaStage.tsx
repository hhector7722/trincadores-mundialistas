"use client";

import Image from "next/image";
import { LabGenerationPlaceholder } from "@/components/quiz/lab/LabGenerationPlaceholder";
import type { LabQuestionImageTrivia } from "@/lib/quiz/lab/types";

type LabImageTriviaStageProps = {
  question: LabQuestionImageTrivia;
  loading?: boolean;
};

export function LabImageTriviaStage({ question, loading = false }: LabImageTriviaStageProps) {
  const hasImage = Boolean(question.imageUrl?.trim());

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--lab-border)] bg-black">
      <div className="border-b border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2">
        <span className="font-display text-xs uppercase tracking-[0.2em] text-[var(--lab-accent)]">
          Momento histórico
        </span>
      </div>
      {hasImage && !loading ? (
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
      ) : (
        <LabGenerationPlaceholder
          loading={loading}
          label="Pulsa «Generar» para cargar una imagen del catálogo"
        />
      )}
    </div>
  );
}
