import { LAB_DEMO_IMAGES } from "@/lib/quiz/lab/demo-assets";
import {
  LAB_DEMO_VIDEO_SRC,
  LAB_DEMO_VIDEO_STOP_AT_SECONDS,
} from "@/lib/quiz/lab/demo-video";
import { createImageTriviaFromCatalog } from "@/lib/quiz/lab/image-trivia-catalog";
import {
  createPlayerCropFromCatalog,
  createSelectionFromCatalog,
  createSilhouetteFromCatalog,
} from "@/lib/quiz/lab/reload-question";
import type { LabDraft, LabQuestion, LabQuestionFormat } from "@/lib/quiz/lab/types";

export {
  createImageTriviaFromCatalog,
  reloadImageTriviaFromCatalog,
} from "@/lib/quiz/lab/image-trivia-catalog";
export type { ImageTriviaCatalogOptions } from "@/lib/quiz/lab/image-trivia-catalog";

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

    case "image_trivia": {
      const fromCatalog = createImageTriviaFromCatalog({ minDifficulty: "medium" });
      if (fromCatalog) return fromCatalog;
      return {
        ...base,
        format,
        prompt: "¿En qué Mundial fue esta jugada?",
        imageUrl: "/images/quiz/historic/2022/wc2022-messi-cup.jpg",
        momentId: null,
        momentLabel: null,
        momentDifficulty: null,
        answerType: "year",
        options: defaultOptions(["2022", "2018", "2014", "2010"]),
        correctOptionId: "opt_1",
      };
    }

    case "guess_selection":
      return createSelectionFromCatalog();

    case "guess_player_hair": {
      const fromCatalog = createPlayerCropFromCatalog("guess_player_hair");
      if (fromCatalog) return fromCatalog;
      return {
        ...base,
        format,
        prompt: "¿QUIÉN ES?",
        imageUrl: LAB_DEMO_IMAGES.ronaldoHair2002,
        sceneHint: "Mundial 2002",
        options: defaultOptions(["Ronaldo Nazário", "Ronaldinho", "Rivaldo", "Adriano"]),
        correctOptionId: "opt_1",
      };
    }

    case "guess_player_eyes": {
      const fromCatalog = createPlayerCropFromCatalog("guess_player_eyes");
      if (fromCatalog) return fromCatalog;
      return {
        ...base,
        format,
        prompt: "¿QUIÉN ES?",
        imageUrl: LAB_DEMO_IMAGES.mbappeEyes,
        sceneHint: null,
        options: defaultOptions(["Kylian Mbappé", "Antoine Griezmann", "Karim Benzema", "Ousmane Dembélé"]),
        correctOptionId: "opt_1",
      };
    }

    case "guess_player_silhouette":
      return createSilhouetteFromCatalog();

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
      createLabQuestion("guess_player_silhouette"),
      createLabQuestion("guess_player_hair"),
      createLabQuestion("guess_player_eyes"),
      createLabQuestion("image_trivia"),
    ],
  };
}
