/**
 * Nombres canónicos OpenFootball (matches.home_team) y alias FIFA/Fjelstul.
 * Las plantillas 2026 se almacenan con el nombre del catálogo de porra.
 */

/** Código FIFA (Abbreviation) → nombre en matches / OpenFootball. */
export const FIFA_CODE_TO_OPENFOOTBALL: Record<string, string> = {
  ALG: "Algeria",
  ARG: "Argentina",
  AUS: "Australia",
  AUT: "Austria",
  BEL: "Belgium",
  BIH: "Bosnia & Herzegovina",
  BRA: "Brazil",
  CAN: "Canada",
  CPV: "Cape Verde",
  COL: "Colombia",
  CIV: "Ivory Coast",
  CRO: "Croatia",
  CUW: "Curaçao",
  CZE: "Czech Republic",
  COD: "DR Congo",
  ECU: "Ecuador",
  EGY: "Egypt",
  ENG: "England",
  FRA: "France",
  GER: "Germany",
  GHA: "Ghana",
  HAI: "Haiti",
  IRN: "Iran",
  IRQ: "Iraq",
  JOR: "Jordan",
  JPN: "Japan",
  KOR: "South Korea",
  MAR: "Morocco",
  MEX: "Mexico",
  NED: "Netherlands",
  NOR: "Norway",
  NZL: "New Zealand",
  PAN: "Panama",
  PAR: "Paraguay",
  POR: "Portugal",
  QAT: "Qatar",
  RSA: "South Africa",
  KSA: "Saudi Arabia",
  SCO: "Scotland",
  SEN: "Senegal",
  ESP: "Spain",
  SUI: "Switzerland",
  SWE: "Sweden",
  TUN: "Tunisia",
  TUR: "Turkey",
  USA: "USA",
  URU: "Uruguay",
  UZB: "Uzbekistan",
};

const ALIAS_TO_CANONICAL: Record<string, string> = {
  "united states": "USA",
  usa: "USA",
  "korea republic": "South Korea",
  "south korea": "South Korea",
  "czechia": "Czech Republic",
  "czech republic": "Czech Republic",
  "côte d'ivoire": "Ivory Coast",
  "cote d'ivoire": "Ivory Coast",
  "ivory coast": "Ivory Coast",
  "congo dr": "DR Congo",
  "dr congo": "DR Congo",
  "democratic republic of the congo": "DR Congo",
  "bosnia and herzegovina": "Bosnia & Herzegovina",
  "bosnia & herzegovina": "Bosnia & Herzegovina",
  "ir iran": "Iran",
  iran: "Iran",
  "cabo verde": "Cape Verde",
  "cape verde": "Cape Verde",
  türkiye: "Turkey",
  turkey: "Turkey",
};

/** Resuelve nombre FIFA/OpenFootball/Fjelstul al canónico de catálogo. */
export function openFootballTeamName(input: string): string {
  const trimmed = input.trim();
  const key = trimmed.toLowerCase();
  if (ALIAS_TO_CANONICAL[key]) return ALIAS_TO_CANONICAL[key];
  return trimmed;
}

/** Variantes para consultar team_squads (canónico + alias históricos). */
export function squadLookupNames(input: string): string[] {
  const canonical = openFootballTeamName(input);
  const names = new Set<string>([canonical, input.trim()]);

  if (canonical === "USA") names.add("United States");
  if (canonical === "South Korea") names.add("Korea Republic");
  if (canonical === "DR Congo") {
    names.add("Congo DR");
    names.add("Democratic Republic of the Congo");
  }
  if (canonical === "Ivory Coast") names.add("Côte d'Ivoire");
  if (canonical === "Bosnia & Herzegovina") names.add("Bosnia and Herzegovina");
  if (canonical === "Cape Verde") names.add("Cabo Verde");
  if (canonical === "Iran") names.add("IR Iran");
  if (canonical === "Turkey") names.add("Türkiye");

  return [...names];
}

export function openFootballNameFromFifaCode(fifaCode: string): string | null {
  return FIFA_CODE_TO_OPENFOOTBALL[fifaCode.trim().toUpperCase()] ?? null;
}

/** Nombre OpenFootball → código FIFA (MEX, RSA…). */
export function fifaCodeFromOpenFootball(teamName: string): string | null {
  const canonical = openFootballTeamName(teamName);
  for (const [code, name] of Object.entries(FIFA_CODE_TO_OPENFOOTBALL)) {
    if (name === canonical) return code;
  }
  return null;
}
