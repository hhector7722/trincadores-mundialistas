import { createDefaultLabDraft } from "@/lib/quiz/lab/defaults";
import { hydrateLabDraft } from "@/lib/quiz/lab/hydrate";
import type { LabDraft } from "@/lib/quiz/lab/types";

const STORAGE_KEY = "tm-quiz-lab-draft-v2";

function isLabDraft(value: unknown): value is LabDraft {
  if (!value || typeof value !== "object") return false;
  const draft = value as LabDraft;
  return draft.version === 1 && typeof draft.title === "string" && Array.isArray(draft.questions);
}

export function readLabDraft(): LabDraft {
  if (typeof window === "undefined") {
    return createDefaultLabDraft();
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultLabDraft();
    const parsed: unknown = JSON.parse(raw);
    if (!isLabDraft(parsed)) return createDefaultLabDraft();
    const hydrated = hydrateLabDraft(parsed);
    if (JSON.stringify(hydrated) !== JSON.stringify(parsed)) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hydrated));
    }
    return hydrated;
  } catch {
    return createDefaultLabDraft();
  }
}

export function writeLabDraft(draft: LabDraft): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
}

export function resetLabDraft(): LabDraft {
  const draft = createDefaultLabDraft();
  writeLabDraft(draft);
  return draft;
}
