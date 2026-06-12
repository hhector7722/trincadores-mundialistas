import { normalizeText } from "@/lib/text/normalize-alias";

/** Escudos oficiales vía API-Sports (misma fuente que lineups). */
const API_SPORTS_CREST_BASE = "https://media.api-sports.io/football/teams";

const CLUB_API_SPORTS_IDS: Record<string, number> = {
  athletic: 531,
  "athletic club": 531,
  "athletic bilbao": 531,
  chelsea: 49,
  bournemouth: 35,
  "afc bournemouth": 35,
  atletico: 530,
  "atletico madrid": 530,
  "atlético": 530,
  "atlético madrid": 530,
  tottenham: 47,
  "tottenham hotspur": 47,
  psg: 85,
  "paris saint-germain": 85,
  barcelona: 529,
  "fc barcelona": 529,
  "real sociedad": 548,
  "ac milan": 489,
  milan: 489,
  arsenal: 42,
  inter: 505,
  "inter milan": 505,
  bayern: 157,
  "bayern munich": 157,
  "real madrid": 541,
  liverpool: 40,
  "manchester city": 50,
  "manchester united": 33,
  juventus: 496,
  napoli: 492,
  roma: 497,
  sevilla: 536,
  valencia: 532,
  villarreal: 533,
  betis: 543,
  "real betis": 543,
};

export function getApiSportsCrestUrl(teamId: number): string {
  return `${API_SPORTS_CREST_BASE}/${teamId}.png`;
}

export function resolveClubCrestUrl(clubLabel: string): string | null {
  const key = normalizeText(clubLabel);
  const teamId = CLUB_API_SPORTS_IDS[key];
  return teamId ? getApiSportsCrestUrl(teamId) : null;
}

export type ClubSlotSeed = {
  slotKey: string;
  clubLabel: string;
  playerName: string;
};

/** Demo España 4-2-3-1: clubes del puzzle + jugadores revelados al resolver. */
export const SPAIN_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Athletic Club", playerName: "Unai Simón" },
  { slotKey: "LB", clubLabel: "Chelsea", playerName: "Marc Cucurella" },
  { slotKey: "LCB", clubLabel: "Bournemouth", playerName: "Robin Le Normand" },
  { slotKey: "RCB", clubLabel: "Atlético Madrid", playerName: "José Gayà" },
  { slotKey: "RB", clubLabel: "Tottenham", playerName: "Pedro Porro" },
  { slotKey: "LDM", clubLabel: "PSG", playerName: "Fabián Ruiz" },
  { slotKey: "RDM", clubLabel: "Barcelona", playerName: "Pedri" },
  { slotKey: "LW", clubLabel: "Athletic Club", playerName: "Nico Williams" },
  { slotKey: "AM", clubLabel: "Real Sociedad", playerName: "Mikel Oyarzabal" },
  { slotKey: "RW", clubLabel: "Barcelona", playerName: "Lamine Yamal" },
  { slotKey: "ST", clubLabel: "AC Milan", playerName: "Álvaro Morata" },
];

export function clubSlotWithCrest(slot: ClubSlotSeed) {
  const crestUrl = resolveClubCrestUrl(slot.clubLabel);
  if (!crestUrl) {
    throw new Error(`Sin escudo oficial para: ${slot.clubLabel}`);
  }
  return {
    slotKey: slot.slotKey,
    clubLabel: slot.clubLabel,
    clubImageUrl: crestUrl,
    playerName: slot.playerName,
  };
}

export function demoPlayerNameForSlot(slotKey: string): string {
  return SPAIN_DEMO_CLUB_SLOTS.find((slot) => slot.slotKey === slotKey)?.playerName ?? "";
}
