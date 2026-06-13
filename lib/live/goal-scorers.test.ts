import assert from "node:assert/strict";
import { test } from "node:test";
import {
  buildBoardGoalScorerLines,
  buildCardGoalScorerLines,
  extractGoalScorersByTeam,
  formatGoalScorerLabel,
  formatGroupedGoalScorerLabel,
  goalScorerDisplayName,
  groupGoalScorersByPlayer,
  resolveMatchGoalScorers,
} from "@/lib/live/goal-scorers";

test("goalScorerDisplayName usa apellido conocido", () => {
  assert.equal(goalScorerDisplayName("Julian Quinones"), "Quinones");
  assert.equal(goalScorerDisplayName("L. Sone"), "Sone");
});

test("formatGoalScorerLabel incluye minuto cuando existe", () => {
  assert.equal(
    formatGoalScorerLabel({ playerName: "Julian Quinones", minute: 73 }),
    "Quinones 73'",
  );
  assert.equal(formatGoalScorerLabel({ playerName: "L. Sone", minute: null }), "Sone");
});

test("formatGroupedGoalScorerLabel agrupa varios minutos del mismo jugador", () => {
  assert.equal(
    formatGroupedGoalScorerLabel({
      playerName: "Breel Embolo",
      minutes: [28, 34],
    }),
    "Embolo 28' 34'",
  );
});

test("groupGoalScorersByPlayer mantiene orden cronológico", () => {
  const groups = groupGoalScorersByPlayer([
    { playerName: "L. Sone", minute: 12 },
    { playerName: "J. Quinones", minute: 73 },
    { playerName: "L. Sone", minute: 55 },
  ]);

  assert.equal(groups.length, 2);
  assert.deepEqual(groups[0]?.minutes, [12, 55]);
  assert.deepEqual(groups[1]?.minutes, [73]);
});

test("buildCardGoalScorerLines compacta cuando hay demasiados goleadores", () => {
  const lines = buildCardGoalScorerLines([
    { playerName: "Breel Embolo", minute: 17 },
    { playerName: "Breel Embolo", minute: 23 },
    { playerName: "Kara Mbodji", minute: 45 },
    { playerName: "Granit Xhaka", minute: 51 },
    { playerName: "Remo Freuler", minute: 88 },
  ]);

  assert.equal(lines.length, 2);
  assert.equal(lines[0], "Embolo 17' 23', Mbodji 45', Xhaka 51'");
  assert.equal(lines[1], "Freuler 88'");
});

test("buildBoardGoalScorerLines deja un goleador por fila", () => {
  const lines = buildBoardGoalScorerLines([
    { playerName: "Breel Embolo", minute: 17 },
    { playerName: "Breel Embolo", minute: 23 },
    { playerName: "Kara Mbodji", minute: 45 },
  ]);

  assert.deepEqual(lines, ["Embolo 17' 23'", "Mbodji 45'"]);
});

test("extractGoalScorersByTeam separa goles por bando", () => {
  const grouped = extractGoalScorersByTeam([
    { kind: "goal", playerName: "L. Sone", teamSide: "home", minute: 12 },
    { kind: "assist", playerName: "J. Quinones", teamSide: "home" },
    { kind: "goal", playerName: "J. Quinones", teamSide: "home", minute: 73 },
    { kind: "goal", playerName: "D. Sugioka", teamSide: "away", minute: 44 },
  ]);

  assert.equal(grouped.home.length, 2);
  assert.equal(grouped.away.length, 1);
  assert.equal(grouped.home[0]?.minute, 12);
});

test("resolveMatchGoalScorers prioriza incidentes del snapshot en vivo", () => {
  const fallback = [{ kind: "goal" as const, playerName: "Viejo", teamSide: "home" as const }];
  const live = [{ kind: "goal" as const, playerName: "Nuevo", teamSide: "away" as const, minute: 55 }];

  const grouped = resolveMatchGoalScorers(fallback, live);

  assert.equal(grouped.home.length, 0);
  assert.equal(grouped.away[0]?.playerName, "Nuevo");
});
