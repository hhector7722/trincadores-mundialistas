import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeTournamentChampionPoints,
  computeTournamentFinalistsPoints,
  computeTournamentGeneralScoreBreakdown,
  computeTournamentPlayerAwardPoints,
  TOURNAMENT_GENERAL_SCORE_POINTS,
} from "./scoring";

describe("computeTournamentChampionPoints", () => {
  it("10 pts por campeón acertado", () => {
    assert.equal(computeTournamentChampionPoints("Brasil", "Brasil"), 10);
    assert.equal(computeTournamentChampionPoints("brasil", "Brasil"), 10);
  });

  it("0 pts si falla", () => {
    assert.equal(computeTournamentChampionPoints("Argentina", "Brasil"), 0);
    assert.equal(computeTournamentChampionPoints(null, "Brasil"), 0);
  });
});

describe("computeTournamentFinalistsPoints", () => {
  it("5 pts si aciertas ambos finalistas en cualquier orden", () => {
    assert.equal(
      computeTournamentFinalistsPoints("Argentina", "Francia", "Argentina", "Francia"),
      5
    );
    assert.equal(
      computeTournamentFinalistsPoints("Francia", "Argentina", "Argentina", "Francia"),
      5
    );
  });

  it("0 pts si solo aciertas uno", () => {
    assert.equal(
      computeTournamentFinalistsPoints("Argentina", "España", "Argentina", "Francia"),
      0
    );
  });
});

describe("computeTournamentPlayerAwardPoints", () => {
  it("requiere jugador y equipo", () => {
    assert.equal(
      computeTournamentPlayerAwardPoints(
        "Mbappé",
        "Francia",
        "Mbappé",
        "Francia",
        TOURNAMENT_GENERAL_SCORE_POINTS.topScorer
      ),
      7
    );
    assert.equal(
      computeTournamentPlayerAwardPoints(
        "Mbappé",
        "Francia",
        "Mbappé",
        "Argentina",
        TOURNAMENT_GENERAL_SCORE_POINTS.topScorer
      ),
      0
    );
  });
});

describe("computeTournamentGeneralScoreBreakdown", () => {
  it("suma categorías de forma independiente", () => {
    const breakdown = computeTournamentGeneralScoreBreakdown(
      {
        championTeam: "Argentina",
        finalistTeamA: "Argentina",
        finalistTeamB: "Francia",
        topScorerPlayerName: "Messi",
        topScorerTeamName: "Argentina",
        tournamentMvpPlayerName: "Messi",
        tournamentMvpTeamName: "Argentina",
        goldenGlovePlayerName: "Martínez",
        goldenGloveTeamName: "Argentina",
      },
      {
        championTeam: "Argentina",
        finalistTeamA: "Francia",
        finalistTeamB: "Argentina",
        topScorerPlayerName: "Messi",
        topScorerTeamName: "Argentina",
        tournamentMvpPlayerName: "Messi",
        tournamentMvpTeamName: "Argentina",
        goldenGlovePlayerName: "Martínez",
        goldenGloveTeamName: "Argentina",
      }
    );

    assert.equal(breakdown.championPoints, 10);
    assert.equal(breakdown.finalistsPoints, 5);
    assert.equal(breakdown.topScorerPoints, 7);
    assert.equal(breakdown.tournamentMvpPoints, 10);
    assert.equal(breakdown.goldenGlovePoints, 7);
    assert.equal(breakdown.totalPoints, 39);
  });
});
