import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isActiveQuizReseedAnnouncement,
  shouldShowQuizReseedAnnouncement,
} from "@/lib/quiz/reseed-announcement";

test("isActiveQuizReseedAnnouncement solo el dia configurado", () => {
  assert.equal(isActiveQuizReseedAnnouncement("2026-06-20"), true);
  assert.equal(isActiveQuizReseedAnnouncement("2026-06-19"), false);
});

test("shouldShowQuizReseedAnnouncement en preview hector, gabri y dani", () => {
  assert.equal(shouldShowQuizReseedAnnouncement("hector", "2026-06-20"), true);
  assert.equal(shouldShowQuizReseedAnnouncement("Héctor", "2026-06-20"), true);
  assert.equal(shouldShowQuizReseedAnnouncement("gabri", "2026-06-20"), true);
  assert.equal(shouldShowQuizReseedAnnouncement("dani", "2026-06-20"), true);
  assert.equal(shouldShowQuizReseedAnnouncement("pablo", "2026-06-20"), false);
  assert.equal(shouldShowQuizReseedAnnouncement("hector", "2026-06-19"), false);
});
