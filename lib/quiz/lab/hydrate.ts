import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import type { FormationId } from "@/lib/lineup/types";
import {
  clubSlotWithCrest,
  demoPlayerNameForSlot,
  resolveClubCrestUrl,
  SPAIN_DEMO_CLUB_SLOTS,
} from "@/lib/quiz/lab/club-crests";
import { isDerivedLabAssetUrl } from "@/lib/quiz/lab/generate-question.client";
import {
  momentToPlayerCropQuestion,
  momentToSilhouetteQuestion,
} from "@/lib/quiz/lab/from-player-moment";
import {
  getSelectionPresetById,
  selectionPresetToQuestion,
} from "@/lib/quiz/lab/selection-presets";
import { createVideoPlayEndFromCatalog } from "@/lib/quiz/lab/video-play-end-catalog";
import { momentToVideoPlayEndQuestion } from "@/lib/quiz/lab/from-video-moment";
import type {
  LabDraft,
  LabQuestion,
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
  LabQuestionGuessSelection,
  LabQuestionImageTrivia,
  LabQuestionVideoPlayEnd,
} from "@/lib/quiz/lab/types";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import { pickMomentById } from "@/lib/quiz/world-cup-moments";
import { getWorldCupVideoMomentsCatalog } from "@/lib/quiz/world-cup-video-moments-catalog";
import { pickVideoMomentById } from "@/lib/quiz/world-cup-video-moments";

const LEGACY_VIDEO_URLS = new Set([
  "/icons/gabri-video.mp4",
  "/videos/quiz/historic/demo/wc-demo-lab-intro.mp4",
]);

type LegacyGuessImageQuestion = {
  id: string;
  format: "guess_image";
  prompt: string;
  imageUrl: string;
  timerSeconds: number;
  options: LabQuestion["options"];
  correctOptionId: string;
  momentId?: string | null;
  momentLabel?: string | null;
  momentDifficulty?: "easy" | "medium" | "hard" | null;
};

/** Convierte borradores antiguos con formato borroso al tipo imagen+trivia. */
function migrateLegacyGuessImage(question: LabQuestion): LabQuestion {
  if ((question as { format?: string }).format !== "guess_image") {
    return question;
  }

  const legacy = question as unknown as LegacyGuessImageQuestion;

  const migrated: LabQuestionImageTrivia = {
    id: legacy.id,
    format: "image_trivia",
    prompt: legacy.prompt,
    imageUrl: legacy.imageUrl,
    timerSeconds: legacy.timerSeconds,
    options: legacy.options,
    correctOptionId: legacy.correctOptionId,
    momentId: legacy.momentId ?? null,
    momentLabel: legacy.momentLabel ?? null,
    momentDifficulty: legacy.momentDifficulty ?? null,
    answerType: null,
  };

  return migrated;
}

function hydrateGuessSelection(question: LabQuestionGuessSelection): LabQuestionGuessSelection {
  if (question.selectionPresetId) {
    const preset = getSelectionPresetById(question.selectionPresetId);
    if (preset) {
      return selectionPresetToQuestion(preset, question.id);
    }
  }

  if (question.slots.length === 0) {
    return question;
  }

  const useSpainDemo =
    question.formation === "4-2-3-1" &&
    question.slots.every((slot) => !slot.clubImageUrl);

  const seeds = useSpainDemo
    ? SPAIN_DEMO_CLUB_SLOTS
    : question.slots.map((slot) => ({
        slotKey: slot.slotKey,
        clubLabel: slot.clubLabel,
        playerName:
          ("playerName" in slot ? slot.playerName : "") ||
          demoPlayerNameForSlot(slot.slotKey),
      }));

  const slots = seeds.map((seed, index) => {
    const existing = question.slots[index];
    const crestUrl =
      resolveClubCrestUrl(seed.clubLabel) ?? existing?.clubImageUrl ?? null;
    const playerName =
      seed.playerName ||
      existing?.playerName ||
      demoPlayerNameForSlot(seed.slotKey);
    return {
      slotKey: seed.slotKey,
      clubLabel: seed.clubLabel,
      clubImageUrl: crestUrl,
      playerName,
    };
  });

  return { ...question, slots };
}

