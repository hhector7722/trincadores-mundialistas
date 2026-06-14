import { LAB_DEMO_IMAGES } from "@/lib/quiz/lab/demo-assets";
import { momentToGuessImageQuestion } from "@/lib/quiz/lab/from-moment";
import {
  LAB_DEMO_VIDEO_SRC,
  LAB_DEMO_VIDEO_STOP_AT_SECONDS,
} from "@/lib/quiz/lab/demo-video";
import type { LabDraft, LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";
import { selectionSlotsForFormation } from "@/lib/quiz/lab/hydrate";
import { getWorldCupMomentsCatalog } from "@/lib/quiz/world-cup-moments-catalog";
import { pickGuessImageMoment } from "@/lib/quiz/world-cup-moments";

const FALLBACK_GUESS_IMAGE_URL =
  "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80";

function defaultGuessImageQuestion(): LabQuestion {
  try {
    const catalog = getWorldCupMomentsCatalog();
    const moment = pickGuessImageMoment(catalog, { minDifficulty: "hard" });
    const fromCatalog = moment ? momentToGuessImageQuestion(moment) : null;
    if (fromCatalog) return fromCatalog;
  } catch {
    // Catálogo ausente o inválido: fallback demo.
  }

  return {
    id: uid(),
    format: "guess_image",
    prompt: "ADIVINA LA IMAGEN",
    imageUrl: FALLBACK_GUESS_IMAGE_URL,
    blurStartPx: 24,
    revealSeconds: 8,
    timerSeconds: 10,
    options: defaultOptions(["Balón Nike", "Balón Adidas", "Balón Puma", "Balón Molten"]),
    correctOptionId: "opt_1",
  };
}



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
      return defaultGuessImageQuestion();

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

    case "guess_player_hair":

      return {

        ...base,

        format,

        prompt: "¿QUIÉN ES?",

        imageUrl: LAB_DEMO_IMAGES.ronaldoHair2002,

        sceneHint: "Mundial 2002",

        options: defaultOptions(["Ronaldo Nazário", "Ronaldinho", "Rivaldo", "Adriano"]),

        correctOptionId: "opt_1",

      };

    case "guess_player_eyes":

      return {

        ...base,

        format,

        prompt: "¿QUIÉN ES?",

        imageUrl: LAB_DEMO_IMAGES.mbappeEyes,

        sceneHint: null,

        options: defaultOptions(["Kylian Mbappé", "Antoine Griezmann", "Karim Benzema", "Ousmane Dembélé"]),

        correctOptionId: "opt_1",

      };

    case "guess_player_silhouette":

      return {

        ...base,

        format,

        prompt: "¿QUÉ JUGADOR ES LA SILUETA?",

        imageUrl: LAB_DEMO_IMAGES.spain2008Silhouette,

        revealImageUrl: null,

        sceneLabel: "Euro 2008 — España",

        options: defaultOptions(["David Silva", "Xavi Hernández", "Andrés Iniesta", "David Villa"]),

        correctOptionId: "opt_1",

      };

    case "video_play_end":

      return {

        ...base,

        format,

        prompt: "¿Cómo acabó la jugada?",

        videoUrl: LAB_DEMO_VIDEO_SRC,

        stopAtSeconds: LAB_DEMO_VIDEO_STOP_AT_SECONDS,

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

      createLabQuestion("guess_player_hair"),

      createLabQuestion("guess_player_eyes"),

      createLabQuestion("guess_player_silhouette"),

      createLabQuestion("guess_image"),

      createLabQuestion("video_play_end"),

      createLabQuestion("multiple_choice"),

    ],

  };

}


