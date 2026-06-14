import assert from "node:assert/strict";
import test from "node:test";
import {
  buildMomentSearchQueries,
  scoreImageCandidate,
  type ImageSearchCandidate,
} from "@/lib/quiz/moment-image-search";
import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";

const MOMENT: WorldCupMoment = {
  id: "wc2022-messi-cup",
  year: 2022,
  label: "Messi con la copa — Qatar 2022",
  moment_type: "celebration",
  teams: ["Argentina"],
  players: ["Lionel Messi"],
  competition: "Final",
  local_path: "/images/quiz/historic/2022/wc2022-messi-cup.jpg",
  source_url: null,
  source_label: "Pendiente",
  status: "pending",
  image_alt: "Messi con la copa",
  quiz: {
    prompt: "¿Qué selección ganó este Mundial?",
    answer_type: "team",
    correct_option: "Argentina",
    options: ["Argentina", "Francia", "Brasil", "Alemania"],
    blur_start_px: 24,
    reveal_seconds: 8,
  },
};

test("buildMomentSearchQueries incluye jugador y año", () => {
  const queries = buildMomentSearchQueries(MOMENT);
  assert.ok(queries.length >= 3);
  assert.ok(queries.some((query) => query.includes("2022")));
  assert.ok(queries.some((query) => query.toLowerCase().includes("messi")));
});

test("scoreImageCandidate penaliza estadio/afición y premia jugador", () => {
  const playerCandidate: Omit<ImageSearchCandidate, "score"> = {
    imageUrl: "https://cdn.marca.com/images/messi-world-cup-2022-final.jpg",
    pageUrl: "https://www.marca.com/futbol/mundial/2022/messi.html",
    title: "Lionel Messi celebrates World Cup 2022 final",
    width: 1200,
    height: 800,
    source: "duckduckgo",
    query: "Messi World Cup 2022",
  };
  const stadiumCandidate: Omit<ImageSearchCandidate, "score"> = {
    ...playerCandidate,
    imageUrl: "https://cdn.example.com/lusail-stadium-fans.jpg",
    pageUrl: "https://example.com/stadium-fans",
    title: "Fans in stadium during World Cup 2022",
  };

  const playerScore = scoreImageCandidate(playerCandidate, MOMENT);
  const stadiumScore = scoreImageCandidate(stadiumCandidate, MOMENT);
  assert.ok(playerScore > stadiumScore);
  assert.ok(playerScore >= 8);
});
