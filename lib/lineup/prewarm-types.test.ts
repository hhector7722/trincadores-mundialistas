import assert from "node:assert/strict";
import test from "node:test";
import { isPrewarmCacheFresh, PREWARM_PREDICTED_TTL_MS } from "./prewarm-types";

test("isPrewarmCacheFresh respeta TTL de predicted", () => {
  const now = Date.now();
  const fresh = new Date(now - PREWARM_PREDICTED_TTL_MS + 60_000).toISOString();
  const stale = new Date(now - PREWARM_PREDICTED_TTL_MS - 60_000).toISOString();

  assert.equal(isPrewarmCacheFresh(fresh, now), true);
  assert.equal(isPrewarmCacheFresh(stale, now), false);
  assert.equal(isPrewarmCacheFresh(null, now), false);
});
