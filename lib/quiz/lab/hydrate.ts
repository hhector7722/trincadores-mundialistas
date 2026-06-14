import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";

import type { FormationId } from "@/lib/lineup/types";

import {

  clubSlotWithCrest,

  demoPlayerNameForSlot,

  resolveClubCrestUrl,

  SPAIN_DEMO_CLUB_SLOTS,

} from "@/lib/quiz/lab/club-crests";

import { LAB_DEMO_IMAGES } from "@/lib/quiz/lab/demo-assets";

import {

  isExternalLabVideoUrl,

  LAB_DEMO_VIDEO_SRC,

  LAB_DEMO_VIDEO_STOP_AT_SECONDS,

} from "@/lib/quiz/lab/demo-video";

import { createImageTriviaFromCatalog } from "@/lib/quiz/lab/image-trivia-catalog";

import {

  createPlayerCropFromCatalog,

  createSelectionFromCatalog,

  createSilhouetteFromCatalog,

} from "@/lib/quiz/lab/reload-question";

import type {

  LabDraft,

  LabQuestion,

  LabQuestionGuessSelection,

  LabQuestionImageTrivia,

} from "@/lib/quiz/lab/types";



const GENERIC_OPTION_LABELS = new Set(["opción a", "opción b", "opción c", "opción d"]);



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



function hasGenericOptions(labels: string[]): boolean {

  return labels.every((label) => GENERIC_OPTION_LABELS.has(label.trim().toLowerCase()));

}



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

  if (!question.selectionPresetId) {

    return createSelectionFromCatalog(question.id);

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



function hydrateImageTrivia(question: LabQuestion): LabQuestion {

  if (question.format !== "image_trivia") return question;



  const isHistoric = question.imageUrl.startsWith("/images/quiz/historic/");

  const isFallback = question.imageUrl.includes("unsplash.com");



  if (isHistoric && question.momentId) return question;

  if (!isHistoric || isFallback) {

    const fresh = createImageTriviaFromCatalog({

      minDifficulty: "medium",

      questionId: question.id,

    });

    if (fresh) return fresh;

  }



  return question;

}



function hydratePlayerCrop(question: LabQuestion): LabQuestion {

  if (question.format !== "guess_player_hair" && question.format !== "guess_player_eyes") {

    return question;

  }



  if (question.momentId) return question;



  const isStaticDemo =

    question.imageUrl === LAB_DEMO_IMAGES.ronaldoHair2002 ||

    question.imageUrl === LAB_DEMO_IMAGES.mbappeEyes;



  if (!isStaticDemo) return question;



  const fresh = createPlayerCropFromCatalog(question.format, question.id);

  return fresh ?? question;

}



function hydrateSilhouette(question: LabQuestion): LabQuestion {

  if (question.format !== "guess_player_silhouette") return question;

  if (question.silhouetteDemoId) return question;



  const isStaticDemo =

    question.imageUrl === LAB_DEMO_IMAGES.spain2008Silhouette ||

    question.imageUrl === LAB_DEMO_IMAGES.brazil2002Silhouette;



  if (!isStaticDemo) return question;

  return createSilhouetteFromCatalog(question.id);

}



function hydrateMultipleChoice(question: LabQuestion): LabQuestion {

  if (question.format !== "multiple_choice") return question;



  const labels = question.options.map((o) => o.label);

  if (!hasGenericOptions(labels)) return question;



  const prompt = question.prompt.toLowerCase();

  if (prompt.includes("españa") && prompt.includes("mundial")) {

    return {

      ...question,

      options: [

        { id: "opt_1", label: "2010" },

        { id: "opt_2", label: "2006" },

        { id: "opt_3", label: "1998" },

        { id: "opt_4", label: "1982" },

      ],

      correctOptionId: "opt_1",

    };

  }



  return {

    ...question,

    options: [

      { id: "opt_1", label: "Respuesta 1" },

      { id: "opt_2", label: "Respuesta 2" },

      { id: "opt_3", label: "Respuesta 3" },

      { id: "opt_4", label: "Respuesta 4" },

    ],

  };

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

  next = hydrateImageTrivia(next);

  next = hydratePlayerCrop(next);

  next = hydrateSilhouette(next);

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


