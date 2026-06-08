import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isOnboardingEligibleUsername,
  normalizePhone,
  resolveParticipantByAlias,
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

  it("excluye a Paco del onboarding", () => {
    assert.equal(isOnboardingEligibleUsername("paco"), false);
    assert.equal(resolveParticipantByPhone(""), null);
  });

  it("resuelve alias con acentos y variantes de Solskjær", () => {
    assert.equal(isOnboardingEligibleUsername("Solskjær"), true);
    assert.equal(isOnboardingEligibleUsername("SOLSKJAER"), true);

    const fromAccent = resolveParticipantByAlias("Solskjær");
    const fromAscii = resolveParticipantByAlias("Solskjaer");
    assert.ok(fromAccent);
    assert.ok(fromAscii);
    assert.equal(fromAccent?.username, "solskjaer");
    assert.equal(fromAscii?.username, "solskjaer");
  });
});
