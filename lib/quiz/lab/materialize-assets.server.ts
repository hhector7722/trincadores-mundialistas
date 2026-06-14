import { access } from "node:fs/promises";
import {
  getDerivedLabAssetBuffer,
  momentSourceAbsolutePath,
  persistDerivedAssetToDisk,
  persistedDerivedAssetAbsolutePath,
  persistedDerivedAssetPublicUrl,
  tryReadPersistedDerivedAsset,
  type LabDeriveVariant,
} from "@/lib/quiz/lab/derive-images.server";
import type { LabQuestion } from "@/lib/quiz/lab/types";
import {
  isLabPlayerCropQuestion,
  isLabPlayerSilhouetteQuestion,
} from "@/lib/quiz/lab/types";
import { pickMomentById, resolveMomentImageUrl, type WorldCupMoment } from "@/lib/quiz/world-cup-moments";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";

export type MaterializeLabAssetOptions = {
  force?: boolean;
};

export type MaterializeLabAssetResult = {
  momentId: string;
  variant: LabDeriveVariant;
  publicUrl: string;
  skipped: boolean;
};

export async function labAssetExistsOnDisk(
  momentId: string,
  variant: LabDeriveVariant
): Promise<boolean> {
  try {
    await access(persistedDerivedAssetAbsolutePath(momentId, variant));
    return true;
  } catch {
    return false;
  }
}

export async function materializeLabAsset(
  moment: WorldCupMoment,
  variant: LabDeriveVariant,
  options?: MaterializeLabAssetOptions
): Promise<MaterializeLabAssetResult> {
  const momentId = moment.id;
  const historicPath = resolveMomentImageUrl(moment);
  if (!historicPath) {
    throw new Error(`Momento ${momentId} sin imagen histórica lista.`);
  }

  const exists = await labAssetExistsOnDisk(momentId, variant);
  if (exists) {
    return {
      momentId,
      variant,
      publicUrl: persistedDerivedAssetPublicUrl(momentId, variant),
      skipped: true,
    };
  }

  const buffer = await getDerivedLabAssetBuffer(
    momentSourceAbsolutePath(historicPath),
    momentId,
    variant,
    {
      moment,
      force: options?.force ?? variant === "silhouette",
    }
  );

  await persistDerivedAssetToDisk(momentId, variant, buffer);

  return {
    momentId,
    variant,
    publicUrl: persistedDerivedAssetPublicUrl(momentId, variant),
    skipped: false,
  };
}

export async function materializeLabAssetById(
  momentId: string,
  variant: LabDeriveVariant,
  options?: MaterializeLabAssetOptions
): Promise<MaterializeLabAssetResult> {
  const catalog = getWorldCupMomentsCatalog();
  const moment = pickMomentById(catalog, momentId, { readyOnly: true });
  if (!moment) {
    throw new Error(`Momento no encontrado o no ready: ${momentId}`);
  }
  return materializeLabAsset(moment, variant, options);
}

export async function materializeLabQuestionAssets(
  question: LabQuestion,
  options?: MaterializeLabAssetOptions
): Promise<LabQuestion> {
  const variant =
    question.format === "guess_player_hair"
      ? "hair"
      : question.format === "guess_player_eyes"
        ? "eyes"
        : question.format === "guess_player_silhouette"
          ? "silhouette"
          : null;

  const momentId = "momentId" in question ? question.momentId : null;
  if (!variant || !momentId) return question;

  const catalog = getWorldCupMomentsCatalog();
  const moment = pickMomentById(catalog, momentId, { readyOnly: true });
  if (!moment) return question;

  const silhouetteForce = variant === "silhouette" && !(await labAssetExistsOnDisk(momentId, variant));
  await materializeLabAsset(moment, variant, {
    force: options?.force ?? silhouetteForce,
  });

  const staticUrl = persistedDerivedAssetPublicUrl(momentId, variant);

  if (isLabPlayerCropQuestion(question) || isLabPlayerSilhouetteQuestion(question)) {
    return { ...question, imageUrl: staticUrl };
  }
  return question;
}

export function listPlayerMomentsForLab(): WorldCupMoment[] {
  const catalog = getWorldCupMomentsCatalog();
  return catalog.moments.filter(
    (moment) => moment.status === "ready" && moment.quiz.answer_type === "player"
  );
}

export async function tryReadMaterializedAsset(
  momentId: string,
  variant: LabDeriveVariant
): Promise<Buffer | null> {
  return tryReadPersistedDerivedAsset(momentId, variant);
}
