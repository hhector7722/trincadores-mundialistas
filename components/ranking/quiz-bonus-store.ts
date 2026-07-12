"use client";

import { useSyncExternalStore } from "react";

const STORAGE_KEY = "tm-ranking-quiz-bonus";

function readStoredQuizBonusActive(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

function writeStoredQuizBonusActive(active: boolean) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, active ? "1" : "0");
  } catch {
    // ignore quota / private mode
  }
}

let isQuizBonusActive = false;
const listeners = new Set<() => void>();

export const quizBonusStore = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },
  getSnapshot() {
    return isQuizBonusActive;
  },
  getServerSnapshot() {
    return false;
  },
  hydrateFromStorage() {
    const stored = readStoredQuizBonusActive();
    if (stored !== isQuizBonusActive) {
      isQuizBonusActive = stored;
      listeners.forEach((l) => l());
    }
  },
  toggle() {
    isQuizBonusActive = !isQuizBonusActive;
    writeStoredQuizBonusActive(isQuizBonusActive);
    listeners.forEach((l) => l());
  },
  reset() {
    if (isQuizBonusActive) {
      isQuizBonusActive = false;
      writeStoredQuizBonusActive(false);
      listeners.forEach((l) => l());
    }
  },
};

export function useQuizBonusActive() {
  return useSyncExternalStore(
    quizBonusStore.subscribe,
    quizBonusStore.getSnapshot,
    quizBonusStore.getServerSnapshot
  );
}
