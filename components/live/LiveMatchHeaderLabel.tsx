import { LivePulseIcon } from "@/components/live/LivePulseIcon";
import { cn } from "@/lib/utils";

type LiveMatchHeaderLabelProps = {
  className?: string;
  size?: "card" | "modal";
};

export function LiveMatchHeaderLabel({ className, size = "card" }: LiveMatchHeaderLabelProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold uppercase tracking-[0.12em] text-[var(--tm-live)]",
        size === "card" ? "text-[8px]" : "text-[10px]",
        className,
      )}
    >
      EN JUEGO
      <LivePulseIcon />
    </span>
  );
}
