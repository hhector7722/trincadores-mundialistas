import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

type PredictionOutcomeIconProps = {
  variant: "mvp" | "success" | "error";
  className?: string;
};

const DISC_ICON_CLASS =
  "inline-block h-[1em] w-[1em] min-h-[10px] min-w-[10px] shrink-0";

/** Sombra plana detrás del icono; sin relieve ni brillos en el relleno. */
const ICON_BACK_DEPTH_CLASS = "drop-shadow-[0_1px_1.5px_rgba(0,0,0,0.3)]";

/** Círculo + cruz en un solo SVG; el cruce queda en el centro geométrico del disco. */
function ErrorOutcomeDisc({ className }: { className?: string }) {
  return (
    <svg
      data-outcome="error"
      viewBox="0 0 12 12"
      className={cn(DISC_ICON_CLASS, ICON_BACK_DEPTH_CLASS, className)}
      aria-hidden
    >
      <circle cx="6" cy="6" r="6" fill="#ef4444" />
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
  return (
    <svg
      data-outcome="success"
      viewBox="0 0 12 12"
      className={cn(DISC_ICON_CLASS, ICON_BACK_DEPTH_CLASS, className)}
      aria-hidden
    >
      <circle cx="6" cy="6" r="6" fill="#22c55e" />
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
          ICON_BACK_DEPTH_CLASS,
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
