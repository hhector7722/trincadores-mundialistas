import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

type ConfirmedLineupCheckIconProps = {
  className?: string;
};

/** Tick blanco en círculo verde; escala con el `font-size` del texto padre. */
export function ConfirmedLineupCheckIcon({ className }: ConfirmedLineupCheckIconProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-emerald-500",
        "h-[1em] w-[1em] min-h-[10px] min-w-[10px]",
        className,
      )}
      aria-hidden
    >
      <Check className="h-[0.62em] w-[0.62em] text-white" strokeWidth={3} />
    </span>
  );
}
