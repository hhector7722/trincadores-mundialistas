import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isProfileOnboardingComplete,
  readOnboardedUsernameFromCookieValue,
} from "./onboarding-device";

describe("onboarding device", () => {
  it("lee username del cookie de dispositivo", () => {
    assert.equal(readOnboardedUsernameFromCookieValue("hector", undefined), "hector");
  });

  it("onboarding completo con fecha o avatar", () => {
    assert.equal(
      isProfileOnboardingComplete({
        username: "hector",
        is_active: true,
        onboarding_completed_at: null,
        avatar_url: "/icons/avatar/hector.png",
      }),
      true
    );
    assert.equal(
      isProfileOnboardingComplete({
        username: "nacho",
        is_active: true,
        onboarding_completed_at: "2026-06-01T00:00:00.000Z",
        avatar_url: null,
      }),
      true
    );
  });
});
