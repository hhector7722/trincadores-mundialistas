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
    <div className="overflow-hidden border-b border-[var(--lab-border)]">
      <div className="bg-[var(--lab-bg-elevated)] px-3 py-2">
        <span className="text-xs font-medium text-[var(--lab-muted)]">Momento histórico</span>
      </div>
      {hasImage && !loading ? (
        <div className="relative aspect-[4/3] w-full bg-white">
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
