import assert from "node:assert/strict";
import { test } from "node:test";
import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";

test("titleCasePlayerName respeta acentos y prefijos Mc", () => {
  assert.equal(titleCasePlayerName("VINÍCIUS JR."), "Vinícius Jr.");
  assert.equal(titleCasePlayerName("R. JIMÉNEZ"), "R. Jiménez");
  assert.equal(titleCasePlayerName("J. MCGINN"), "J. McGinn");
  assert.equal(titleCasePlayerName("H. IN-BEOM"), "H. In-Beom");
  assert.equal(titleCasePlayerName("L. KREJČÍ"), "L. Krejčí");
});
