import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { MatchWithPrediction } from "./queries";
import { resolveCalendarFinishedCard } from "./calendar-finished-card";

function finishedMatch(overrides: Partial<MatchWithPrediction> = {}): MatchWithPrediction {
  return {
    id: "m1",
    home_team: "España",
    away_team: "Brasil",
    kickoff_at: "2026-06-15T18:00:00.000Z",
    status: "finished",
    matchday_name: "J1",
    matchday_external_key: "md-1",
    external_match_id: null,
    match_number: 1,
    group_code: "A",
    officialHome: 2,
    officialAway: 1,
    officialMvpPlayerName: "Lamine Yamal",
    officialMvpTeamName: "España",
    highlightYoutubeId: null,
    highlightPublishedAt: null,
    highlightSource: null,
    prediction: { id: "p1", home_goals: 2, away_goals: 1, points_awarded: 5, updated_at: "" },
    mvpPrediction: null,
    playerIncidents: [],
    serverEditable: false,
    editUntilKickoff: false,
    ...overrides,
  };
}

describe("resolveCalendarFinishedCard", () => {
  it("marcador exacto", () => {
    const state = resolveCalendarFinishedCard(finishedMatch());
    assert.equal(state?.variant, "exact");
    assert.equal(state?.scoreOutcome, "exact");
    assert.equal(state?.mvpCorrect, false);
    assert.equal(state?.showPredictedInKickoffSlot, true);
  });

  it("marcador exacto y mvp", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        mvpPrediction: {
          id: "mvp1",
          player_name: "Lamine Yamal",
          team_name: "España",
          shirt_number: 19,
          points_awarded: 5,
          updated_at: "",
        },
      }),
    );
    assert.equal(state?.variant, "exact-mvp");
    assert.equal(state?.scoreOutcome, "exact");
    assert.equal(state?.mvpCorrect, true);
  });

  it("solo signo", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        prediction: { id: "p1", home_goals: 2, away_goals: 0, points_awarded: 2, updated_at: "" },
      }),
    );
    assert.equal(state?.variant, "sign");
    assert.equal(state?.scoreOutcome, "sign");
    assert.equal(state?.mvpCorrect, false);
    assert.equal(state?.showPredictedInKickoffSlot, true);
  });

  it("signo y mvp", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        prediction: { id: "p1", home_goals: 2, away_goals: 0, points_awarded: 2, updated_at: "" },
        mvpPrediction: {
          id: "mvp1",
          player_name: "Lamine Yamal",
          team_name: "España",
          shirt_number: 19,
          points_awarded: 5,
          updated_at: "",
        },
      }),
    );
    assert.equal(state?.variant, "sign-mvp");
    assert.equal(state?.scoreOutcome, "sign");
    assert.equal(state?.mvpCorrect, true);
  });

  it("solo mvp", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        prediction: { id: "p1", home_goals: 0, away_goals: 2, points_awarded: 0, updated_at: "" },
        mvpPrediction: {
          id: "mvp1",
          player_name: "Lamine Yamal",
          team_name: "España",
          shirt_number: 19,
          points_awarded: 5,
          updated_at: "",
        },
      }),
    );
    assert.equal(state?.variant, "mvp-only");
    assert.equal(state?.scoreOutcome, "miss");
    assert.equal(state?.mvpCorrect, true);
    assert.equal(state?.showPredictedInKickoffSlot, true);
  });

  it("fallo total", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        prediction: { id: "p1", home_goals: 0, away_goals: 0, points_awarded: 0, updated_at: "" },
      }),
    );
    assert.equal(state?.variant, "miss");
    assert.equal(state?.scoreOutcome, "miss");
    assert.equal(state?.mvpCorrect, false);
  });

  it("sin predicción guardada", () => {
    const state = resolveCalendarFinishedCard(
      finishedMatch({
        prediction: null,
      }),
    );
    assert.equal(state?.scoreOutcome, null);
    assert.equal(state?.hasPrediction, false);
  });
});
