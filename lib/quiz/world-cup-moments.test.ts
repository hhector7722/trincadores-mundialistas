import assert from "node:assert/strict";
import test from "node:test";
import { momentToGuessImageQuestion } from "@/lib/quiz/lab/from-moment";
import {
  parseWorldCupMomentsCatalog,
  syncMomentStatuses,
  validateWorldCupMoment,
  type WorldCupMoment,
} from "@/lib/quiz/world-cup-moments";

const FIXTURE_MOMENT: WorldCupMoment = {
  id: "wc1986-maradona-cup",
  year: 1986,
  label: "Maradona levanta la Copa",
  moment_type: "celebration",
  teams: ["Argentina"],
  players: ["Diego Maradona"],
  competition: "Final",
  local_path: "/images/quiz/historic/1986/wc1986-maradona-cup.jpg",
  source_url: "https://example.com/photo.jpg",
  source_label: "Marca",
  status: "pending",
  image_alt: "Maradona con la copa del mundo en Mexico 86",
  quiz: {
    prompt: "¿En qué Mundial fue?",
    answer_type: "year",
    correct_option: "1986",
    options: ["1982", "1986", "1990", "1994"],
    blur_start_px: 24,
    reveal_seconds: 8,
  },
};

test("validateWorldCupMoment rechaza año anterior a 1970", () => {
  assert.throws(() => {
    validateWorldCupMoment({ ...FIXTURE_MOMENT, year: 1966 }, 0);
  }, /1970/);
});

test("validateWorldCupMoment exige jugadores y ruta local historic", () => {
  const moment = validateWorldCupMoment(FIXTURE_MOMENT, 0);
  assert.equal(moment.players[0], "Diego Maradona");
  assert.match(moment.local_path, /^\/images\/quiz\/historic\//);
});

test("parseWorldCupMomentsCatalog detecta ids duplicados", () => {
  assert.throws(() => {
    parseWorldCupMomentsCatalog({
      version: 1,
      moments: [FIXTURE_MOMENT, FIXTURE_MOMENT],
    });
  }, /duplicado/);
});

test("syncMomentStatuses marca pending sin archivo en disco", () => {
  const synced = syncMomentStatuses(
    { version: 1, moments: [FIXTURE_MOMENT] },
    "/ruta/inexistente/public"
  );
  assert.equal(synced.moments[0]?.status, "pending");
});

test("momentToGuessImageQuestion devuelve null si falta archivo", () => {
  const question = momentToGuessImageQuestion(FIXTURE_MOMENT);
  assert.equal(question, null);
});
