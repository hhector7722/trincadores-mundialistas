import { LivePulseIcon } from "@/components/live/LivePulseIcon";
import { cn } from "@/lib/utils";

type LiveMatchHeaderLabelProps = {
  className?: string;
  size?: "card" | "modal";
  /** Minuto en vivo (p. ej. 23'); fuera del pill amarillo. */
  minuteLabel?: string | null;
};

function shouldShowLiveMinute(minuteLabel: string | null | undefined): minuteLabel is string {
  if (!minuteLabel) return false;
  const trimmed = minuteLabel.trim();
  return trimmed.length > 0 && trimmed !== "—" && trimmed.toLowerCase() !== "en juego";
}

export function LiveMatchHeaderLabel({
  className,
  size = "card",
  minuteLabel,
}: LiveMatchHeaderLabelProps) {
  const showMinute = shouldShowLiveMinute(minuteLabel);

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-full bg-[#CCFF00]",
          "px-[clamp(6px,2cqw,8px)] pt-[clamp(2px,0.8cqw,3px)] pb-[clamp(1px,0.4cqw,1.5px)]",
          "font-bold uppercase leading-none tracking-[0.12em] text-black",
          size === "card" ? "text-[8px]" : "text-[10px]",
        )}
      >
        <span className="-translate-y-[0.5px]">EN JUEGO</span>
        <LivePulseIcon className="-translate-y-[0.25px]" />
      </span>
      {showMinute ? (
        <span
          className={cn(
            "shrink-0 font-bold tabular-nums leading-none text-[var(--tm-accent)]",
            size === "card" ? "text-[8px]" : "text-[10px]",
          )}
        >
          {minuteLabel}
        </span>
      ) : null}
    </span>
  );
}
