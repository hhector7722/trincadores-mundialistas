import {
  groupGoalScorersByPlayer,
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

function findMvpScorerGroup(
  groups: GroupedGoalScorer[],
  officialMvpPlayerName: string,
): GroupedGoalScorer | null {
  const trimmed = officialMvpPlayerName.trim();
  if (!trimmed) return null;
  return groups.find((group) => mvpPlayerNamesMatch(group.playerName, trimmed)) ?? null;
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
  const groups = groupGoalScorersByPlayer(goals);
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
        highlightMvpName: mvpPlayerNamesMatch(group.playerName, mvpName),
      })),
      mvpOnlyName: null,
    };
  }

  return {
    scorerRows: groups.map((group) => ({ group, highlightMvpName: false })),
    mvpOnlyName: mvpName,
  };
}
