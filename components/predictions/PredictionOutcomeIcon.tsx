import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

type PredictionOutcomeIconProps = {
  variant: "success" | "error";
  className?: string;
};

/** Icono circular que escala con el `font-size` del contenedor padre (p. ej. marcador). */
export function PredictionOutcomeIcon({ variant, className }: PredictionOutcomeIconProps) {
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
