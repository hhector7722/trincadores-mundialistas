import assert from "node:assert/strict";
import test from "node:test";
import {
  getDefaultUsageSelectedProfileIds,
  isUsageDefaultExcludedUser,
  usageProfileIdSetsMatch,
} from "./default-filters";
import type { UsageFilterUser } from "./queries";

const users: UsageFilterUser[] = [
  { profileId: "a", username: "hector", displayName: "Hector" },
  { profileId: "b", username: "maria", displayName: "Maria" },
  { profileId: "c", username: "pepe", displayName: "Pepe" },
];

test("default selection excludes hector", () => {
  assert.equal(isUsageDefaultExcludedUser({ username: "Hector" }), true);
  assert.deepEqual(getDefaultUsageSelectedProfileIds(users), ["b", "c"]);
});

test("usageProfileIdSetsMatch compares sets", () => {
  assert.equal(usageProfileIdSetsMatch(["a", "b"], ["b", "a"]), true);
  assert.equal(usageProfileIdSetsMatch(["a"], ["a", "b"]), false);
});
