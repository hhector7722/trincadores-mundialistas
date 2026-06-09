import assert from "node:assert/strict";
import { afterEach, beforeEach, describe, it } from "node:test";
import { BUILT_IN_ONBOARDING_ACCESS_CODES } from "./onboarding-access-codes-built-in";
import { getOnboardingAccessCode, getOnboardingAccessCodeMap } from "./onboarding-access-codes";

describe("onboarding-access-codes", () => {
  const originalEnv = process.env.ONBOARDING_ACCESS_CODES_JSON;

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.ONBOARDING_ACCESS_CODES_JSON;
    } else {
      process.env.ONBOARDING_ACCESS_CODES_JSON = originalEnv;
    }
  });

  beforeEach(() => {
    process.env.ONBOARDING_ACCESS_CODES_JSON = JSON.stringify({
      hector: "ABCD1234EFGH",
      damo: "WXYZ5678JKLM",
    });
  });

  it("usa codigos integrados y permite override por entorno", () => {
    assert.equal(getOnboardingAccessCode("hector"), "ABCD1234EFGH");
    assert.equal(getOnboardingAccessCode("damo"), "WXYZ5678JKLM");
    assert.equal(getOnboardingAccessCode("nacho"), BUILT_IN_ONBOARDING_ACCESS_CODES.nacho);
  });

  it("ignora JSON de entorno vacio o invalido", () => {
    delete process.env.ONBOARDING_ACCESS_CODES_JSON;
    assert.equal(getOnboardingAccessCode("hector"), BUILT_IN_ONBOARDING_ACCESS_CODES.hector);

    process.env.ONBOARDING_ACCESS_CODES_JSON = '""';
    assert.equal(getOnboardingAccessCode("hector"), BUILT_IN_ONBOARDING_ACCESS_CODES.hector);

    process.env.ONBOARDING_ACCESS_CODES_JSON = "{not-json";
    assert.equal(getOnboardingAccessCode("hector"), BUILT_IN_ONBOARDING_ACCESS_CODES.hector);
  });

  it("mezcla codigos integrados con overrides de entorno", () => {
    delete process.env.ONBOARDING_ACCESS_CODES_JSON;
    const builtInOnly = getOnboardingAccessCodeMap();
    assert.equal(builtInOnly.hector, BUILT_IN_ONBOARDING_ACCESS_CODES.hector);

    process.env.ONBOARDING_ACCESS_CODES_JSON = JSON.stringify({ hector: "OVERRIDE1234" });
    const merged = getOnboardingAccessCodeMap();
    assert.equal(merged.hector, "OVERRIDE1234");
    assert.equal(merged.nacho, BUILT_IN_ONBOARDING_ACCESS_CODES.nacho);
  });
});
