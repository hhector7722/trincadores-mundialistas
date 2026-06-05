"use client";

import { useEffect, useState } from "react";
import { formatPredictionCountdown, predictionLockDeadlineMs } from "@/lib/predictions/deadline";

type PredictionDeadlineCountdownProps = {
  kickoffAt: string;
};

export function PredictionDeadlineCountdown({ kickoffAt }: PredictionDeadlineCountdownProps) {
  const deadlineMs = predictionLockDeadlineMs(kickoffAt);
  const [remainingMs, setRemainingMs] = useState(() => deadlineMs - Date.now());

  useEffect(() => {
    function tick() {
      setRemainingMs(deadlineMs - Date.now());
    }

    tick();
    const intervalId = window.setInterval(tick, 1000);
    return () => window.clearInterval(intervalId);
  }, [deadlineMs]);

  return (
    <p className="text-center text-xs text-[var(--tm-muted)]">
      El pronóstico se cierra en{" "}
      <span className="font-semibold tabular-nums text-[var(--tm-fg)]">
        {formatPredictionCountdown(remainingMs)}
      </span>
    </p>
  );
}