function hydratePlayerCrop(question: LabQuestionGuessPlayerCrop): LabQuestionGuessPlayerCrop {
  if (isDerivedLabAssetUrl(question.imageUrl)) {
    return question;
  }

  const catalog = getWorldCupMomentsCatalog();
  const moment = question.momentId
    ? pickMomentById(catalog, question.momentId, { readyOnly: true })
    : null;

  if (moment) {
    return (
      momentToPlayerCropQuestion(moment, question.format, question.id) ?? question
    );
  }

  return question;
}

function hydrateSilhouette(
  question: LabQuestionGuessPlayerSilhouette
): LabQuestionGuessPlayerSilhouette {
  if (
    isDerivedLabAssetUrl(question.imageUrl) &&
    question.imageUrl !== question.revealImageUrl
  ) {
    return question;
  }

  if (question.momentId) {
    const catalog = getWorldCupMomentsCatalog();
    const moment = pickMomentById(catalog, question.momentId, { readyOnly: true });
    if (moment) {
      return momentToSilhouetteQuestion(moment, question.id) ?? question;
    }
  }

  return question;
}

function hydrateVideo(question: LabQuestionVideoPlayEnd): LabQuestionVideoPlayEnd {
  const videoCatalog = getWorldCupVideoMomentsCatalog();

  if (question.momentId && !question.momentId.startsWith("wc-demo-")) {
    const moment = pickVideoMomentById(videoCatalog, question.momentId);
    if (moment) {
      const synced = momentToVideoPlayEndQuestion(moment, question.id);
      if (synced?.videoUrl.startsWith("/videos/quiz/historic/")) {
        return synced;
      }
    }
  }

  const isLegacy =
    question.momentId === "wc-demo-lab-intro" ||
    LEGACY_VIDEO_URLS.has(question.videoUrl) ||
    question.videoUrl.includes("/demo/wc-demo-lab-intro") ||
    !question.videoUrl.trim();

  const hasHistoricClip =
    question.videoUrl.startsWith("/videos/quiz/historic/") &&
    !question.videoUrl.includes("/demo/");

  if (!isLegacy && hasHistoricClip) {
    return question;
  }

  const fresh = createVideoPlayEndFromCatalog({
    questionId: question.id,
    excludeMomentIds: question.momentId ? [question.momentId] : undefined,
    seed: Date.now(),
  });

  return fresh ?? question;
}

export function hydrateLabQuestion(question: LabQuestion): LabQuestion {
  let next = migrateLegacyGuessImage(question);

  if (next.format === "guess_selection") {
    next = hydrateGuessSelection(next);
  }

  if (next.format === "guess_player_hair" || next.format === "guess_player_eyes") {
    next = hydratePlayerCrop(next);
  }

  if (next.format === "guess_player_silhouette") {
    next = hydrateSilhouette(next);
  }

  if (next.format === "video_play_end") {
    next = hydrateVideo(next);
  }

  return next;
}

export function hydrateLabDraft(draft: LabDraft): LabDraft {
  return {
    ...draft,
    questions: draft.questions.map(hydrateLabQuestion),
  };
}

export function selectionSlotsForFormation(formation: FormationId) {
  if (formation === "4-2-3-1") {
    return SPAIN_DEMO_CLUB_SLOTS.map(clubSlotWithCrest);
  }

  return FORMATION_SLOT_ANCHORS[formation].map((anchor, index) => {
    const seed = SPAIN_DEMO_CLUB_SLOTS[index % SPAIN_DEMO_CLUB_SLOTS.length];
    return clubSlotWithCrest({
      slotKey: anchor.key,
      clubLabel: seed?.clubLabel ?? `Club ${index + 1}`,
      playerName: seed?.playerName ?? `Jugador ${index + 1}`,
    });
  });
}
