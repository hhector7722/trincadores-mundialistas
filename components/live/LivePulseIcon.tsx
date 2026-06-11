import { cn } from "@/lib/utils";

type LivePulseIconProps = {
  className?: string;
};

export function LivePulseIcon({ className }: LivePulseIconProps) {
  return (
    <span className={cn("relative inline-flex h-[0.55em] w-[0.55em] min-h-[5px] min-w-[5px] shrink-0", className)}>
      <span className="absolute inset-0 animate-ping rounded-full bg-red-500/70" aria-hidden />
      <span className="relative inline-flex h-full w-full rounded-full bg-red-500" aria-hidden />
    </span>
  );
}
