"use client";

import { useSyncExternalStore } from "react";

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
  toggle() {
    isQuizBonusActive = !isQuizBonusActive;
    listeners.forEach((l) => l());
  },
  reset() {
    if (isQuizBonusActive) {
      isQuizBonusActive = false;
      listeners.forEach((l) => l());
    }
  },
};

export function useQuizBonusActive() {
  return useSyncExternalStore(
    quizBonusStore.subscribe,
    quizBonusStore.getSnapshot,
    quizBonusStore.getSnapshot
  );
}
