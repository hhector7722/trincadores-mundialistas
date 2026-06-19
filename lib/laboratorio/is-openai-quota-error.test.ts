import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isOpenAiQuotaOrBillingError } from "@/lib/laboratorio/is-openai-quota-error";

describe("isOpenAiQuotaOrBillingError", () => {
  it("detecta 402", () => {
    assert.equal(isOpenAiQuotaOrBillingError(402, ""), true);
  });

  it("detecta insufficient_quota en 429", () => {
    assert.equal(
      isOpenAiQuotaOrBillingError(
        429,
        '{"error":{"type":"insufficient_quota","message":"You exceeded your current quota"}}',
      ),
      true,
    );
  });

  it("detecta credit balance en cuerpo", () => {
    assert.equal(
      isOpenAiQuotaOrBillingError(
        400,
        "Your credit balance is too low to access the API.",
      ),
      true,
    );
  });

  it("no confunde 429 generico sin senales de cuota", () => {
    assert.equal(
      isOpenAiQuotaOrBillingError(429, '{"error":{"message":"Rate limit reached"}}'),
      false,
    );
  });

  it("ignora errores no relacionados con cuota", () => {
    assert.equal(isOpenAiQuotaOrBillingError(500, "Internal server error"), false);
    assert.equal(isOpenAiQuotaOrBillingError(401, "Invalid API key"), false);
  });
});
