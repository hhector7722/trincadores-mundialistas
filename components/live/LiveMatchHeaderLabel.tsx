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
        "inline-flex items-center gap-1 rounded-full bg-[#CCFF00]",
        "px-[clamp(6px,2cqw,8px)] py-[clamp(2px,0.8cqw,3px)]",
        "font-bold uppercase tracking-[0.12em] text-black",
        size === "card" ? "text-[8px]" : "text-[10px]",
        className,
      )}
    >
      EN JUEGO
      <LivePulseIcon />
    </span>
  );
}
