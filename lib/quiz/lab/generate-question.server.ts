import { momentToImageTriviaQuestion } from "@/lib/quiz/lab/from-moment";
import {
  getDerivedLabAssetBuffer,
  labGeneratedAssetApiUrl,
  momentSourceAbsolutePath,
} from "@/lib/quiz/lab/derive-images.server";
import {
  pickImageTriviaMoment,
  pickPlayerMoment,
  pickSilhouetteSourceMoment,
} from "@/lib/quiz/lab/moment-picker";
import type {
  LabQuestion,
  LabQuestionFormat,
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
  LabQuestionImageTrivia,
} from "@/lib/quiz/lab/types";
import { resolveMomentImageUrl, type WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type GenerateLabQuestionInput = {
  format: LabQuestionFormat;
  questionId?: string;
  excludeMomentId?: string | null;
  excludeMomentIds?: string[];
  seed?: number;
  minDifficulty?: WorldCupMomentDifficulty;
  force?: boolean;
};

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

function momentSceneHint(moment: { year: number; teams: string[] }): string {
  return `${moment.year} — ${moment.teams.join(" vs ")}`;
}

function buildPlayerCropQuestion(
  moment: NonNullable<ReturnType<typeof pickPlayerMoment>>,
  format: "guess_player_hair" | "guess_player_eyes",
  imageUrl: string,
  questionId: string
): LabQuestionGuessPlayerCrop {
  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );

  return {
    id: questionId,
    format,
    prompt: "¿QUIÉN ES?",
    imageUrl,
    revealImageUrl: resolveMomentImageUrl(moment),
    sceneHint: momentSceneHint(moment),
    timerSeconds: 10,
    momentId: moment.id,
    momentLabel: moment.label,
    options: moment.quiz.options.map((label, index) => ({
      id: `opt_${index + 1}`,
      label,
    })),
    correctOptionId: `opt_${correctIndex >= 0 ? correctIndex + 1 : 1}`,
  };
}

function buildSilhouetteQuestion(
  moment: NonNullable<ReturnType<typeof pickSilhouetteSourceMoment>>,
  imageUrl: string,
  questionId: string
): LabQuestionGuessPlayerSilhouette {
  const correctPlayer = moment.quiz.correct_option;
  const distractors = moment.quiz.options.filter((option) => option !== correctPlayer);
  const options = [correctPlayer, ...distractors.slice(0, 3)] as [string, string, string, string];

  return {
    id: questionId,
    format: "guess_player_silhouette",
    prompt: "¿QUÉ JUGADOR ES LA SILUETA?",
    imageUrl,
    revealImageUrl: resolveMomentImageUrl(moment),
    sceneLabel: momentSceneHint(moment),
    timerSeconds: 10,
    silhouetteDemoId: null,
    momentId: moment.id,
    momentLabel: moment.label,
    options: defaultOptions([...options]),
    correctOptionId: "opt_1",
  };
}

export async function generateLabQuestion(
  input: GenerateLabQuestionInput
): Promise<LabQuestion | null> {
  const questionId = input.questionId ?? crypto.randomUUID();
  const excludeIds = [
    ...(input.excludeMomentIds ?? []),
    ...(input.excludeMomentId ? [input.excludeMomentId] : []),
  ];
  const seed = input.seed ?? Date.now();
  const minDifficulty = input.minDifficulty ?? "medium";
  const pickerOpts = { seed, excludeIds, minDifficulty };

  if (input.format === "image_trivia") {
    const moment = pickImageTriviaMoment(pickerOpts);
    return moment ? momentToImageTriviaQuestion(moment, questionId) : null;
  }

  if (input.format === "guess_player_hair" || input.format === "guess_player_eyes") {
    const moment = pickPlayerMoment(pickerOpts);
    if (!moment) return null;

    const sourcePath = resolveMomentImageUrl(moment);
    if (!sourcePath) return null;

    const variant = input.format === "guess_player_hair" ? "hair" : "eyes";
    if (input.force) {
      await getDerivedLabAssetBuffer(momentSourceAbsolutePath(sourcePath), moment.id, variant);
    }
    const imageUrl = labGeneratedAssetApiUrl(moment.id, variant);

    return buildPlayerCropQuestion(moment, input.format, imageUrl, questionId);
  }

  if (input.format === "guess_player_silhouette") {
    const moment = pickSilhouetteSourceMoment(pickerOpts);
    if (!moment) return null;

    const sourcePath = resolveMomentImageUrl(moment);
    if (!sourcePath) return null;

    if (input.force) {
      try {
        await getDerivedLabAssetBuffer(
          momentSourceAbsolutePath(sourcePath),
          moment.id,
          "silhouette",
          { moment, force: true }
        );
      } catch (error) {
        console.warn("[generateLabQuestion] Silueta OpenAI no disponible, se sirve bajo demanda.", error);
      }
    }
    const imageUrl = labGeneratedAssetApiUrl(moment.id, "silhouette", false);

    return buildSilhouetteQuestion(moment, imageUrl, questionId);
  }

  return null;
}
