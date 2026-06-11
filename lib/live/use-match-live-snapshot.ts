"use client";

import { useEffect, useState } from "react";
import { fetchMatchLiveSnapshotAction } from "@/actions/live-match";
import type { MatchLiveSnapshot } from "@/lib/live/types";

const LIVE_POLL_MS = 30_000;

export function useMatchLiveSnapshot(matchId: string | undefined, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<MatchLiveSnapshot | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled || !matchId) {
      setSnapshot(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: number | undefined;

    const load = async () => {
      const result = await fetchMatchLiveSnapshotAction(matchId);
      if (cancelled) return;
      if (result.ok) setSnapshot(result.data);
      setLoading(false);
    };

    void load();
    timer = window.setInterval(() => {
      void load();
    }, LIVE_POLL_MS);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
    };
  }, [enabled, matchId]);

  return { snapshot, loading };
}
