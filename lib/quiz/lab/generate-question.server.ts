import { momentToImageTriviaQuestion } from "@/lib/quiz/lab/from-moment";
import {
  momentToPlayerCropQuestion,
  momentToSilhouetteQuestion,
} from "@/lib/quiz/lab/from-player-moment";
import {
  getDerivedLabAssetBuffer,
  momentSourceAbsolutePath,
} from "@/lib/quiz/lab/derive-images.server";
import { labAssetExistsOnDisk } from "@/lib/quiz/lab/materialize-assets.server";
import {
  pickImageTriviaMoment,
  pickPlayerMoment,
  pickSilhouetteSourceMoment,
} from "@/lib/quiz/lab/moment-picker";
import type {
  LabQuestion,
  LabQuestionFormat,
  LabQuestionImageTrivia,
} from "@/lib/quiz/lab/types";
import { resolveMomentImageUrl, type WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type GenerateLabQuestionInput = {
  format: LabQuestionFormat;
  questionId?: string;
  excludeMomentId?: string | null;
  excludeMomentIds?: string[];
  excludePlayerKeys?: string[];
  seed?: number;
  minDifficulty?: WorldCupMomentDifficulty;
  force?: boolean;
};

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
  const pickerOpts = {
    seed,
    excludeIds: excludeIds,
    excludePlayerKeys: input.excludePlayerKeys,
    minDifficulty,
  };

  if (input.format === "image_trivia") {
    const moment = pickImageTriviaMoment(pickerOpts);
    return moment ? momentToImageTriviaQuestion(moment, questionId) : null;
  }

  if (input.format === "guess_player_hair" || input.format === "guess_player_eyes") {
    const moment = pickPlayerMoment(input.format, pickerOpts);
    if (!moment) return null;

    const sourcePath = resolveMomentImageUrl(moment);
    if (!sourcePath) return null;

    const variant = input.format === "guess_player_hair" ? "hair" : "eyes";
    if (input.force) {
      await getDerivedLabAssetBuffer(momentSourceAbsolutePath(sourcePath), moment.id, variant);
    }

    return momentToPlayerCropQuestion(moment, input.format, questionId);
  }

  if (input.format === "guess_player_silhouette") {
    const moment = pickSilhouetteSourceMoment({ ...pickerOpts, minDifficulty: "easy" });
    if (!moment) return null;

    const sourcePath = resolveMomentImageUrl(moment);
    if (!sourcePath) return null;

    if (input.force) {
      const hasStaticSilhouette = await labAssetExistsOnDisk(moment.id, "silhouette");
      if (!hasStaticSilhouette) {
        try {
          await getDerivedLabAssetBuffer(
            momentSourceAbsolutePath(sourcePath),
            moment.id,
            "silhouette",
            { moment, force: true }
          );
        } catch (error) {
          console.warn(
            "[generateLabQuestion] Silueta OpenAI no disponible, se sirve bajo demanda.",
            error
          );
        }
      }
    }

    return momentToSilhouetteQuestion(moment, questionId);
  }

  return null;
}
