import { canAutoGenerateLabFormat } from "@/lib/quiz/lab/auto-formats";
import { verifyStaticLabAssetExists } from "@/lib/quiz/lab/verify-lab-asset.client";
import {
  createImageTriviaFromCatalog,
  reloadImageTriviaFromCatalog,
} from "@/lib/quiz/lab/image-trivia-catalog";
import {
  createPlayerCropFromCatalog,
  createSilhouetteFromCatalog,
  reloadPlayerCropFromCatalog,
  reloadSilhouetteFromCatalog,
} from "@/lib/quiz/lab/player-moment-catalog";
import { reloadLabQuestion } from "@/lib/quiz/lab/reload-question";
import {
  createVideoPlayEndFromCatalog,
  reloadVideoPlayEndFromCatalog,
} from "@/lib/quiz/lab/video-play-end-catalog";
import type {
  LabQuestion,
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
  LabQuestionImageTrivia,
  LabQuestionVideoPlayEnd,
} from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

export type GenerateLabQuestionContentOptions = {
  minDifficulty?: WorldCupMomentDifficulty;
  /** true = rotar a otro momento / otro contenido */
  force?: boolean;
};

export async function generateLabQuestionContent(
  question: LabQuestion,
  options?: GenerateLabQuestionContentOptions
): Promise<LabQuestion> {
  const minDifficulty = options?.minDifficulty ?? "medium";
  const force = options?.force ?? false;

  if (question.format === "image_trivia") {
    const exclude = question.momentId ? [question.momentId] : undefined;
    const fresh =
      force && question.momentId
        ? reloadImageTriviaFromCatalog(question as LabQuestionImageTrivia, minDifficulty)
        : createImageTriviaFromCatalog({
            minDifficulty,
            questionId: question.id,
            excludeMomentIds: exclude,
            seed: Date.now(),
          });

    if (!fresh) {
      throw new Error("No hay momentos listos en el catálogo para trivia de imagen.");
    }
    return fresh;
  }

  if (question.format === "video_play_end") {
    const exclude = question.momentId ? [question.momentId] : undefined;
    const fresh =
      force && question.momentId
        ? reloadVideoPlayEndFromCatalog(question as LabQuestionVideoPlayEnd, minDifficulty)
        : createVideoPlayEndFromCatalog({
            minDifficulty,
            questionId: question.id,
            excludeMomentIds: exclude,
            seed: Date.now(),
          });

    if (!fresh) {
      throw new Error(
        "No hay clips de vídeo listos. Importa uno con npm run quiz:import-video-clip -- --id=... --from-local=..."
      );
    }
    return fresh;
  }

  if (question.format === "guess_player_hair" || question.format === "guess_player_eyes") {
    const exclude = question.momentId ? [question.momentId] : undefined;
    const fresh =
      force && question.momentId
        ? reloadPlayerCropFromCatalog(question as LabQuestionGuessPlayerCrop, minDifficulty)
        : createPlayerCropFromCatalog(question.format, {
            minDifficulty,
            questionId: question.id,
            excludeMomentIds: exclude,
            seed: Date.now(),
          });

    if (!fresh) {
      throw new Error(
        "No hay momentos de jugador aptos para este recorte en el catálogo."
      );
    }

    const assetReady = await verifyStaticLabAssetExists(fresh.imageUrl);
    if (!assetReady) {
      throw new Error(
        "Falta el asset materializado. Ejecuta npm run quiz:materialize-lab-assets en local y despliega."
      );
    }

    return fresh;
  }

  if (question.format === "guess_player_silhouette") {
    const exclude = question.momentId ? [question.momentId] : undefined;
    const fresh =
      force && question.momentId
        ? reloadSilhouetteFromCatalog(question as LabQuestionGuessPlayerSilhouette, minDifficulty)
        : createSilhouetteFromCatalog({
            minDifficulty,
            questionId: question.id,
            excludeMomentIds: exclude,
            seed: Date.now(),
          });

    if (!fresh) {
      throw new Error("No hay momentos listos para siluetas en el catálogo.");
    }

    const assetReady = await verifyStaticLabAssetExists(fresh.imageUrl);
    if (!assetReady) {
      throw new Error(
        "Falta el asset materializado. Ejecuta npm run quiz:materialize-lab-assets en local y despliega."
      );
    }

    return fresh;
  }

  if (
    question.format === "multiple_choice" ||
    question.format === "guess_selection"
  ) {
    return reloadLabQuestion(question, { minDifficulty });
  }

  if (!canAutoGenerateLabFormat(question.format)) {
    throw new Error("Formato no soportado para generación.");
  }

  throw new Error("Formato no soportado para generación.");
}
