import { LAB_DEMO_VIDEO_SRC, LAB_DEMO_VIDEO_STOP_AT_SECONDS } from "@/lib/quiz/lab/demo-video";
import type { LabDraft, LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";

const PLACEHOLDER_OPTION = "—";

function uid(): string {
  return crypto.randomUUID();
}

function placeholderOptions() {
  return [
    { id: "opt_1", label: PLACEHOLDER_OPTION },
    { id: "opt_2", label: PLACEHOLDER_OPTION },
    { id: "opt_3", label: PLACEHOLDER_OPTION },
    { id: "opt_4", label: PLACEHOLDER_OPTION },
  ];
}

/** Pregunta vacía; pulsa «Generar» en el laboratorio para rellenarla. */
export function createLabQuestionStub(format: LabQuestionFormat): LabQuestion {
  const base = {
    id: uid(),
    prompt: "Pulsa «Generar» para crear esta pregunta",
    timerSeconds: 10,
    options: placeholderOptions(),
    correctOptionId: "opt_1",
  };

  switch (format) {
    case "multiple_choice":
      return {
        ...base,
        format,
        prompt: "Pulsa «Generar» para crear la pregunta",
        imageUrl: null,
      };

    case "image_trivia":
      return {
        ...base,
        format,
        prompt: "Pulsa «Generar» para elegir un momento del catálogo",
        imageUrl: "",
        momentId: null,
        momentLabel: null,
        momentDifficulty: null,
        answerType: null,
      };

    case "guess_selection":
      return {
        ...base,
        format,
        prompt: "¿QUÉ SELECCIÓN ES?",
        formation: "4-2-3-1",
        slots: [],
        selectionPresetId: null,
      };

    case "guess_player_hair":
      return {
        ...base,
        format,
        prompt: "¿QUIÉN ES?",
        imageUrl: "",
        revealImageUrl: null,
        sceneHint: null,
        momentId: null,
        momentLabel: null,
      };

    case "guess_player_eyes":
      return {
        ...base,
        format,
        prompt: "¿QUIÉN ES?",
        imageUrl: "",
        revealImageUrl: null,
        sceneHint: null,
        momentId: null,
        momentLabel: null,
      };

    case "guess_player_silhouette":
      return {
        ...base,
        format,
        prompt: "¿QUÉ JUGADOR ES LA SILUETA?",
        imageUrl: "",
        revealImageUrl: null,
        sceneLabel: "",
        silhouetteDemoId: null,
        momentId: null,
        momentLabel: null,
      };

    case "video_play_end":
      return {
        ...base,
        format,
        prompt: "¿Cómo acabó la jugada?",
        videoUrl: "",
        stopAtSeconds: LAB_DEMO_VIDEO_STOP_AT_SECONDS,
        momentId: null,
        momentLabel: null,
      };
  }
}

/** @deprecated Usar createLabQuestionStub */
export function createLabQuestion(format: LabQuestionFormat): LabQuestion {
  return createLabQuestionStub(format);
}

export function createDefaultLabDraft(): LabDraft {
  const formats = [
    "multiple_choice",
    "image_trivia",
    "guess_selection",
    "guess_player_silhouette",
    "guess_player_hair",
    "guess_player_eyes",
    "video_play_end",
  ] as const satisfies readonly LabQuestionFormat[];

  return {
    version: 1,
    title: "Borrador laboratorio",
    questions: formats.map((format) => createLabQuestionStub(format)),
  };
}
