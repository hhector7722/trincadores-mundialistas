const DISMISSED_KEY = "tm-push-prompt-dismissed";

export function isPushPromptDismissed(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(DISMISSED_KEY) === "1";
}

export function dismissPushPrompt(): void {
  window.localStorage.setItem(DISMISSED_KEY, "1");
}
