import type { FormationId } from "@/lib/lineup/types";
import type { ClubSlotSeed } from "@/lib/quiz/lab/club-crests";
import { clubSlotWithCrest, SPAIN_DEMO_CLUB_SLOTS } from "@/lib/quiz/lab/club-crests";
import type { LabQuestionGuessSelection } from "@/lib/quiz/lab/types";

export type SelectionPreset = {
  id: string;
  nation: string;
  formation: FormationId;
  slots: ClubSlotSeed[];
  distractors: [string, string, string];
};

const FRANCE_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "AC Milan", playerName: "Mike Maignan" },
  { slotKey: "LB", clubLabel: "Chelsea", playerName: "Jules Koundé" },
  { slotKey: "LCB", clubLabel: "Bayern Munich", playerName: "Dayot Upamecano" },
  { slotKey: "RCB", clubLabel: "Liverpool", playerName: "Ibrahima Konaté" },
  { slotKey: "RB", clubLabel: "PSG", playerName: "Achraf Hakimi" },
  { slotKey: "LDM", clubLabel: "PSG", playerName: "Vitinha" },
  { slotKey: "RDM", clubLabel: "Real Madrid", playerName: "Aurélien Tchouaméni" },
  { slotKey: "LW", clubLabel: "Barcelona", playerName: "Ousmane Dembélé" },
  { slotKey: "AM", clubLabel: "Real Madrid", playerName: "Kylian Mbappé" },
  { slotKey: "RW", clubLabel: "Bayern Munich", playerName: "Kingsley Coman" },
  { slotKey: "ST", clubLabel: "Atlético Madrid", playerName: "Antoine Griezmann" },
];

const ENGLAND_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Arsenal", playerName: "Aaron Ramsdale" },
  { slotKey: "LB", clubLabel: "Chelsea", playerName: "Ben Chilwell" },
  { slotKey: "LCB", clubLabel: "Manchester City", playerName: "John Stones" },
  { slotKey: "RCB", clubLabel: "Arsenal", playerName: "Declan Rice" },
  { slotKey: "RB", clubLabel: "Manchester City", playerName: "Kyle Walker" },
  { slotKey: "LDM", clubLabel: "Liverpool", playerName: "Jordan Henderson" },
  { slotKey: "RDM", clubLabel: "Manchester City", playerName: "Phil Foden" },
  { slotKey: "LW", clubLabel: "Manchester City", playerName: "Jack Grealish" },
  { slotKey: "AM", clubLabel: "Arsenal", playerName: "Bukayo Saka" },
  { slotKey: "RW", clubLabel: "Tottenham", playerName: "Harry Kane" },
  { slotKey: "ST", clubLabel: "Manchester United", playerName: "Marcus Rashford" },
];

const BRAZIL_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Liverpool", playerName: "Alisson" },
  { slotKey: "LB", clubLabel: "Real Madrid", playerName: "Marcelo" },
  { slotKey: "LCB", clubLabel: "Real Madrid", playerName: "Éder Militão" },
  { slotKey: "RCB", clubLabel: "Arsenal", playerName: "Gabriel" },
  { slotKey: "RB", clubLabel: "Barcelona", playerName: "Dani Alves" },
  { slotKey: "LDM", clubLabel: "Manchester United", playerName: "Casemiro" },
  { slotKey: "RDM", clubLabel: "Real Madrid", playerName: "Rodrygo" },
  { slotKey: "LW", clubLabel: "Barcelona", playerName: "Raphinha" },
  { slotKey: "AM", clubLabel: "PSG", playerName: "Neymar" },
  { slotKey: "RW", clubLabel: "Real Madrid", playerName: "Vinícius Júnior" },
  { slotKey: "ST", clubLabel: "Arsenal", playerName: "Gabriel Jesus" },
];

export const LAB_SELECTION_PRESETS: SelectionPreset[] = [
  {
    id: "espana",
    nation: "España",
    formation: "4-2-3-1",
    slots: SPAIN_DEMO_CLUB_SLOTS,
    distractors: ["Francia", "Inglaterra", "Portugal"],
  },
  {
    id: "francia",
    nation: "Francia",
    formation: "4-2-3-1",
    slots: FRANCE_DEMO_CLUB_SLOTS,
    distractors: ["España", "Bélgica", "Alemania"],
  },
  {
    id: "inglaterra",
    nation: "Inglaterra",
    formation: "4-2-3-1",
    slots: ENGLAND_DEMO_CLUB_SLOTS,
    distractors: ["España", "Francia", "Países Bajos"],
  },
  {
    id: "brasil",
    nation: "Brasil",
    formation: "4-2-3-1",
    slots: BRAZIL_DEMO_CLUB_SLOTS,
    distractors: ["Argentina", "Uruguay", "Colombia"],
  },
];

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

export function selectionPresetToQuestion(
  preset: SelectionPreset,
  questionId: string
): LabQuestionGuessSelection {
  const labels = [preset.nation, ...preset.distractors];
  return {
    id: questionId,
    format: "guess_selection",
    prompt: "ADIVINA LA SELECCIÓN",
    formation: preset.formation,
    slots: preset.slots.map(clubSlotWithCrest),
    options: defaultOptions(labels),
    correctOptionId: "opt_1",
    timerSeconds: 10,
    selectionPresetId: preset.id,
  };
}

export function pickSelectionPreset(
  excludeId?: string | null,
  seed = Math.floor(Math.random() * 1_000_000)
): SelectionPreset {
  let pool = LAB_SELECTION_PRESETS;
  if (excludeId) {
    const filtered = pool.filter((preset) => preset.id !== excludeId);
    if (filtered.length) pool = filtered;
  }
  return pool[Math.abs(seed) % pool.length] ?? pool[0]!;
}
