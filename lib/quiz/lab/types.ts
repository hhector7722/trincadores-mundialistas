import type { FormationId } from "@/lib/lineup/types";

export const LAB_QUESTION_FORMATS = [
  "multiple_choice",
  "guess_image",
  "guess_selection",
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
  video_play_end: "¿Cómo acabó la jugada?",
};

export const LAB_FORMAT_DESCRIPTIONS: Record<LabQuestionFormat, string> = {
  multiple_choice: "Pregunta con texto, imagen opcional y 4 opciones.",
  guess_image: "Imagen difuminada que se aclara con el tiempo.",
  guess_selection: "Escudos de clubes en formación sobre el campo.",
  video_play_end: "Vídeo que se corta en seco; elige el desenlace.",
};
