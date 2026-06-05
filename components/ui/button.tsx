import { cn } from "@/lib/utils";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center rounded-xl px-4 text-sm font-medium transition-colors",
        variant === "primary" && "bg-[var(--tm-primary)] text-white hover:opacity-90",
        variant === "ghost" && "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]",
        variant === "outline" &&
          "border border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)]",
        className
      )}
      {...props}
    />
  );
}
