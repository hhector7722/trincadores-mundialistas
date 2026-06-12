"use client";

import { LabGuessImageStage } from "@/components/quiz/lab/formats/LabGuessImageStage";
import { LabGuessPlayerCropStage } from "@/components/quiz/lab/formats/LabGuessPlayerCropStage";
import { LabGuessPlayerSilhouetteStage } from "@/components/quiz/lab/formats/LabGuessPlayerSilhouetteStage";
import { LabGuessSelectionStage } from "@/components/quiz/lab/formats/LabGuessSelectionStage";
import { LabVideoPlayEndStage } from "@/components/quiz/lab/formats/LabVideoPlayEndStage";
import {
  isLabPlayerCropFormat,
  isLabPlayerCropQuestion,
  isLabPlayerSilhouetteQuestion,
  type LabQuestion,
} from "@/lib/quiz/lab/types";
import { cn } from "@/lib/utils";

type LabQuestionPreviewProps = {
  question: LabQuestion;
  mode?: "editor" | "play";
  selectedOptionId?: string | null;
  secondsLeft?: number;
  showFeedback?: boolean;
  onSelect?: (optionId: string) => void;
};

export function LabQuestionPreview({
  question,
  mode = "editor",
  selectedOptionId = null,
  secondsLeft,
  showFeedback = false,
  onSelect,
}: LabQuestionPreviewProps) {
  const playing = mode === "play";
  const correctLabel =
    question.options.find((option) => option.id === question.correctOptionId)?.label ?? null;

  return (
    <div className="flex flex-col gap-4">
      {question.format === "multiple_choice" ? (
        <div className="rounded-2xl border border-[var(--lab-border)] bg-[var(--lab-surface)] px-4 py-5 text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--lab-muted)]">
            Pregunta tipo test
          </p>
          <p className="mt-2 font-display text-xl leading-snug text-[var(--lab-fg)]">
            {question.prompt}
          </p>
          {question.imageUrl ? (
            <div className="relative mt-4 aspect-[4/3] w-full overflow-hidden rounded-xl border border-[var(--lab-border)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={question.imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      ) : null}

      {question.format === "guess_image" ? (
        <LabGuessImageStage
          question={question}
          playing={playing}
          secondsLeft={secondsLeft}
        />
      ) : null}

      {question.format === "guess_selection" ? (
        <LabGuessSelectionStage
          question={question}
          compact={mode === "play"}
          revealed={showFeedback}
        />
      ) : null}

      {isLabPlayerCropQuestion(question) ? (
        <LabGuessPlayerCropStage
          prompt={question.prompt}
          imageUrl={question.imageUrl}
          cropLabel={question.format === "guess_player_hair" ? "PEINADO" : "OJOS"}
          sceneHint={question.sceneHint}
          revealed={showFeedback}
          revealedPlayerName={showFeedback ? correctLabel : null}
        />
      ) : null}

      {isLabPlayerSilhouetteQuestion(question) ? (
        <LabGuessPlayerSilhouetteStage
          question={question}
          revealed={showFeedback}
          revealedPlayerName={showFeedback ? correctLabel : null}
        />
      ) : null}

      {question.format === "video_play_end" ? (
        <>
          <LabVideoPlayEndStage question={question} playing={playing} />
          <p className="font-display text-base leading-snug text-[var(--lab-fg)]">
            {question.prompt}
          </p>
        </>
      ) : null}

      {question.format === "guess_image" ? (
        <p className="font-display text-base leading-snug text-[var(--lab-fg)]">
          {question.prompt}
        </p>
      ) : null}

      <div className="grid gap-2">
        {question.format !== "multiple_choice" &&
        !isLabPlayerCropFormat(question.format) &&
        question.format !== "guess_player_silhouette" ? (
          <p className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
            Elige una respuesta
          </p>
        ) : null}
        {(isLabPlayerCropFormat(question.format) ||
          question.format === "guess_player_silhouette") &&
        !showFeedback ? (
          <p className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
            Elige al jugador
          </p>
        ) : null}
        {question.options.map((option) => {
          const selected = selectedOptionId === option.id;
          const correct = showFeedback && option.id === question.correctOptionId;
          const wrong = showFeedback && selected && !correct;

          return (
            <button
              key={option.id}
              type="button"
              disabled={mode === "editor" || (showFeedback && selectedOptionId !== null)}
              onClick={() => onSelect?.(option.id)}
              className={cn(
                "min-h-12 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors",
                "border-[var(--lab-border)] text-[var(--lab-fg)]",
                selected && !showFeedback && "border-[var(--lab-accent)] bg-[var(--lab-surface)]",
                correct && "border-[var(--lab-accent)] bg-[rgba(0,255,65,0.2)]",
                wrong && "border-red-500 bg-red-950/40 text-red-300",
                mode === "editor" && "opacity-70"
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
