import { cn } from "@/lib/utils";

export function AppBrandTitle({ className }: { className?: string }) {
  return (
    <span className={cn("uppercase text-[var(--tm-accent)]", className)}>
      Trincadores Mundialistas
    </span>
  );
}
