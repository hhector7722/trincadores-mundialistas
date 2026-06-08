import assert from "node:assert/strict";
import { beforeEach, describe, it } from "node:test";
import { getOnboardingAccessCode, getOnboardingAccessCodeMap } from "./onboarding-access-codes";

describe("onboarding-access-codes", () => {
  beforeEach(() => {
    process.env.ONBOARDING_ACCESS_CODES_JSON = JSON.stringify({
      hector: "ABCD1234EFGH",
      damo: "WXYZ5678JKLM",
    });
  });

  it("normaliza alias al leer codigos", () => {
    assert.equal(getOnboardingAccessCode("Hector"), "ABCD1234EFGH");
    assert.equal(getOnboardingAccessCode("damo"), "WXYZ5678JKLM");
  });

  it("devuelve mapa vacio sin variable de entorno", () => {
    delete process.env.ONBOARDING_ACCESS_CODES_JSON;
    assert.deepEqual(getOnboardingAccessCodeMap(), {});
  });
});
