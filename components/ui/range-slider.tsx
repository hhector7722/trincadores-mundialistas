"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
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
const FLAG_THUMB_HEIGHT_PX = 56;
const FLAG_THUMB_WIDTH_PX = Math.round(FLAG_THUMB_HEIGHT_PX * FLAG_THUMB_ASPECT);
/** 80% de la imagen por encima de la barra, 20% por debajo. */
const FLAG_THUMB_ABOVE_RATIO = 0.8;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function ImageThumbRangeSlider({
  min,
  max,
  value,
  onChange,
  thumbImageSrc,
  "aria-label": ariaLabel,
  className,
}: Omit<RangeSliderProps, "thumbImageSrc"> & { thumbImageSrc: string }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const [dragRatio, setDragRatio] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastRoundedRef = useRef(value);

  useEffect(() => {
    lastRoundedRef.current = value;
  }, [value]);

  const span = Math.max(0, max - min);
  const valueRatio = span === 0 ? 0 : (value - min) / span;
  const activeRatio = dragRatio ?? valueRatio;
  const thumbLeftPercent = activeRatio * 100;

  const updateFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track) return;

      const rect = track.getBoundingClientRect();
      if (rect.width <= 0) return;

      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      setDragRatio(ratio);

      const rounded = span === 0 ? min : Math.round(min + ratio * span);
      if (rounded !== lastRoundedRef.current) {
        lastRoundedRef.current = rounded;
        onChange(rounded);
      }
    },
    [min, onChange, span]
  );

  const endDrag = useCallback(() => {
    setIsDragging(false);
    setDragRatio(null);
  }, []);

  function handlePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (span === 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
    updateFromClientX(event.clientX);
  }

  function handlePointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    updateFromClientX(event.clientX);
  }

  function handlePointerUp(event: ReactPointerEvent<HTMLDivElement>) {
    if (!isDragging) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    endDrag();
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (span === 0) return;
    let next = value;
    if (event.key === "ArrowRight" || event.key === "ArrowUp") next = Math.min(max, value + 1);
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") next = Math.max(min, value - 1);
    if (event.key === "Home") next = min;
    if (event.key === "End") next = max;
    if (next !== value) {
      event.preventDefault();
      lastRoundedRef.current = next;
      onChange(next);
    }
  }

  return (
    <div
      className={cn("tm-flag-range-slider", className)}
      style={
        {
          "--tm-range-thumb-image": `url(${thumbImageSrc})`,
          "--tm-range-thumb-h": `${FLAG_THUMB_HEIGHT_PX}px`,
          "--tm-range-thumb-w": `${FLAG_THUMB_WIDTH_PX}px`,
          "--tm-range-thumb-above": `${FLAG_THUMB_ABOVE_RATIO * 100}%`,
        } as CSSProperties
      }
    >
      <div
        ref={trackRef}
        role="slider"
        tabIndex={0}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabel ? undefined : labelId}
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={value}
        aria-valuetext={`Jornada ${value + 1}`}
        className="tm-flag-range-slider__hit"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
      >
        <div className="tm-flag-range-slider__track" aria-hidden />
        <div
          className={cn(
            "tm-flag-range-slider__thumb",
            isDragging && "tm-flag-range-slider__thumb--dragging"
          )}
          style={{ left: `${thumbLeftPercent}%` }}
          aria-hidden
        />
      </div>
    </div>
  );
}

export function RangeSlider({
  min,
  max,
  value,
  onChange,
  className,
  thumbImageSrc,
  "aria-label": ariaLabel,
}: RangeSliderProps) {
  if (thumbImageSrc) {
    return (
      <ImageThumbRangeSlider
        min={min}
        max={max}
        value={value}
        onChange={onChange}
        thumbImageSrc={thumbImageSrc}
        aria-label={ariaLabel}
        className={className}
      />
    );
  }

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
