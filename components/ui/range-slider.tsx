"use client";

import { cn } from "@/lib/utils";

type RangeSliderProps = {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  "aria-label"?: string;
};

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  className,
  "aria-label": ariaLabel,
}: RangeSliderProps) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(event) => onChange(Number(event.target.value))}
      aria-label={ariaLabel}
      className={cn("tm-range-slider w-full", className)}
    />
  );
}
