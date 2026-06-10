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

/** Resuelve la opción canónica de plantilla a partir de la clave activa (campo o banquillo). */
export function findMvpOptionByKey<T extends MvpSelectablePlayer & { key: string; teamName: string }>(
  options: T[],
  selectedKey: string | null | undefined
): T | undefined {
  if (!selectedKey) return undefined;

  const direct = options.find((option) => option.key === selectedKey);
  if (direct) return direct;

  const segments = selectedKey.split("::");
  if (segments.length < 3) return undefined;

  const teamName = segments[0]!;
  const nameHint = segments[segments.length - 1]!;

  return options.find(
    (option) => option.teamName === teamName && nameHintMatchesOption(nameHint, option.name)
  );
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
