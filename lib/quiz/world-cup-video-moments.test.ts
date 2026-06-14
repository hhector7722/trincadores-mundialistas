import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { test } from "node:test";
import { momentToVideoPlayEndQuestion } from "@/lib/quiz/lab/from-video-moment";
import {
  parseWorldCupVideoMomentsCatalog,
  pickVideoPlayEndMoment,
  WORLD_CUP_VIDEO_MOMENTS_PUBLIC_PREFIX,
} from "@/lib/quiz/world-cup-video-moments";

test("parseWorldCupVideoMomentsCatalog valida rutas bajo /videos/quiz/historic/", () => {
  const path = resolve(process.cwd(), "data/quiz/videos/world-cup-video-moments.json");
  const catalog = parseWorldCupVideoMomentsCatalog(JSON.parse(readFileSync(path, "utf8")));
  assert.ok(catalog.moments.length >= 1);
  for (const moment of catalog.moments) {
    assert.ok(moment.local_path.startsWith(WORLD_CUP_VIDEO_MOMENTS_PUBLIC_PREFIX));
    assert.equal(moment.quiz.options.length, 4);
  }
});

test("momentToVideoPlayEndQuestion devuelve null si el clip no está ready", () => {
  const question = momentToVideoPlayEndQuestion({
    id: "test",
    year: 2010,
    label: "Test",
    moment_type: "goal",
    teams: ["A", "B"],
    players: ["X"],
    competition: "Final",
    difficulty: "easy",
    search_hint: null,
    stop_at_seconds: 3,
    clip_start_seconds: null,
    clip_duration_seconds: null,
    local_path: "/videos/quiz/historic/2010/test.mp4",
    source_url: null,
    source_label: "test",
    status: "pending",
    quiz: {
      prompt: "¿Cómo acabó?",
      correct_option: "Gol",
      options: ["Gol", "Palo", "Fuera de juego", "Parada del portero"],
    },
  });
  assert.equal(question, null);
});

test("pickVideoPlayEndMoment elige solo momentos ready", () => {
  const catalog = parseWorldCupVideoMomentsCatalog({
    version: 1,
    moments: [
      {
        id: "a",
        year: 2010,
        label: "A",
        moment_type: "goal",
        teams: ["A", "B"],
        players: ["X"],
        competition: "Final",
        difficulty: "easy",
        search_hint: null,
        stop_at_seconds: 3,
        clip_start_seconds: null,
        clip_duration_seconds: null,
        local_path: "/videos/quiz/historic/2010/a.mp4",
        source_url: null,
        source_label: "test",
        status: "ready",
        quiz: {
          prompt: "¿Cómo acabó?",
          correct_option: "Gol",
          options: ["Gol", "Palo", "Fuera de juego", "Parada del portero"],
        },
      },
    ],
  });
  const picked = pickVideoPlayEndMoment(catalog, { seed: 1 });
  assert.equal(picked?.id, "a");
});
