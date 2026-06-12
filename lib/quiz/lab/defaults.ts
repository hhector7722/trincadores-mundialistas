import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import type { FormationId } from "@/lib/lineup/types";
import type { LabDraft, LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";

function uid(): string {
  return crypto.randomUUID();
}

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

function selectionSlotsForFormation(formation: FormationId) {
  const demoClubs = [
    "Athletic",
    "Chelsea",
    "Bournemouth",
    "Atlético",
    "Tottenham",
    "PSG",
    "Barcelona",
    "Real Sociedad",
    "AC Milan",
    "Arsenal",
    "Inter",
    "Bayern",
  ];

  return FORMATION_SLOT_ANCHORS[formation].map((anchor, index) => ({
    slotKey: anchor.key,
    clubLabel: demoClubs[index % demoClubs.length] ?? `Club ${index + 1}`,
    clubImageUrl: null,
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
        options: defaultOptions(["Balón Nike", "Balón Adidas", "Balón Puma", "Balón molten"]),
      };
    case "guess_selection":
      return {
        ...base,
        format,
        prompt: "ADIVINA LA SELECCIÓN",
        formation: "4-2-3-1",
        slots: selectionSlotsForFormation("4-2-3-1"),
        options: defaultOptions(["España", "Francia", "Inglaterra", "Portugal"]),
      };
    case "video_play_end":
      return {
        ...base,
        format,
        prompt: "¿Cómo acabó la jugada?",
        videoUrl:
          "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
        stopAtSeconds: 3,
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
