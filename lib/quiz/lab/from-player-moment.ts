import { resolveLabAssetUrl } from "@/lib/quiz/lab/lab-asset-url";
import type {
  LabQuestionGuessPlayerCrop,
  LabQuestionGuessPlayerSilhouette,
} from "@/lib/quiz/lab/types";
import { resolveMomentImageUrl, type WorldCupMoment } from "@/lib/quiz/world-cup-moments";

function momentSceneHint(moment: WorldCupMoment): string {
  return `${moment.year} — ${moment.teams.join(" vs ")}`;
}

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

export function momentToPlayerCropQuestion(
  moment: WorldCupMoment,
  format: "guess_player_hair" | "guess_player_eyes",
  questionId: string
): LabQuestionGuessPlayerCrop | null {
  const sourcePath = resolveMomentImageUrl(moment);
  if (!sourcePath) return null;

  const correctIndex = moment.quiz.options.findIndex(
    (option) => option === moment.quiz.correct_option
  );
  const variant = format === "guess_player_hair" ? "hair" : "eyes";

  return {
    id: questionId,
    format,
    prompt: "¿QUIÉN ES?",
    imageUrl: resolveLabAssetUrl(moment.id, variant),
    revealImageUrl: sourcePath,
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

export function momentToSilhouetteQuestion(
  moment: WorldCupMoment,
  questionId: string
): LabQuestionGuessPlayerSilhouette | null {
  const sourcePath = resolveMomentImageUrl(moment);
  if (!sourcePath) return null;

  const correctPlayer = moment.quiz.correct_option;
  const distractors = moment.quiz.options.filter((option) => option !== correctPlayer);
  const options = [correctPlayer, ...distractors.slice(0, 3)] as [
    string,
    string,
    string,
    string,
  ];

  return {
    id: questionId,
    format: "guess_player_silhouette",
    prompt: "¿QUÉ JUGADOR ES LA SILUETA?",
    imageUrl: resolveLabAssetUrl(moment.id, "silhouette"),
    revealImageUrl: sourcePath,
    sceneLabel: momentSceneHint(moment),
    timerSeconds: 10,
    silhouetteDemoId: null,
    momentId: moment.id,
    momentLabel: moment.label,
    options: defaultOptions([...options]),
    correctOptionId: "opt_1",
  };
}
