import { LAB_DEMO_IMAGES } from "@/lib/quiz/lab/demo-assets";
import { LAB_DEMO_VIDEO_SRC, LAB_DEMO_VIDEO_STOP_AT_SECONDS } from "@/lib/quiz/lab/demo-video";
import { reloadImageTriviaFromCatalog } from "@/lib/quiz/lab/image-trivia-catalog";
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
  LabQuestionVideoPlayEnd,
} from "@/lib/quiz/lab/types";
import { shuffleWithRng } from "@/lib/quiz/rng";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import {
  filterCatalogReadyMoments,
  filterMomentsByDifficulty,
  resolveMomentImageUrl,
  type WorldCupMoment,
  type WorldCupMomentDifficulty,
} from "@/lib/quiz/world-cup-moments";

const RELOADABLE_FORMATS = new Set<LabQuestionFormat>([
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

function pickPlayerMoment(opts?: {
  seed?: number;
  excludeIds?: string[];
  minDifficulty?: WorldCupMomentDifficulty;
}): WorldCupMoment | null {
  const catalog = getWorldCupMomentsCatalog();
  const seed = opts?.seed ?? Math.floor(Math.random() * 1_000_000);
  const exclude = new Set(opts?.excludeIds ?? []);
  const minDifficulty = opts?.minDifficulty ?? "medium";

  let ready = filterCatalogReadyMoments(catalog.moments).filter(
    (moment) => moment.quiz.answer_type === "player"
  );
  ready = filterMomentsByDifficulty(ready, minDifficulty);
  if (exclude.size) {
    ready = ready.filter((moment) => !exclude.has(moment.id));
  }

  if (!ready.length) {
    ready = filterCatalogReadyMoments(catalog.moments).filter(
      (moment) => moment.quiz.answer_type === "player" && !exclude.has(moment.id)
    );
  }

  if (!ready.length) return null;
  ready.sort((a, b) => a.id.localeCompare(b.id));
  return ready[Math.abs(seed) % ready.length] ?? null;
}

function momentSceneHint(moment: WorldCupMoment): string {
  const teams = moment.teams.join(" vs ");
  return `${moment.year} — ${teams}`;
}

function momentToPlayerCropQuestion(
  moment: WorldCupMoment,
  format: "guess_player_hair" | "guess_player_eyes",
  questionId: string
): LabQuestionGuessPlayerCrop {
  const imageUrl = resolveMomentImageUrl(moment) ?? "";
  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );

  return {
    id: questionId,
    format,
    prompt: "¿QUIÉN ES?",
    imageUrl,
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

type SilhouetteDemo = {
  id: string;
  imageUrl: string;
  revealImageUrl: string | null;
  sceneLabel: string;
  options: [string, string, string, string];
  correctIndex: number;
};

const SILHOUETTE_DEMOS: SilhouetteDemo[] = [
  {
    id: "espana-2008",
    imageUrl: LAB_DEMO_IMAGES.spain2008Silhouette,
    revealImageUrl: null,
    sceneLabel: "Euro 2008 — España",
    options: ["David Silva", "Xavi Hernández", "Andrés Iniesta", "David Villa"],
    correctIndex: 0,
  },
  {
    id: "brasil-2002",
    imageUrl: LAB_DEMO_IMAGES.brazil2002Silhouette,
    revealImageUrl: null,
    sceneLabel: "Mundial 2002 — Brasil",
    options: ["Ronaldo Nazário", "Rivaldo", "Ronaldinho", "Cafu"],
    correctIndex: 0,
  },
];

function pickSilhouetteDemo(excludeId?: string | null, seed = Math.floor(Math.random() * 1_000_000)) {
  let pool = SILHOUETTE_DEMOS;
  if (excludeId) {
    const filtered = pool.filter((demo) => demo.id !== excludeId);
    if (filtered.length) pool = filtered;
  }
  return pool[Math.abs(seed) % pool.length] ?? pool[0]!;
}

function silhouetteDemoToQuestion(
  demo: SilhouetteDemo,
  questionId: string
): LabQuestionGuessPlayerSilhouette {
  return {
    id: questionId,
    format: "guess_player_silhouette",
    prompt: "¿QUÉ JUGADOR ES LA SILUETA?",
    imageUrl: demo.imageUrl,
    revealImageUrl: demo.revealImageUrl,
    sceneLabel: demo.sceneLabel,
    timerSeconds: 10,
    silhouetteDemoId: demo.id,
    options: defaultOptions([...demo.options]),
    correctOptionId: `opt_${demo.correctIndex + 1}`,
  };
}

function reloadPlayerCrop(
  question: LabQuestionGuessPlayerCrop,
  minDifficulty: WorldCupMomentDifficulty
): LabQuestionGuessPlayerCrop {
  const moment = pickPlayerMoment({
    excludeIds: question.momentId ? [question.momentId] : undefined,
    minDifficulty,
    seed: Date.now(),
  });

  if (moment) {
    return momentToPlayerCropQuestion(moment, question.format, question.id);
  }

  return question;
}

function reloadSilhouette(
  question: LabQuestionGuessPlayerSilhouette
): LabQuestionGuessPlayerSilhouette {
  const demo = pickSilhouetteDemo(question.silhouetteDemoId, Date.now());
  return silhouetteDemoToQuestion(demo, question.id);
}

function reloadSelection(question: LabQuestionGuessSelection): LabQuestionGuessSelection {
  const preset = pickSelectionPreset(question.selectionPresetId, Date.now());
  return selectionPresetToQuestion(preset, question.id);
}

function reloadVideo(question: LabQuestionVideoPlayEnd): LabQuestionVideoPlayEnd {
  const correctLabel =
    question.options.find((option) => option.id === question.correctOptionId)?.label ??
    question.options[0]?.label ??
    "Gol";

  const labels = question.options.map((option) => option.label);
  const shuffled = shuffleWithRng(labels, () => Math.random());
  const options = defaultOptions(shuffled);
  const correctOptionId =
    options.find((option) => option.label === correctLabel)?.id ?? "opt_1";

  return {
    ...question,
    videoUrl: question.videoUrl || LAB_DEMO_VIDEO_SRC,
    stopAtSeconds: question.stopAtSeconds || LAB_DEMO_VIDEO_STOP_AT_SECONDS,
    options,
    correctOptionId,
  };
}

export type ReloadLabQuestionOptions = {
  minDifficulty?: WorldCupMomentDifficulty;
};

export function reloadLabQuestion(
  question: LabQuestion,
  opts?: ReloadLabQuestionOptions
): LabQuestion {
  const minDifficulty = opts?.minDifficulty ?? "hard";

  switch (question.format) {
    case "image_trivia":
      return reloadImageTriviaFromCatalog(question as LabQuestionImageTrivia, minDifficulty);
    case "guess_selection":
      return reloadSelection(question);
    case "guess_player_hair":
    case "guess_player_eyes":
      return reloadPlayerCrop(question, minDifficulty);
    case "guess_player_silhouette":
      return reloadSilhouette(question);
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
  const moment = pickPlayerMoment({ minDifficulty, seed: Date.now() });
  if (!moment) return null;
  return momentToPlayerCropQuestion(moment, format, questionId ?? crypto.randomUUID());
}

export function createSilhouetteFromCatalog(questionId?: string): LabQuestionGuessPlayerSilhouette {
  const demo = pickSilhouetteDemo(null, Date.now());
  return silhouetteDemoToQuestion(demo, questionId ?? crypto.randomUUID());
}

export function createSelectionFromCatalog(questionId?: string): LabQuestionGuessSelection {
  const preset = pickSelectionPreset(null, Date.now());
  return selectionPresetToQuestion(preset, questionId ?? crypto.randomUUID());
}
