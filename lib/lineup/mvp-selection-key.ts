import { normalizePlayerName } from "@/lib/lineup/player-dedupe";

export type MvpSelectablePlayer = {
  name: string;
  shirtNumber: number | null;
};

/** Clave estable y única por jugador (campo + banquillo). Incluye dorsal y nombre normalizado. */
export function mvpSelectionKey(teamName: string, player: MvpSelectablePlayer): string {
  const normalized = normalizePlayerName(player.name) || "unknown";
  const shirt = player.shirtNumber;
  if (shirt != null && shirt > 0) return `${teamName}::${shirt}::${normalized}`;
  return `${teamName}::n::${normalized}`;
}

export function mvpPlayersMatch(
  teamName: string,
  candidate: MvpSelectablePlayer,
  selected: MvpSelectablePlayer & { teamName: string }
): boolean {
  if (selected.teamName !== teamName) return false;
  if (mvpSelectionKey(teamName, candidate) === mvpSelectionKey(teamName, selected)) return true;

  const candidateNorm = normalizePlayerName(candidate.name);
  const selectedNorm = normalizePlayerName(selected.name);
  if (!candidateNorm || !selectedNorm) return false;
  if (candidateNorm === selectedNorm) return true;

  return (
    nameHintMatchesOption(candidateNorm, selected.name) ||
    nameHintMatchesOption(selectedNorm, candidate.name)
  );
}

function nameHintMatchesOption(nameHint: string, optionName: string): boolean {
  const normalized = normalizePlayerName(optionName);
  if (!normalized || !nameHint) return false;
  if (normalized === nameHint) return true;
  if (normalized.endsWith(` ${nameHint}`)) return true;
  if (normalized.split(" ").pop() === nameHint) return true;
  return normalized.includes(nameHint) || nameHint.includes(normalized);
}

function parseMvpSelectionKey(selectedKey: string): {
  teamName: string;
  shirtNumber: number | null;
  nameHint: string;
} | null {
  const segments = selectedKey.split("::");
  if (segments.length < 3) return null;

  const teamName = segments[0]!;
  const shirtRaw = segments[1]!;
  const shirtNumber = shirtRaw !== "n" ? Number(shirtRaw) : null;

  return {
    teamName,
    shirtNumber: shirtNumber != null && !Number.isNaN(shirtNumber) ? shirtNumber : null,
    nameHint: segments.slice(2).join("::"),
  };
}

function filterMvpOptionsByTeamShirt<T extends MvpSelectablePlayer & { teamName: string }>(
  options: T[],
  teamName: string,
  shirtNumber: number | null
): T[] {
  return options.filter((option) => {
    if (option.teamName !== teamName) return false;
    if (shirtNumber != null && option.shirtNumber !== shirtNumber) return false;
    return true;
  });
}

/** Resuelve la opción canónica de plantilla a partir de la clave activa (campo o banquillo). */
export function findMvpOptionByKey<T extends MvpSelectablePlayer & { key: string; teamName: string }>(
  options: T[],
  selectedKey: string | null | undefined
): T | undefined {
  if (!selectedKey) return undefined;

  const direct = options.find((option) => option.key === selectedKey);
  if (direct) return direct;

  const parsed = parseMvpSelectionKey(selectedKey);
  if (!parsed) return undefined;

  const pool = filterMvpOptionsByTeamShirt(options, parsed.teamName, parsed.shirtNumber);
  const matched = pool.filter((option) =>
    nameHintMatchesOption(parsed.nameHint, option.name)
  );

  if (matched.length === 1) return matched[0];
  if (matched.length > 1) {
    return (
      matched.find((option) => mvpSelectionKey(parsed.teamName, option) === selectedKey) ??
      matched.find((option) =>
        mvpPlayersMatch(parsed.teamName, { name: parsed.nameHint, shirtNumber: parsed.shirtNumber }, option)
      ) ??
      matched[0]
    );
  }

  return undefined;
}

export type MvpResolvedSelection = MvpSelectablePlayer & {
  key: string;
  teamName: string;
};

/**
 * Resuelve la selección MVP activa para guardar o resaltar.
 * Prioriza plantilla; si no hay match, usa el jugador táctico (campo/banquillo) de la clave.
 */
export function resolveMvpSelection<T extends MvpResolvedSelection>(
  squadOptions: T[],
  selectedKey: string | null | undefined,
  lineupPlayers: Array<MvpSelectablePlayer & { teamName: string }> = []
): T | MvpResolvedSelection | undefined {
  if (!selectedKey) return undefined;

  const fromSquad = findMvpOptionByKey(squadOptions, selectedKey);
  if (fromSquad) return fromSquad;

  const lineupMatch = lineupPlayers.find(
    (player) => mvpSelectionKey(player.teamName, player) === selectedKey
  );
  if (!lineupMatch) return undefined;

  const parsed = parseMvpSelectionKey(selectedKey);
  if (!parsed) return undefined;

  const pool = filterMvpOptionsByTeamShirt(squadOptions, parsed.teamName, parsed.shirtNumber);
  const fuzzy = pool.filter((option) =>
    nameHintMatchesOption(parsed.nameHint, option.name)
  );

  if (fuzzy.length === 1) return fuzzy[0]!;
  if (fuzzy.length > 1) {
    const best = fuzzy.find((option) => mvpPlayersMatch(parsed.teamName, lineupMatch, option));
    if (best) return best;
  }

  return {
    key: selectedKey,
    name: lineupMatch.name,
    teamName: lineupMatch.teamName,
    shirtNumber: lineupMatch.shirtNumber,
  };
}

export function findMvpOptionBySaved<T extends MvpSelectablePlayer & { teamName: string }>(
  options: T[],
  savedPlayerName: string,
  savedTeamName: string
): T | undefined {
  const normalizedSaved = normalizePlayerName(savedPlayerName);
  const savedToken = normalizedSaved.split(" ")[0] ?? "";

  return options.find((option) => {
    if (option.teamName !== savedTeamName) return false;
    const normalizedOption = normalizePlayerName(option.name);
    if (normalizedOption === normalizedSaved) return true;
    if (option.name.trim() === savedPlayerName.trim()) return true;

    const optionToken = normalizedOption.split(" ")[0] ?? "";
    if (savedToken && savedToken === optionToken) return true;

    return (
      normalizedSaved.includes(normalizedOption) || normalizedOption.includes(normalizedSaved)
    );
  });
}
