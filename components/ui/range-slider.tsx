"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

type RangeSliderProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  /** Thumb personalizado con imagen (p. ej. `/icons/slider.png`). */
  thumbImageSrc?: string;
  "aria-label"?: string;
};

/** Proporción real de `public/icons/slider.png` (1178×1335). */
const FLAG_THUMB_ASPECT = 1178 / 1335;
const FLAG_THUMB_HEIGHT_PX = 52;
const FLAG_THUMB_WIDTH_PX = Math.round(FLAG_THUMB_HEIGHT_PX * FLAG_THUMB_ASPECT);

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  className,
  thumbImageSrc,
  "aria-label": ariaLabel,
}: RangeSliderProps) {
  const useImageThumb = Boolean(thumbImageSrc);

  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={ariaLabel}
      className={cn(
        "tm-range-slider w-full",
        useImageThumb && "tm-range-slider--image-thumb",
        className
      )}
      style={
        useImageThumb
          ? ({
              "--tm-range-thumb-image": `url(${thumbImageSrc})`,
              "--tm-range-thumb-h": `${FLAG_THUMB_HEIGHT_PX}px`,
              "--tm-range-thumb-w": `${FLAG_THUMB_WIDTH_PX}px`,
            } as CSSProperties)
          : undefined
      }
    />
  );
}
