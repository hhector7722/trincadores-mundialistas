import type { LabDraft, LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";
import { selectionSlotsForFormation } from "@/lib/quiz/lab/hydrate";

function uid(): string {
  return crypto.randomUUID();
}

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

export function createLabQuestion(format: LabQuestionFormat): LabQuestion {
  const base = {
    id: uid(),
    prompt: "",
    timerSeconds: 10,
    options: defaultOptions(["Opción A", "Opción B", "Opción C", "Opción D"]),
    correctOptionId: "opt_1",
  };

  switch (format) {
    case "multiple_choice":
      return {
        ...base,
        format,
        prompt: "¿En qué año ganó España su primer Mundial?",
        imageUrl: null,
        options: defaultOptions(["2010", "2006", "1998", "1982"]),
        correctOptionId: "opt_1",
      };
    case "guess_image":
      return {
        ...base,
        format,
        prompt: "ADIVINA LA IMAGEN",
        imageUrl:
          "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80",
        blurStartPx: 24,
        revealSeconds: 8,
        options: defaultOptions(["Balón Nike", "Balón Adidas", "Balón Puma", "Balón Molten"]),
      };
    case "guess_selection":
      return {
        ...base,
        format,
        prompt: "ADIVINA LA SELECCIÓN",
        formation: "4-2-3-1",
        slots: selectionSlotsForFormation("4-2-3-1"),
        options: defaultOptions(["España", "Francia", "Inglaterra", "Portugal"]),
        correctOptionId: "opt_1",
      };
    case "video_play_end":
      return {
        ...base,
        format,
        prompt: "¿Cómo acabó la jugada?",
        videoUrl:
          "https://assets.mixkit.co/videos/preview/mixkit-football-player-dribbling-3268-large.mp4",
        stopAtSeconds: 2.5,
        options: defaultOptions(["Gol", "Palo", "Fuera de juego", "Parada del portero"]),
      };
  }
}

export function createDefaultLabDraft(): LabDraft {
  return {
    version: 1,
    title: "Borrador laboratorio",
    questions: [
      createLabQuestion("guess_selection"),
      createLabQuestion("guess_image"),
      createLabQuestion("video_play_end"),
      createLabQuestion("multiple_choice"),
    ],
  };
}
