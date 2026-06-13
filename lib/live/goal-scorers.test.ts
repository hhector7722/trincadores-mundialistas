import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractGoalScorersByTeam,
  formatGoalScorerLabel,
  goalScorerDisplayName,
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
