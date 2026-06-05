/** Calendario de fase de grupos: junio 2026. */
export const GROUP_STAGE_CALENDAR_MONTH = {
  year: 2026,
  month: 6,
} as const;

const GROUP_STAGE_MATCHDAY_KEY = /^WC2026:matchday:\d{2}$/;

export function isGroupStageMatchdayKey(externalKey: string | null | undefined): boolean {
  return !!externalKey && GROUP_STAGE_MATCHDAY_KEY.test(externalKey);
}

export function isKnockoutMatchdayKey(externalKey: string | null | undefined): boolean {
  return !!externalKey && externalKey.startsWith("WC2026:") && !isGroupStageMatchdayKey(externalKey);
}

export const KNOCKOUT_ROUND_ORDER = [
  "WC2026:round-of-32",
  "WC2026:round-of-16",
  "WC2026:quarter-final",
  "WC2026:semi-final",
  "WC2026:third-place",
  "WC2026:final",
] as const;

export const KNOCKOUT_ROUND_LABELS: Record<string, string> = {
  "WC2026:round-of-32": "Dieciseisavos de final",
  "WC2026:round-of-16": "Octavos de final",
  "WC2026:quarter-final": "Cuartos de final",
  "WC2026:semi-final": "Semifinales",
  "WC2026:third-place": "Tercer puesto",
  "WC2026:final": "Final",
};
