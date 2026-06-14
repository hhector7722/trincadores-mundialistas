import type { GeneratedQuizQuestion } from "@/lib/quiz/generate-question";
import { toSeedQuestion } from "@/lib/quiz/generated-day";
import {
  labOptionIdsToSeed,
  type QuizPlayFormatMeta,
} from "@/lib/quiz/play-formats";
import type { LabQuestion } from "@/lib/quiz/lab/types";
import { QUIZ_OFFICIAL_TITLE, type SeedQuizDayFile, type SeedQuizQuestion } from "@/lib/quiz/seed-day";

export type ComposeOfficialQuizDayResult = {
  payload: SeedQuizDayFile;
  playFormats: QuizPlayFormatMeta[];
};

function labQuestionToSeed(
  lab: LabQuestion,
  sortOrder: number
): { question: SeedQuizQuestion; playMeta: QuizPlayFormatMeta } {
  const { options, correct_option_id } = labOptionIdsToSeed(lab.options, lab.correctOptionId);

  if (lab.format === "image_trivia") {
    return {
      question: {
        sort_order: sortOrder,
        prompt: lab.prompt,
        image_url: lab.imageUrl,
        options,
        correct_option_id,
      },
      playMeta: {
        sort_order: sortOrder,
        format: "image_trivia",
      },
    };
  }

  if (lab.format === "guess_player_silhouette") {
    return {
      question: {
        sort_order: sortOrder,
        prompt: lab.prompt,
        image_url: lab.imageUrl,
        options,
        correct_option_id,
      },
      playMeta: {
        sort_order: sortOrder,
        format: "guess_player_silhouette",
        reveal_image_url: lab.revealImageUrl ?? null,
      },
    };
  }

  throw new Error(`Formato de laboratorio no soportado en quiz oficial: ${lab.format}`);
}

export function composeOfficialQuizDay(args: {
  quizDate: string;
  title?: string;
  classicQuestion: GeneratedQuizQuestion;
  labQuestions: LabQuestion[];
}): ComposeOfficialQuizDayResult {
  const labSlots = args.labQuestions.slice(0, 2);
  if (labSlots.length < 2) {
    throw new Error("Se necesitan 2 preguntas de laboratorio (imagen + silueta).");
  }

  const classicSeed = toSeedQuestion({ ...args.classicQuestion, sort_order: 1 });
  const playFormats: QuizPlayFormatMeta[] = [
    { sort_order: 1, format: "classic" },
  ];
  const questions: SeedQuizQuestion[] = [classicSeed];

  for (let index = 0; index < labSlots.length; index++) {
    const sortOrder = index + 2;
    const mapped = labQuestionToSeed(labSlots[index], sortOrder);
    questions.push(mapped.question);
    playFormats.push(mapped.playMeta);
  }

  return {
    payload: {
      quiz_date: args.quizDate,
      title: args.title ?? QUIZ_OFFICIAL_TITLE,
      official: { questions },
    },
    playFormats,
  };
}
