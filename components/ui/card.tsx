import { cn } from "@/lib/utils";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "rounded-[var(--tm-radius)] border border-[var(--tm-border)] bg-[var(--tm-surface)] p-4",
        className
      )}
      style={{ boxShadow: "var(--tm-shadow)" }}
    >
      {children}
    </div>
  );
}
