import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import type { FormationId } from "@/lib/lineup/types";
import { clubSlotWithCrest, resolveClubCrestUrl, SPAIN_DEMO_CLUB_SLOTS } from "@/lib/quiz/lab/club-crests";
import type { LabDraft, LabQuestion, LabQuestionGuessSelection } from "@/lib/quiz/lab/types";

const GENERIC_OPTION_LABELS = new Set(["opción a", "opción b", "opción c", "opción d"]);

function hasGenericOptions(labels: string[]): boolean {
  return labels.every((label) => GENERIC_OPTION_LABELS.has(label.trim().toLowerCase()));
}

function hydrateGuessSelection(question: LabQuestionGuessSelection): LabQuestionGuessSelection {
  const useSpainDemo =
    question.formation === "4-2-3-1" &&
    question.slots.every((slot) => !slot.clubImageUrl);

  const seeds = useSpainDemo
    ? SPAIN_DEMO_CLUB_SLOTS
    : question.slots.map((slot) => ({
        slotKey: slot.slotKey,
        clubLabel: slot.clubLabel,
      }));

  const slots = seeds.map((seed, index) => {
    const existing = question.slots[index];
    const crestUrl =
      resolveClubCrestUrl(seed.clubLabel) ?? existing?.clubImageUrl ?? null;
    return {
      slotKey: seed.slotKey,
      clubLabel: seed.clubLabel,
      clubImageUrl: crestUrl,
    };
  });

  return { ...question, slots };
}

function hydrateMultipleChoice(question: LabQuestion): LabQuestion {
  if (question.format !== "multiple_choice") return question;

  const labels = question.options.map((o) => o.label);
  if (!hasGenericOptions(labels)) return question;

  const prompt = question.prompt.toLowerCase();
  if (prompt.includes("españa") && prompt.includes("mundial")) {
    return {
      ...question,
      options: [
        { id: "opt_1", label: "2010" },
        { id: "opt_2", label: "2006" },
        { id: "opt_3", label: "1998" },
        { id: "opt_4", label: "1982" },
      ],
      correctOptionId: "opt_1",
    };
  }

  return {
    ...question,
    options: [
      { id: "opt_1", label: "Respuesta 1" },
      { id: "opt_2", label: "Respuesta 2" },
      { id: "opt_3", label: "Respuesta 3" },
      { id: "opt_4", label: "Respuesta 4" },
    ],
  };
}

function hydrateVideo(question: LabQuestion): LabQuestion {
  if (question.format !== "video_play_end") return question;

  const isSampleBlaze = question.videoUrl.includes("ForBiggerBlazes");
  if (!isSampleBlaze) return question;

  return {
    ...question,
    videoUrl:
      "https://assets.mixkit.co/videos/preview/mixkit-football-player-dribbling-3268-large.mp4",
    stopAtSeconds: 2.5,
    prompt: "¿Cómo acabó la jugada?",
  };
}

export function hydrateLabQuestion(question: LabQuestion): LabQuestion {
  let next = question;
  if (next.format === "guess_selection") {
    next = hydrateGuessSelection(next);
  }
  next = hydrateMultipleChoice(next);
  next = hydrateVideo(next);
  return next;
}

export function hydrateLabDraft(draft: LabDraft): LabDraft {
  return {
    ...draft,
    questions: draft.questions.map(hydrateLabQuestion),
  };
}

export function selectionSlotsForFormation(formation: FormationId) {
  if (formation === "4-2-3-1") {
    return SPAIN_DEMO_CLUB_SLOTS.map(clubSlotWithCrest);
  }

  return FORMATION_SLOT_ANCHORS[formation].map((anchor, index) => {
    const seed = SPAIN_DEMO_CLUB_SLOTS[index % SPAIN_DEMO_CLUB_SLOTS.length];
    return clubSlotWithCrest({
      slotKey: anchor.key,
      clubLabel: seed?.clubLabel ?? `Club ${index + 1}`,
    });
  });
}
