import { Check, Star, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PredictionOutcomeIconProps = {
  variant: "mvp" | "success" | "error";
  className?: string;
};

/** Icono compacto de resultado: estrella MVP (12px) o tick/cruz escalables con el contenedor. */
export function PredictionOutcomeIcon({ variant, className }: PredictionOutcomeIconProps) {
  if (variant === "mvp") {
    return (
      <Star
        className={cn("h-3 w-3 shrink-0 fill-[#facc15] text-[#facc15]", className)}
        strokeWidth={2}
        aria-hidden
      />
    );
  }

  const isSuccess = variant === "success";

  return (
    <span
      data-outcome={variant}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full leading-none",
        "h-[1em] w-[1em] min-h-[10px] min-w-[10px]",
        isSuccess ? "bg-emerald-500" : "bg-red-500",
        className,
      )}
      aria-hidden
    >
      {isSuccess ? (
        <Check className="block h-[0.66em] w-[0.66em] shrink-0 text-white" strokeWidth={3} />
      ) : (
        <X
          className="block h-[0.56em] w-[0.56em] shrink-0 text-white"
          strokeWidth={2.75}
        />
      )}
    </span>
  );
}
