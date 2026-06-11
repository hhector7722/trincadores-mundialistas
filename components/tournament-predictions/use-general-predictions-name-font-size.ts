"use client";

import { useLayoutEffect, useMemo, useState } from "react";

const NAME_FONT_MAX_PX = 12;
const NAME_FONT_MIN_PX = 6.5;
const NAME_FONT_STEP_PX = 0.25;
const RANKING_AVATAR_PX = 36;
const RANKING_NAME_GAP_PX = 10;

function measureNameFontSize(longestLabel: string, columnWidthPx: number): number {
  const available = columnWidthPx - RANKING_AVATAR_PX - RANKING_NAME_GAP_PX;
  if (!longestLabel || available <= 0) return NAME_FONT_MAX_PX;

  const probe = document.createElement("span");
  probe.style.cssText =
    "position:absolute;visibility:hidden;white-space:nowrap;font-weight:500;font-family:inherit";
  probe.textContent = longestLabel;
  document.body.appendChild(probe);

  let size = NAME_FONT_MAX_PX;
  while (size >= NAME_FONT_MIN_PX) {
    probe.style.fontSize = `${size}px`;
    if (probe.offsetWidth <= available) break;
    size -= NAME_FONT_STEP_PX;
  }

  document.body.removeChild(probe);
  return Math.round(size * 4) / 4;
}

export function useGeneralPredictionsNameFontSize(
  labels: string[],
  columnElement: HTMLElement | null
): number {
  const longestLabel = useMemo(
    () => labels.reduce((max, label) => (label.length > max.length ? label : max), ""),
    [labels]
  );
  const [fontSize, setFontSize] = useState(NAME_FONT_MAX_PX);

  useLayoutEffect(() => {
    if (!columnElement || !longestLabel) {
      setFontSize(NAME_FONT_MAX_PX);
      return;
    }

    function measure() {
      setFontSize(measureNameFontSize(longestLabel, columnElement.clientWidth));
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(columnElement);
    return () => observer.disconnect();
  }, [columnElement, longestLabel, labels.length]);

  return fontSize;
}
