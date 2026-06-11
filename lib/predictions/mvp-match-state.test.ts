import assert from "node:assert/strict";
import test from "node:test";
import type { MatchWithPrediction } from "./queries";
import {
  mvpOverridesFromMatchListAndActive,
  preferMatchMvpData,
} from "./mvp-match-state";

function baseMatch(overrides: Partial<MatchWithPrediction> = {}): MatchWithPrediction {
  return {
    id: "match-1",
    home_team: "España",
    away_team: "Brasil",
    kickoff_at: "2026-06-15T18:00:00.000Z",
    status: "scheduled",
    matchday_name: "Jornada 1",
    matchday_external_key: "md-1",
    external_match_id: null,
    match_number: 1,
    group_code: "A",
    officialHome: null,
    officialAway: null,
    officialMvpPlayerName: null,
    officialMvpTeamName: null,
    highlightYoutubeId: null,
    highlightPublishedAt: null,
    prediction: null,
    mvpPrediction: null,
    serverEditable: true,
    ...overrides,
  };
}

test("preferMatchMvpData usa el MVP del partido activo cuando la lista está desactualizada", () => {
  const listed = baseMatch();
  const preferred = baseMatch({
    mvpPrediction: {
      id: "mvp-1",
      player_name: "Lamine Yamal",
      team_name: "España",
      shirt_number: 19,
      points_awarded: null,
      updated_at: "2026-06-10T10:00:00.000Z",
    },
  });

  const merged = preferMatchMvpData(listed, preferred);
  assert.equal(merged.mvpPrediction?.player_name, "Lamine Yamal");
});

test("mvpOverridesFromMatchListAndActive incluye el MVP del partido activo", () => {
  const active = baseMatch({
    id: "match-2",
    mvpPrediction: {
      id: "mvp-2",
      player_name: "Vinícius Júnior",
      team_name: "Brasil",
      shirt_number: 7,
      points_awarded: null,
      updated_at: "2026-06-10T10:00:00.000Z",
    },
  });

  const overrides = mvpOverridesFromMatchListAndActive([baseMatch()], active);

  assert.deepEqual(overrides["match-2"], {
    player_name: "Vinícius Júnior",
    team_name: "Brasil",
    shirt_number: 7,
  });
});
