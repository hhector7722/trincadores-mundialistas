import { cn } from "@/lib/utils";

type TmSpinnerProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  label?: string;
};

const sizeClass: Record<NonNullable<TmSpinnerProps["size"]>, string> = {
  sm: "tm-spinner tm-spinner--sm",
  md: "tm-spinner",
  lg: "tm-spinner tm-spinner--lg",
};

export function TmSpinner({ size = "md", className, label = "Cargando" }: TmSpinnerProps) {
  return (
    <div
      role="status"
      aria-label={label}
      className={cn(sizeClass[size], className)}
    />
  );
}

type LoadingCenterProps = {
  label?: string;
  className?: string;
  minHeightClassName?: string;
  spinnerSize?: TmSpinnerProps["size"];
};

export function LoadingCenter({
  label,
  className,
  minHeightClassName = "min-h-[min(40dvh,16rem)]",
  spinnerSize = "md",
}: LoadingCenterProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-4 py-8",
        minHeightClassName,
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <TmSpinner size={spinnerSize} />
      {label ? <p className="text-sm text-[var(--tm-muted)]">{label}</p> : null}
    </div>
  );
}

type LoadingOverlayProps = {
  label?: string;
  className?: string;
};

export function LoadingOverlay({ label, className }: LoadingOverlayProps) {
  return (
    <div
      className={cn(
        "absolute inset-0 z-20 flex items-center justify-center bg-[var(--tm-shell-bg-hex)]/50 backdrop-blur-[3px]",
        className
      )}
      aria-busy="true"
      aria-live="polite"
    >
      <LoadingCenter minHeightClassName="min-h-0 py-0" label={label} />
    </div>
  );
}
