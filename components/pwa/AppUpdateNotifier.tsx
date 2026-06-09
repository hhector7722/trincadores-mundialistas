"use client";

import { APP_VERSION_STORAGE_KEY } from "@/lib/pwa/deployment-version";
import { useEffect, useRef } from "react";

const CHECK_INTERVAL_MS = 5 * 60 * 1000;

type AppUpdateNotifierProps = {
  deploymentVersion: string;
};

async function fetchLiveVersion(): Promise<string | null> {
  try {
    const response = await fetch("/api/app-version", { cache: "no-store" });
    if (!response.ok) return null;
    const payload = (await response.json()) as { version?: string };
    return payload.version?.trim() || null;
  } catch {
    return null;
  }
}

/** Recarga sola cuando hay un deploy nuevo. */
export function AppUpdateNotifier({ deploymentVersion }: AppUpdateNotifierProps) {
  const knownVersionRef = useRef(deploymentVersion);

  useEffect(() => {
    knownVersionRef.current = deploymentVersion;

    const stored = sessionStorage.getItem(APP_VERSION_STORAGE_KEY);
    if (!stored) {
      sessionStorage.setItem(APP_VERSION_STORAGE_KEY, deploymentVersion);
    } else if (stored !== deploymentVersion) {
      sessionStorage.setItem(APP_VERSION_STORAGE_KEY, deploymentVersion);
      window.location.reload();
      return;
    }

    function reloadToVersion(nextVersion: string) {
      sessionStorage.setItem(APP_VERSION_STORAGE_KEY, nextVersion);
      knownVersionRef.current = nextVersion;

      if (document.visibilityState === "hidden") {
        window.location.reload();
        return;
      }

      window.setTimeout(() => {
        window.location.reload();
      }, 1500);
    }

    async function checkForUpdate() {
      const liveVersion = await fetchLiveVersion();
      if (!liveVersion || liveVersion === knownVersionRef.current) return;
      reloadToVersion(liveVersion);
    }

    const intervalId = window.setInterval(() => {
      void checkForUpdate();
    }, CHECK_INTERVAL_MS);

    function onVisibilityChange() {
      if (document.visibilityState === "visible") {
        void checkForUpdate();
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [deploymentVersion]);

  return null;
}
