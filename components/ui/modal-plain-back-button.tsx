import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type ModalPlainBackButtonProps = {
  onClick: () => void;
  className?: string;
  compact?: boolean;
};

export function ModalPlainBackButton({
  onClick,
  className,
  compact = false,
}: ModalPlainBackButtonProps) {
  return (
    <button
      type="button"
      aria-label="Volver"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center text-[var(--tm-muted)] transition-colors hover:text-[var(--tm-fg)]",
        compact ? "h-8 w-8" : "h-10 w-10",
        className
      )}
    >
      <ChevronLeft className={compact ? "h-4 w-4" : "h-5 w-5"} />
    </button>
  );
}
