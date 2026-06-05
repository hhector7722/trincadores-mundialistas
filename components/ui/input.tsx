import { cn } from "@/lib/utils";

export function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "min-h-12 w-full rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] px-3 text-base text-[var(--tm-fg)] outline-none placeholder:text-[var(--tm-subtle)] focus:border-[var(--tm-accent-muted)]",
        className
      )}
      {...props}
    />
  );
}
