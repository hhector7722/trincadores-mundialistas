import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOnboardingEligibleUsername,
  normalizePhone,
  resolveParticipantByPhone,
} from "./onboarding-phones";

describe("onboarding-phones", () => {
  it("normaliza espacios y prefijo +34", () => {
    assert.equal(normalizePhone("+34 647 229 309"), "647229309");
    assert.equal(normalizePhone("647229309"), "647229309");
  });

  it("resuelve participante por coincidencia exacta", () => {
    const match = resolveParticipantByPhone("647229309");
    assert.ok(match);
    assert.equal(match?.username, "hector");
    assert.equal(match?.displayName, "Hector");
  });

  it("rechaza numeros no registrados", () => {
    assert.equal(resolveParticipantByPhone("600000000"), null);
  });

  it("incluye a Paco con su movil registrado", () => {
    assert.equal(isOnboardingEligibleUsername("paco"), true);
    const match = resolveParticipantByPhone("663135650");
    assert.ok(match);
    assert.equal(match?.username, "paco");
    assert.equal(match?.displayName, "Paco");
  });

});
