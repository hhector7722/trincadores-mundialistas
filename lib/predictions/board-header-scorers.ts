import { normalizePlayerName } from "@/lib/lineup/player-dedupe";
import {
  goalScorerDisplayName,
  type GroupedGoalScorer,
  type MatchGoalScorer,
} from "@/lib/live/goal-scorers";
import { mvpPlayerNamesMatch } from "@/lib/predictions/mvp-name-match";

export type BoardHeaderScorerRow = {
  group: GroupedGoalScorer;
  /** Opción 1: nombre del goleador MVP en amarillo dentro de su fila existente. */
  highlightMvpName: boolean;
};

export type BoardHeaderTeamScorerBlock = {
  scorerRows: BoardHeaderScorerRow[];
  /** Opción 2: fila extra solo con nombre MVP (sin minuto). Mutuamente excluyente con highlight. */
  mvpOnlyName: string | null;
};

/** Clave estable para agrupar goles y cruzar con MVP (nombre camiseta / apellido). */
export function boardScorerIdentityKey(playerName: string): string {
  const shirt = normalizePlayerName(goalScorerDisplayName(playerName));
  if (shirt) return shirt;
  return normalizePlayerName(playerName);
}

/** Cruce MVP ↔ goleador: nombre completo o etiqueta camiseta (p. ej. Nestory Irankunda ↔ Irankunda). */
export function boardMvpPlayerNamesMatch(scorerName: string, mvpName: string): boolean {
  if (mvpPlayerNamesMatch(scorerName, mvpName)) return true;

  const scorerKey = boardScorerIdentityKey(scorerName);
  const mvpKey = boardScorerIdentityKey(mvpName);
  return scorerKey.length > 0 && scorerKey === mvpKey;
}

/** Agrupa goles por identidad de camiseta para evitar filas duplicadas del mismo jugador. */
export function groupBoardGoalScorersByPlayer(goals: MatchGoalScorer[]): GroupedGoalScorer[] {
  const order: string[] = [];
  const groups = new Map<string, GroupedGoalScorer>();

  for (const goal of goals) {
    const key = boardScorerIdentityKey(goal.playerName);
    if (!key) continue;

    let group = groups.get(key);
    if (!group) {
      group = { playerName: goal.playerName, minutes: [] };
      groups.set(key, group);
      order.push(key);
    }
    if (goal.minute != null) group.minutes.push(goal.minute);
  }

  return order.map((key) => groups.get(key)!);
}

function findMvpScorerGroup(
  groups: GroupedGoalScorer[],
  officialMvpPlayerName: string,
): GroupedGoalScorer | null {
  const trimmed = officialMvpPlayerName.trim();
  if (!trimmed) return null;
  return groups.find((group) => boardMvpPlayerNamesMatch(group.playerName, trimmed)) ?? null;
}

/**
 * Filas bajo el marcador en cabecera del modal de pronósticos.
 * Opción 1: MVP goleador → resaltar nombre en su fila (sin duplicar).
 * Opción 2: MVP sin gol → una fila nueva solo con su nombre en amarillo.
 */
export function buildBoardHeaderTeamScorerBlock(
  goals: MatchGoalScorer[],
  officialMvpPlayerName: string | null | undefined,
  isOfficialMvpTeamSide: boolean,
): BoardHeaderTeamScorerBlock {
  const groups = groupBoardGoalScorersByPlayer(goals);
  const mvpName = officialMvpPlayerName?.trim() ?? "";

  if (!isOfficialMvpTeamSide || !mvpName) {
    return {
      scorerRows: groups.map((group) => ({ group, highlightMvpName: false })),
      mvpOnlyName: null,
    };
  }

  const mvpScorerGroup = findMvpScorerGroup(groups, mvpName);

  if (mvpScorerGroup) {
    return {
      scorerRows: groups.map((group) => ({
        group,
        highlightMvpName: boardMvpPlayerNamesMatch(group.playerName, mvpName),
      })),
      mvpOnlyName: null,
    };
  }

  return {
    scorerRows: groups.map((group) => ({ group, highlightMvpName: false })),
    mvpOnlyName: mvpName,
  };
}
