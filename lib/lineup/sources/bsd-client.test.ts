import assert from "node:assert/strict";
import test from "node:test";
import { buildBsdEventsLookupPath } from "./bsd-client";

test("buildBsdEventsLookupPath acota por equipo, temporada y día del partido", () => {
  const path = buildBsdEventsLookupPath({
    teamName: "Spain",
    kickoffAt: "2026-06-15T19:00:00+00:00",
  });

  assert.match(path, /team_name=Spain/);
  assert.match(path, /season_id=188/);
  assert.match(path, /league_id=27/);
  assert.match(path, /date_from=2026-06-15/);
  assert.match(path, /date_to=2026-06-15/);
  assert.match(path, /limit=20/);
});
