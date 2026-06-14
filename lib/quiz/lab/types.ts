import type { FormationId } from "@/lib/lineup/types";



export const LAB_QUESTION_FORMATS = [

  "multiple_choice",

  "guess_image",

  "guess_selection",

  "guess_player_hair",

  "guess_player_eyes",

  "guess_player_silhouette",

  "video_play_end",

] as const;



export type LabQuestionFormat = (typeof LAB_QUESTION_FORMATS)[number];



export type LabOption = {

  id: string;

  label: string;

};



export type LabQuestionBase = {

  id: string;

  format: LabQuestionFormat;

  prompt: string;

  options: LabOption[];

  correctOptionId: string;

  timerSeconds: number;

};



export type LabQuestionMultipleChoice = LabQuestionBase & {

  format: "multiple_choice";

  imageUrl: string | null;

};



export type LabQuestionGuessImage = LabQuestionBase & {

  format: "guess_image";

  imageUrl: string;

  blurStartPx: number;

  revealSeconds: number;

  /** Id del momento en world-cup-moments.json (solo laboratorio). */
  momentId?: string | null;

  momentLabel?: string | null;

  momentDifficulty?: "easy" | "medium" | "hard" | null;

};



export type LabSelectionSlot = {

  slotKey: string;

  clubLabel: string;

  clubImageUrl: string | null;

  playerName: string;

};



export type LabQuestionGuessSelection = LabQuestionBase & {

  format: "guess_selection";

  formation: FormationId;

  slots: LabSelectionSlot[];

  selectionPresetId?: string | null;

};



export type LabQuestionGuessPlayerCrop = LabQuestionBase & {

  format: "guess_player_hair" | "guess_player_eyes";

  imageUrl: string;

  sceneHint: string | null;

  momentId?: string | null;

  momentLabel?: string | null;

};



export type LabQuestionGuessPlayerSilhouette = LabQuestionBase & {

  format: "guess_player_silhouette";

  imageUrl: string;

  revealImageUrl: string | null;

  sceneLabel: string;

  silhouetteDemoId?: string | null;

};



export type LabQuestionVideoPlayEnd = LabQuestionBase & {

  format: "video_play_end";

  videoUrl: string;

  stopAtSeconds: number;

};



export type LabQuestion =

  | LabQuestionMultipleChoice

  | LabQuestionGuessImage

  | LabQuestionGuessSelection

  | LabQuestionGuessPlayerCrop

  | LabQuestionGuessPlayerSilhouette

  | LabQuestionVideoPlayEnd;



export type LabDraft = {

  version: 1;

  title: string;

  questions: LabQuestion[];

};



export const LAB_FORMAT_LABELS: Record<LabQuestionFormat, string> = {

  multiple_choice: "Test clásico",

  guess_image: "Adivina la imagen",

  guess_selection: "Adivina la selección",

  guess_player_hair: "Adivina el jugador (peinado)",

  guess_player_eyes: "Adivina el jugador (ojos)",

  guess_player_silhouette: "Adivina la silueta",

  video_play_end: "¿Cómo acabó la jugada?",

};



export const LAB_FORMAT_DESCRIPTIONS: Record<LabQuestionFormat, string> = {

  multiple_choice: "Pregunta con texto, imagen opcional y 4 opciones.",

  guess_image: "Imagen difuminada que se aclara con el tiempo.",

  guess_selection: "Escudos de clubes en formación sobre el campo.",

  guess_player_hair: "Recorte del pelo o cabeza; al resolver se revela el jugador.",

  guess_player_eyes: "Recorte de los ojos; al resolver se revela el jugador.",

  guess_player_silhouette: "Foto de equipo con un jugador en silueta negra.",

  video_play_end: "Vídeo que se corta en seco; elige el desenlace.",

};



export function isLabPlayerCropFormat(
  format: LabQuestionFormat,
): format is "guess_player_hair" | "guess_player_eyes" {
  return format === "guess_player_hair" || format === "guess_player_eyes";
}

export function isLabPlayerCropQuestion(
  question: LabQuestion,
): question is LabQuestionGuessPlayerCrop {
  return isLabPlayerCropFormat(question.format);
}

export function isLabPlayerSilhouetteQuestion(
  question: LabQuestion,
): question is LabQuestionGuessPlayerSilhouette {
  return question.format === "guess_player_silhouette";
}


