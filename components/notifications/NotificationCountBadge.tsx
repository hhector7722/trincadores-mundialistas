import { cn } from "@/lib/utils";

/** Badge estilo iOS — mismo patrón que marbella-app. */
export function NotificationCountBadge({
  label,
  placement = "inline",
}: {
  label: string;
  placement?: "inline" | "bell";
}) {
  const compact = placement === "bell";
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full bg-[#FF3B30] text-white tabular-nums",
        "font-semibold leading-none shadow-[0_1px_4px_rgba(255,59,48,0.4)]",
        compact
          ? "min-h-[15px] min-w-[15px] px-[3px] text-[9px]"
          : "min-h-[18px] min-w-[18px] px-1 text-[11px]",
      )}
    >
      {label}
    </span>
  );
}
