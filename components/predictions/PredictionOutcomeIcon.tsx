import { Check, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PredictionOutcomeIconProps = {
  variant: "mvp" | "success" | "error";
  className?: string;
};

/**
 * Capa secundaria MVP en cards del calendario: estrella amarilla 12px (esquina superior derecha del body).
 * Variantes success/error se usan fuera del calendario (filas de marcador, botón MVP).
 */
export function PredictionOutcomeIcon({ variant, className }: PredictionOutcomeIconProps) {
  if (variant === "mvp") {
    return (
      <Star
        className={cn(
          "pointer-events-none absolute right-0.5 top-0.5 z-[6] h-3 w-3 shrink-0 fill-[#facc15] text-[#facc15]",
          className,
        )}
        strokeWidth={2}
        aria-hidden
      />
    );
  }

  const isSuccess = variant === "success";

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full",
        "h-[1em] w-[1em] min-h-[10px] min-w-[10px]",
        isSuccess ? "bg-emerald-500" : "bg-red-500",
        className,
      )}
      aria-hidden
    >
      {isSuccess ? (
        <Check className="h-[0.62em] w-[0.62em] text-white" strokeWidth={3} />
      ) : (
        <X className="h-[0.62em] w-[0.62em] text-white" strokeWidth={3} />
      )}
    </span>
  );
}
