import { toSlug } from "@/lib/openfootball/slug";

type TeamDisplay = {
  nameEs: string;
  abbr: string;
};

/** Nombre en español + abreviatura FIFA para equipos del catálogo WC2026. */
const TEAM_DISPLAY_BY_SLUG: Record<string, TeamDisplay> = {
  algeria: { nameEs: "Argelia", abbr: "ALG" },
  argentina: { nameEs: "Argentina", abbr: "ARG" },
  australia: { nameEs: "Australia", abbr: "AUS" },
  austria: { nameEs: "Austria", abbr: "AUT" },
  belgium: { nameEs: "Bélgica", abbr: "BEL" },
  "bosnia-and-herzegovina": { nameEs: "Bosnia", abbr: "BIH" },
  brazil: { nameEs: "Brasil", abbr: "BRA" },
  canada: { nameEs: "Canadá", abbr: "CAN" },
  "cape-verde": { nameEs: "Cabo Verde", abbr: "CPV" },
  colombia: { nameEs: "Colombia", abbr: "COL" },
  croatia: { nameEs: "Croacia", abbr: "CRO" },
  curacao: { nameEs: "Curazao", abbr: "CUW" },
  "czech-republic": { nameEs: "Rep. Checa", abbr: "CZE" },
  "dr-congo": { nameEs: "RD Congo", abbr: "COD" },
  ecuador: { nameEs: "Ecuador", abbr: "ECU" },
  egypt: { nameEs: "Egipto", abbr: "EGY" },
  england: { nameEs: "Inglaterra", abbr: "ENG" },
  france: { nameEs: "Francia", abbr: "FRA" },
  germany: { nameEs: "Alemania", abbr: "GER" },
  ghana: { nameEs: "Ghana", abbr: "GHA" },
  haiti: { nameEs: "Haití", abbr: "HAI" },
  iran: { nameEs: "Irán", abbr: "IRN" },
  iraq: { nameEs: "Irak", abbr: "IRQ" },
  "ivory-coast": { nameEs: "Costa de Marfil", abbr: "CIV" },
  japan: { nameEs: "Japón", abbr: "JPN" },
  jordan: { nameEs: "Jordania", abbr: "JOR" },
  mexico: { nameEs: "México", abbr: "MEX" },
  morocco: { nameEs: "Marruecos", abbr: "MAR" },
  netherlands: { nameEs: "Países Bajos", abbr: "NED" },
  "new-zealand": { nameEs: "Nueva Zelanda", abbr: "NZL" },
  norway: { nameEs: "Noruega", abbr: "NOR" },
  panama: { nameEs: "Panamá", abbr: "PAN" },
  paraguay: { nameEs: "Paraguay", abbr: "PAR" },
  portugal: { nameEs: "Portugal", abbr: "POR" },
  qatar: { nameEs: "Catar", abbr: "QAT" },
  "saudi-arabia": { nameEs: "Arabia Saudí", abbr: "KSA" },
  scotland: { nameEs: "Escocia", abbr: "SCO" },
  senegal: { nameEs: "Senegal", abbr: "SEN" },
  "south-africa": { nameEs: "Sudáfrica", abbr: "RSA" },
  "south-korea": { nameEs: "Corea del Sur", abbr: "KOR" },
  spain: { nameEs: "España", abbr: "ESP" },
  sweden: { nameEs: "Suecia", abbr: "SWE" },
  switzerland: { nameEs: "Suiza", abbr: "SUI" },
  tunisia: { nameEs: "Túnez", abbr: "TUN" },
  turkey: { nameEs: "Turquía", abbr: "TUR" },
  usa: { nameEs: "Estados Unidos", abbr: "USA" },
  uruguay: { nameEs: "Uruguay", abbr: "URU" },
  uzbekistan: { nameEs: "Uzbekistán", abbr: "UZB" },
};

/** Etiqueta compacta para celdas del calendario: "España ESP". */
export function formatTeamCalendarLabel(teamName: string): string {
  const entry = TEAM_DISPLAY_BY_SLUG[toSlug(teamName)];
  if (entry) {
    return `${entry.nameEs} ${entry.abbr}`;
  }

  const trimmed = teamName.trim();
  if (!trimmed) return " ";

  const abbr = trimmed.slice(0, 3).toUpperCase();
  return `${trimmed} ${abbr}`;
}
