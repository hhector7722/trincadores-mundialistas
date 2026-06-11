import assert from "node:assert/strict";
import { test } from "node:test";
import { parseOfficialMvpFromBsdIncidents } from "@/lib/live/sources/bsd-official-mvp";

test("parseOfficialMvpFromBsdIncidents acepta incidente man_of_the_match", () => {
  const parsed = parseOfficialMvpFromBsdIncidents(
    {
      incidents: [
        {
          type: "man_of_the_match",
          player_name: "Julian Quinones",
          is_home: true,
        },
      ],
    },
    "Mexico",
    "South Africa",
  );

  assert.equal(parsed?.playerName, "Julian Quinones");
  assert.equal(parsed?.teamName, "Mexico");
});

test("parseOfficialMvpFromBsdIncidents ignora incidentes sin tipo explícito", () => {
  const parsed = parseOfficialMvpFromBsdIncidents(
    {
      incidents: [{ type: "goal", player_name: "Julian Quinones", is_home: true }],
    },
    "Mexico",
    "South Africa",
  );

  assert.equal(parsed, null);
});
