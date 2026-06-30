import type { FormationId } from "@/lib/lineup/types";



export const LAB_QUESTION_FORMATS = [

  "image_trivia",
  "guess_player_silhouette",
  "guess_player_hair",
  "guess_player_eyes",
  "guess_selection",
  "video_play_end",
  "multiple_choice",
  "score_gap",
  "jersey_pick",
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



export type LabQuestionImageTrivia = LabQuestionBase & {

  format: "image_trivia";

  imageUrl: string;

  momentId?: string | null;

  momentLabel?: string | null;

  momentDifficulty?: "easy" | "medium" | "hard" | null;

  answerType?: "year" | "team" | "player" | "opponent" | "phase" | null;

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

  revealImageUrl: string | null;

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

  momentId?: string | null;

  momentLabel?: string | null;

};



export type LabQuestionVideoPlayEnd = LabQuestionBase & {
  format: "video_play_end";
  videoUrl: string;
  stopAtSeconds: number;
  momentId?: string | null;
  momentLabel?: string | null;
};

export type LabQuestionScoreGap = LabQuestionBase & {
  format: "score_gap";
  difficulty?: "easy" | "medium" | "hard" | null;
};

export type JerseyOption = {
  id: string;
  team: string;
  year: number;
  kit: "home" | "away";
  imageKey: string;
  isCorrect?: boolean;
};

export type LabQuestionJerseyPick = LabQuestionBase & {
  format: "jersey_pick";
  jerseyOptions: JerseyOption[];
};



export type LabQuestion =

  | LabQuestionMultipleChoice

  | LabQuestionImageTrivia

  | LabQuestionGuessSelection

  | LabQuestionGuessPlayerCrop
  | LabQuestionGuessPlayerSilhouette
  | LabQuestionVideoPlayEnd
  | LabQuestionScoreGap
  | LabQuestionJerseyPick;



export type LabDraft = {

  version: 1;

  title: string;

  questions: LabQuestion[];

};



export const LAB_FORMAT_LABELS: Record<LabQuestionFormat, string> = {

  multiple_choice: "Test clásico",

  image_trivia: "Pregunta sobre la imagen",

  guess_selection: "Adivina la selección",

  guess_player_hair: "Adivina el jugador (peinado)",

  guess_player_eyes: "Adivina el jugador (ojos)",
  guess_player_silhouette: "Adivina la silueta",
  video_play_end: "¿Cómo acabó la jugada?",
  score_gap: "Dato numérico (Score gap)",
  jersey_pick: "Adivina la camiseta",

};



export const LAB_FORMAT_DESCRIPTIONS: Record<LabQuestionFormat, string> = {

  multiple_choice: "Pregunta con texto, imagen opcional y 4 opciones.",

  image_trivia: "Imagen fija (gol, celebración…) y pregunta contextual: rival, año, fase…",

  guess_selection: "Escudos de clubes en formación sobre el campo.",

  guess_player_hair: "Primer plano del pelo; cabeza desde las cejas hacia arriba, sin mostrar cejas.",

  guess_player_eyes: "Primer plano de los ojos; sin pelo ni nariz.",
  guess_player_silhouette: "Varios jugadores en escena; uno en silueta negra opaca.",
  video_play_end: "Vídeo que se corta en seco; elige el desenlace.",
  score_gap: "Pregunta factual cuantitativa con 4 opciones numéricas/texto.",
  jersey_pick: "Adivina la camiseta exacta que vistió una selección en un partido icónico.",

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


