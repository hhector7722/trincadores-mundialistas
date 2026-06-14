"use client";

import { Suspense } from "react";
import { usePageView } from "@/lib/usage/usePageView";

function UsagePageTrackerInner() {
  usePageView();
  return null;
}

/** Monta el tracking de navegacion cliente en el shell autenticado. */
export function UsagePageTracker() {
  return (
    <Suspense fallback={null}>
      <UsagePageTrackerInner />
    </Suspense>
  );
}
