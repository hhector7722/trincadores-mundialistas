import type { FormationId } from "@/lib/lineup/types";
import type { ClubSlotSeed } from "@/lib/quiz/lab/club-crests";
import { clubSlotWithCrest, SPAIN_DEMO_CLUB_SLOTS } from "@/lib/quiz/lab/club-crests";
import type { LabQuestionGuessSelection } from "@/lib/quiz/lab/types";

/** Temporada de referencia para revisar plantillas (Mundial 2026). */
export const SELECTION_PRESETS_SEASON = "2025-26";

export type SelectionPreset = {
  id: string;
  nation: string;
  formation: FormationId;
  slots: ClubSlotSeed[];
  distractors: [string, string, string];
};

/** Francia 4-2-3-1 — once titular habitual; solo jugadores franceses. */
const FRANCE_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "AC Milan", playerName: "Mike Maignan" },
  { slotKey: "LB", clubLabel: "AC Milan", playerName: "Theo Hernández" },
  { slotKey: "LCB", clubLabel: "Bayern Munich", playerName: "Dayot Upamecano" },
  { slotKey: "RCB", clubLabel: "Arsenal", playerName: "William Saliba" },
  { slotKey: "RB", clubLabel: "Barcelona", playerName: "Jules Koundé" },
  { slotKey: "LDM", clubLabel: "Real Madrid", playerName: "Aurélien Tchouaméni" },
  { slotKey: "RDM", clubLabel: "PSG", playerName: "Warren Zaïre-Emery" },
  { slotKey: "LW", clubLabel: "PSG", playerName: "Bradley Barcola" },
  { slotKey: "AM", clubLabel: "Real Madrid", playerName: "Kylian Mbappé" },
  { slotKey: "RW", clubLabel: "PSG", playerName: "Ousmane Dembélé" },
  { slotKey: "ST", clubLabel: "Inter Milan", playerName: "Olivier Thuram" },
];

/** Inglaterra 4-2-3-1 — titulares actuales. */
const ENGLAND_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Everton", playerName: "Jordan Pickford" },
  { slotKey: "LB", clubLabel: "Manchester United", playerName: "Luke Shaw" },
  { slotKey: "LCB", clubLabel: "Manchester City", playerName: "John Stones" },
  { slotKey: "RCB", clubLabel: "Crystal Palace", playerName: "Marc Guéhi" },
  { slotKey: "RB", clubLabel: "Newcastle", playerName: "Kieran Trippier" },
  { slotKey: "LDM", clubLabel: "Arsenal", playerName: "Declan Rice" },
  { slotKey: "RDM", clubLabel: "Real Madrid", playerName: "Jude Bellingham" },
  { slotKey: "LW", clubLabel: "Manchester City", playerName: "Phil Foden" },
  { slotKey: "AM", clubLabel: "Chelsea", playerName: "Cole Palmer" },
  { slotKey: "RW", clubLabel: "Arsenal", playerName: "Bukayo Saka" },
  { slotKey: "ST", clubLabel: "Bayern Munich", playerName: "Harry Kane" },
];

/** Brasil 4-2-3-1 — titulares actuales. */
const BRAZIL_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Liverpool", playerName: "Alisson" },
  { slotKey: "LB", clubLabel: "Porto", playerName: "Wendell" },
  { slotKey: "LCB", clubLabel: "Arsenal", playerName: "Gabriel" },
  { slotKey: "RCB", clubLabel: "PSG", playerName: "Marquinhos" },
  { slotKey: "RB", clubLabel: "Juventus", playerName: "Danilo" },
  { slotKey: "LDM", clubLabel: "Fulham", playerName: "André" },
  { slotKey: "RDM", clubLabel: "Manchester United", playerName: "Casemiro" },
  { slotKey: "LW", clubLabel: "Barcelona", playerName: "Raphinha" },
  { slotKey: "AM", clubLabel: "Real Madrid", playerName: "Rodrygo" },
  { slotKey: "RW", clubLabel: "Real Madrid", playerName: "Vinícius Júnior" },
  { slotKey: "ST", clubLabel: "Tottenham", playerName: "Richarlison" },
];

/** Argentina 4-2-3-1 — titulares actuales. */
const ARGENTINA_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Aston Villa", playerName: "Emiliano Martínez" },
  { slotKey: "LB", clubLabel: "Sevilla", playerName: "Marcos Acuña" },
  { slotKey: "LCB", clubLabel: "Benfica", playerName: "Nicolás Otamendi" },
  { slotKey: "RCB", clubLabel: "Tottenham", playerName: "Cristian Romero" },
  { slotKey: "RB", clubLabel: "Atlético Madrid", playerName: "Nahuel Molina" },
  { slotKey: "LDM", clubLabel: "Roma", playerName: "Leandro Paredes" },
  { slotKey: "RDM", clubLabel: "Chelsea", playerName: "Enzo Fernández" },
  { slotKey: "LW", clubLabel: "Juventus", playerName: "Nicolás González" },
  { slotKey: "AM", clubLabel: "Inter Miami", playerName: "Lionel Messi" },
  { slotKey: "RW", clubLabel: "Benfica", playerName: "Ángel Di María" },
  { slotKey: "ST", clubLabel: "Inter Milan", playerName: "Lautaro Martínez" },
];

/** Alemania 4-2-3-1 — titulares actuales. */
const GERMANY_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Bayern Munich", playerName: "Manuel Neuer" },
  { slotKey: "LB", clubLabel: "RB Leipzig", playerName: "David Raum" },
  { slotKey: "LCB", clubLabel: "Bayern Munich", playerName: "Jonathan Tah" },
  { slotKey: "RCB", clubLabel: "Real Madrid", playerName: "Antonio Rüdiger" },
  { slotKey: "RB", clubLabel: "Bayern Munich", playerName: "Joshua Kimmich" },
  { slotKey: "LDM", clubLabel: "Bayer Leverkusen", playerName: "Robert Andrich" },
  { slotKey: "RDM", clubLabel: "Brighton", playerName: "Pascal Groß" },
  { slotKey: "LW", clubLabel: "Bayer Leverkusen", playerName: "Florian Wirtz" },
  { slotKey: "AM", clubLabel: "Bayern Munich", playerName: "Jamal Musiala" },
  { slotKey: "RW", clubLabel: "Bayern Munich", playerName: "Leroy Sané" },
  { slotKey: "ST", clubLabel: "Arsenal", playerName: "Kai Havertz" },
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
  {
    id: "argentina",
    nation: "Argentina",
    formation: "4-2-3-1",
    slots: ARGENTINA_DEMO_CLUB_SLOTS,
    distractors: ["Brasil", "Uruguay", "España"],
  },
  {
    id: "alemania",
    nation: "Alemania",
    formation: "4-2-3-1",
    slots: GERMANY_DEMO_CLUB_SLOTS,
    distractors: ["Francia", "España", "Países Bajos"],
  },
];

function defaultOptions(labels: string[]) {
  return labels.map((label, index) => ({
    id: `opt_${index + 1}`,
    label,
  }));
}

export function getSelectionPresetById(id: string): SelectionPreset | null {
  return LAB_SELECTION_PRESETS.find((preset) => preset.id === id) ?? null;
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
