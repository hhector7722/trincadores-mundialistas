import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import type { FormationId } from "@/lib/lineup/types";
import {
  clubSlotWithCrest,
  demoPlayerNameForSlot,
  resolveClubCrestUrl,
  SPAIN_DEMO_CLUB_SLOTS,
} from "@/lib/quiz/lab/club-crests";
import {
  getSelectionPresetById,
  selectionPresetToQuestion,
} from "@/lib/quiz/lab/selection-presets";
import {
  isExternalLabVideoUrl,
  LAB_DEMO_VIDEO_SRC,
  LAB_DEMO_VIDEO_STOP_AT_SECONDS,
} from "@/lib/quiz/lab/demo-video";
import type {
  LabDraft,
  LabQuestion,
  LabQuestionGuessSelection,
  LabQuestionImageTrivia,
} from "@/lib/quiz/lab/types";

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

function hydrateMultipleChoice(question: LabQuestion): LabQuestion {
  if (question.format !== "multiple_choice") return question;
  return question;
}

function hydrateVideo(question: LabQuestion): LabQuestion {
  if (question.format !== "video_play_end") return question;

  if (!isExternalLabVideoUrl(question.videoUrl)) return question;

  return {
    ...question,
    videoUrl: LAB_DEMO_VIDEO_SRC,
    stopAtSeconds: question.stopAtSeconds || LAB_DEMO_VIDEO_STOP_AT_SECONDS,
    prompt: question.prompt || "¿Cómo acabó la jugada?",
  };
}

export function hydrateLabQuestion(question: LabQuestion): LabQuestion {
  let next = migrateLegacyGuessImage(question);

  if (next.format === "guess_selection") {
    next = hydrateGuessSelection(next);
  }

  next = hydrateMultipleChoice(next);
  next = hydrateVideo(next);
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
