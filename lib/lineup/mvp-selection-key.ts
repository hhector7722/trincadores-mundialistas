import { normalizePlayerName } from "@/lib/lineup/player-dedupe";

export type MvpSelectablePlayer = {
  name: string;
  shirtNumber: number | null;
};

/** Clave estable para selección MVP (campo + banquillo + guardado). Prioriza dorsal. */
export function mvpSelectionKey(teamName: string, player: MvpSelectablePlayer): string {
  const shirt = player.shirtNumber;
  if (shirt != null && shirt > 0) return `${teamName}::${shirt}`;
  const normalized = normalizePlayerName(player.name);
  return normalized ? `${teamName}::n::${normalized}` : `${teamName}::unknown`;
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
