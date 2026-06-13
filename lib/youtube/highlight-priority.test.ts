import assert from "node:assert/strict";
import { test } from "node:test";
import {
  highlightSourceLabel,
  shouldReplaceMatchHighlight,
} from "@/lib/youtube/highlight-priority";

test("shouldReplaceMatchHighlight prioriza DAZN sobre FIFA y Teledeporte", () => {
  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_fifa",
      "2026-06-12T02:00:00.000Z",
      "youtube_dazn_es",
      "2026-06-12T03:00:00.000Z",
    ),
    true,
  );

  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_dazn_es",
      "2026-06-12T03:00:00.000Z",
      "youtube_fifa",
      "2026-06-12T04:00:00.000Z",
    ),
    false,
  );
});

test("shouldReplaceMatchHighlight prioriza FIFA sobre Teledeporte", () => {
  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_rtve_teledeporte",
      "2026-06-12T01:00:00.000Z",
      "youtube_fifa",
      "2026-06-12T02:00:00.000Z",
    ),
    true,
  );

  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_fifa",
      "2026-06-12T02:00:00.000Z",
      "youtube_rtve_teledeporte",
      "2026-06-12T03:00:00.000Z",
    ),
    false,
  );
});

test("shouldReplaceMatchHighlight prioriza Replay sobre Teledeporte y FIFA sobre Replay", () => {
  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_rtve_teledeporte",
      "2026-06-12T01:00:00.000Z",
      "youtube_replay",
      "2026-06-12T02:00:00.000Z",
    ),
    true,
  );

  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_replay",
      "2026-06-12T02:00:00.000Z",
      "youtube_fifa",
      "2026-06-12T03:00:00.000Z",
    ),
    true,
  );

  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_replay",
      "2026-06-12T03:00:00.000Z",
      "youtube_rtve_teledeporte",
      "2026-06-12T04:00:00.000Z",
    ),
    false,
  );
});

test("shouldReplaceMatchHighlight actualiza misma fuente solo si es mas reciente", () => {
  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_fifa",
      "2026-06-12T01:00:00.000Z",
      "youtube_fifa",
      "2026-06-12T02:00:00.000Z",
    ),
    true,
  );

  assert.equal(
    shouldReplaceMatchHighlight(
      "youtube_fifa",
      "2026-06-12T03:00:00.000Z",
      "youtube_fifa",
      "2026-06-12T02:00:00.000Z",
    ),
    false,
  );
});

test("highlightSourceLabel distingue fuentes", () => {
  assert.equal(highlightSourceLabel("youtube_dazn_es"), "Resumen DAZN");
  assert.equal(highlightSourceLabel("youtube_fifa"), "Resumen FIFA");
  assert.equal(highlightSourceLabel("youtube_replay"), "Resumen Replay");
  assert.equal(highlightSourceLabel("youtube_rtve_teledeporte"), "Resumen Teledeporte");
  assert.equal(highlightSourceLabel(null), "Resumen del partido");
});
