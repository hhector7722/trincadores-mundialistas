import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "live" | "muted";

export function Badge({
  children,
  variant = "default",
  className,
}: {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-6 items-center rounded-md px-2 text-xs font-medium uppercase tracking-wide",
        variant === "default" && "bg-[var(--tm-accent-soft)] text-[var(--tm-accent)]",
        variant === "live" && "bg-[var(--tm-live-soft)] text-[var(--tm-live)]",
        variant === "muted" && "bg-[var(--tm-bg-elevated)] text-[var(--tm-muted)]",
        className
      )}
    >
      {children}
    </span>
  );
}
