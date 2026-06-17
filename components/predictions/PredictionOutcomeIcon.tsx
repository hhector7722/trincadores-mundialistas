import { useId } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type PredictionOutcomeIconProps = {
  variant: "mvp" | "success" | "error";
  className?: string;
};

const DISC_ICON_CLASS =
  "inline-block h-[1em] w-[1em] min-h-[10px] min-w-[10px] shrink-0";

/** Sombra suave compartida: ligera elevación sobre la card. */
const ICON_DEPTH_CLASS =
  "drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.22)] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.32)]";

const MVP_DEPTH_CLASS =
  "drop-shadow-[0_0.5px_0.5px_rgba(0,0,0,0.2)] drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.28)] drop-shadow-[0_0_3px_rgba(250,204,21,0.22)]";

/** Círculo + cruz en un solo SVG; el cruce queda en el centro geométrico del disco. */
function ErrorOutcomeDisc({ className }: { className?: string }) {
  const uid = useId();
  const gradientId = `${uid}-error-disc`;

  return (
    <svg
      data-outcome="error"
      viewBox="0 0 12 12"
      className={cn(DISC_ICON_CLASS, ICON_DEPTH_CLASS, className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradientId} cx="32%" cy="26%" r="72%" fx="32%" fy="26%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="58%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>
      </defs>
      <circle cx="6" cy="6" r="6" fill={`url(#${gradientId})`} />
      <path
        d="M4 4 8 8 M8 4 4 8"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.65"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Círculo + tick en un solo SVG, proporciones alineadas con el disco de error. */
function SuccessOutcomeDisc({ className }: { className?: string }) {
  const uid = useId();
  const gradientId = `${uid}-success-disc`;

  return (
    <svg
      data-outcome="success"
      viewBox="0 0 12 12"
      className={cn(DISC_ICON_CLASS, ICON_DEPTH_CLASS, className)}
      aria-hidden
    >
      <defs>
        <radialGradient id={gradientId} cx="32%" cy="26%" r="72%" fx="32%" fy="26%">
          <stop offset="0%" stopColor="#86efac" />
          <stop offset="58%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </radialGradient>
      </defs>
      <circle cx="6" cy="6" r="6" fill={`url(#${gradientId})`} />
      <path
        d="M3.4 6.15 5.15 7.9 8.6 4.1"
        fill="none"
        stroke="#ffffff"
        strokeWidth="1.65"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Icono compacto de resultado: estrella MVP o disco con tick/cruz. */
export function PredictionOutcomeIcon({ variant, className }: PredictionOutcomeIconProps) {
  if (variant === "mvp") {
    return (
      <Star
        className={cn(
          "h-3 w-3 shrink-0 fill-[#facc15] text-[#facc15]",
          MVP_DEPTH_CLASS,
          className,
        )}
        strokeWidth={2}
        aria-hidden
      />
    );
  }

  if (variant === "error") {
    return <ErrorOutcomeDisc className={className} />;
  }

  return <SuccessOutcomeDisc className={className} />;
}
