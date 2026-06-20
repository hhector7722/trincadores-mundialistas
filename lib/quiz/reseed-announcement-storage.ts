const STORAGE_PREFIX = "tm-quiz-reseed-dismissed:";

function storageKey(announcementId: string): string {
  return `${STORAGE_PREFIX}${announcementId}`;
}

export function isQuizReseedAnnouncementDismissed(announcementId: string): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(storageKey(announcementId)) === "1";
}

export function dismissQuizReseedAnnouncement(announcementId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(storageKey(announcementId), "1");
}
