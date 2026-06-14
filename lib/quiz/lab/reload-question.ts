import { reloadImageTriviaFromCatalog } from "@/lib/quiz/lab/image-trivia-catalog";
import {
  createPlayerCropFromCatalog as createPlayerCropQuestion,
  createSilhouetteFromCatalog as createSilhouetteQuestion,
  reloadPlayerCropFromCatalog,
  reloadSilhouetteFromCatalog,
} from "@/lib/quiz/lab/player-moment-catalog";
import { reloadVideoPlayEndFromCatalog } from "@/lib/quiz/lab/video-play-end-catalog";
import {
  pickSelectionPreset,
  selectionPresetToQuestion,
} from "@/lib/quiz/lab/selection-presets";
import type {
  LabQuestion,
  LabQuestionFormat,
  LabQuestionImageTrivia,
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
  LabQuestionGuessSelection,
  LabQuestionMultipleChoice,
  LabQuestionVideoPlayEnd,
} from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";

const RELOADABLE_FORMATS = new Set<LabQuestionFormat>([
  "multiple_choice",
  "image_trivia",
  "guess_selection",
  "guess_player_hair",
  "guess_player_eyes",
  "guess_player_silhouette",
  "video_play_end",
]);

export function canReloadLabQuestion(format: LabQuestionFormat): boolean {
  return RELOADABLE_FORMATS.has(format);
}

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

function reloadPlayerCrop(
  question: LabQuestionGuessPlayerCrop,
  minDifficulty: WorldCupMomentDifficulty
): LabQuestionGuessPlayerCrop {
  return reloadPlayerCropFromCatalog(question, minDifficulty) ?? question;
}

function reloadSilhouette(
  question: LabQuestionGuessPlayerSilhouette,
  minDifficulty: WorldCupMomentDifficulty
): LabQuestionGuessPlayerSilhouette {
  return reloadSilhouetteFromCatalog(question, minDifficulty) ?? question;
}

function reloadSelection(question: LabQuestionGuessSelection): LabQuestionGuessSelection {
  const preset = pickSelectionPreset(question.selectionPresetId, Date.now());
  return selectionPresetToQuestion(preset, question.id);
}

function reloadVideo(question: LabQuestionVideoPlayEnd): LabQuestionVideoPlayEnd {
  return reloadVideoPlayEndFromCatalog(question, "medium");
}

export type ReloadLabQuestionOptions = {
  minDifficulty?: WorldCupMomentDifficulty;
};

function reloadMultipleChoice(question: LabQuestionMultipleChoice): LabQuestionMultipleChoice {
  const demos = [
    {
      prompt: "¿En qué año ganó España su primer Mundial?",
      options: ["2010", "2006", "1998", "1982"],
      correctIndex: 0,
    },
    {
      prompt: "¿Cuántas Copas del Mundo ha ganado Brasil?",
      options: ["5", "4", "3", "6"],
      correctIndex: 0,
    },
    {
      prompt: "¿En qué país se jugó el Mundial 2014?",
      options: ["Brasil", "Rusia", "Sudáfrica", "Alemania"],
      correctIndex: 0,
    },
  ] as const;

  const pick = demos[Math.abs(Date.now()) % demos.length] ?? demos[0];
  return {
    ...question,
    prompt: pick.prompt,
    options: defaultOptions([...pick.options]),
    correctOptionId: `opt_${pick.correctIndex + 1}`,
    imageUrl: null,
  };
}

export function reloadLabQuestion(
  question: LabQuestion,
  opts?: ReloadLabQuestionOptions
): LabQuestion {
  const minDifficulty = opts?.minDifficulty ?? "hard";

  switch (question.format) {
    case "multiple_choice":
      return reloadMultipleChoice(question);
    case "image_trivia":
      return reloadImageTriviaFromCatalog(question as LabQuestionImageTrivia, minDifficulty);
    case "guess_selection":
      return reloadSelection(question);
    case "guess_player_hair":
    case "guess_player_eyes":
      return reloadPlayerCrop(question, minDifficulty);
    case "guess_player_silhouette":
      return reloadSilhouette(question, minDifficulty);
    case "video_play_end":
      return reloadVideo(question);
    default:
      return question;
  }
}

export function createPlayerCropFromCatalog(
  format: "guess_player_hair" | "guess_player_eyes",
  questionId?: string,
  minDifficulty: WorldCupMomentDifficulty = "medium"
): LabQuestionGuessPlayerCrop | null {
  return createPlayerCropQuestion(format, {
    questionId: questionId ?? crypto.randomUUID(),
    minDifficulty,
    seed: Date.now(),
  });
}

export function createSilhouetteFromCatalog(
  questionId?: string,
  minDifficulty: WorldCupMomentDifficulty = "medium"
): LabQuestionGuessPlayerSilhouette | null {
  return createSilhouetteQuestion({
    questionId: questionId ?? crypto.randomUUID(),
    minDifficulty,
    seed: Date.now(),
  });
}

export function createSelectionFromCatalog(questionId?: string): LabQuestionGuessSelection {
  const preset = pickSelectionPreset(null, Date.now());
  return selectionPresetToQuestion(preset, questionId ?? crypto.randomUUID());
}
