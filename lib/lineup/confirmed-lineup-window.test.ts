import assert from "node:assert/strict";
import test from "node:test";
import {
  CONFIRMED_LINEUP_WINDOW_MS,
  shouldFetchConfirmedLineup,
} from "./confirmed-lineup-window";

test("shouldFetchConfirmedLineup es false lejos del pitido", () => {
  const kickoff = new Date(Date.now() + CONFIRMED_LINEUP_WINDOW_MS + 60_000).toISOString();
  assert.equal(shouldFetchConfirmedLineup(kickoff, "scheduled"), false);
});

test("shouldFetchConfirmedLineup es true dentro de la ventana", () => {
  const kickoff = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  assert.equal(shouldFetchConfirmedLineup(kickoff, "scheduled"), true);
});

test("shouldFetchConfirmedLineup es true en partido en vivo o finalizado", () => {
  assert.equal(shouldFetchConfirmedLineup(null, "live"), true);
  assert.equal(shouldFetchConfirmedLineup(null, "finished"), true);
});
