import type { GeneratedQuizQuestion } from "@/lib/quiz/generate-question";
import { classicQuizQuestionShowsImage } from "@/lib/quiz/date";
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

  if (lab.format === "score_gap") {
    return {
      question: {
        sort_order: sortOrder,
        prompt: lab.prompt,
        options,
        correct_option_id,
      },
      playMeta: {
        sort_order: sortOrder,
        format: "score_gap",
      },
    };
  }

  if (lab.format === "jersey_pick") {
    return {
      question: {
        sort_order: sortOrder,
        prompt: lab.prompt,
        options,
        correct_option_id,
      },
      playMeta: {
        sort_order: sortOrder,
        format: "jersey_pick",
        jerseyOptions: lab.jerseyOptions,
      },
    };
  }

  throw new Error(`Formato de laboratorio no soportado en quiz oficial: ${lab.format}`);
}

export function composeOfficialQuizDay(args: {
  quizDate: string;
  title?: string;
  classicQuestions: GeneratedQuizQuestion[];
}): ComposeOfficialQuizDayResult {
  const classicSeeds = args.classicQuestions.map((q, index) =>
    toSeedQuestion({ ...q, sort_order: index + 1 })
  );

  const playFormats: QuizPlayFormatMeta[] = classicSeeds.map((q) => {
    const meta: QuizPlayFormatMeta = {
      sort_order: q.sort_order,
      format: "classic",
    };
    if (!classicQuizQuestionShowsImage(args.quizDate)) {
      q.image_url = null;
    }
    return meta;
  });

  return {
    payload: {
      quiz_date: args.quizDate,
      title: args.title ?? QUIZ_OFFICIAL_TITLE,
      official: { questions: classicSeeds },
    },
    playFormats,
  };
}
