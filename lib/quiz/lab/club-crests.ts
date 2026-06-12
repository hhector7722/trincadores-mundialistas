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
};

/** Alineación demo España 4-2-3-1 (referencia visual del laboratorio). */
export const SPAIN_DEMO_CLUB_SLOTS: ClubSlotSeed[] = [
  { slotKey: "GK", clubLabel: "Athletic Club" },
  { slotKey: "LB", clubLabel: "Chelsea" },
  { slotKey: "LCB", clubLabel: "Bournemouth" },
  { slotKey: "RCB", clubLabel: "Atlético Madrid" },
  { slotKey: "RB", clubLabel: "Tottenham" },
  { slotKey: "LDM", clubLabel: "PSG" },
  { slotKey: "RDM", clubLabel: "Barcelona" },
  { slotKey: "LW", clubLabel: "Athletic Club" },
  { slotKey: "AM", clubLabel: "Real Sociedad" },
  { slotKey: "RW", clubLabel: "Barcelona" },
  { slotKey: "ST", clubLabel: "AC Milan" },
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
  };
}
