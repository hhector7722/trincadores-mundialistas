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
        "inline-flex min-h-12 items-center justify-center rounded-full px-5 text-sm font-semibold transition-colors",
        variant === "primary" &&
          "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)] hover:brightness-110",
        variant === "ghost" && "rounded-xl text-[var(--tm-muted)] hover:text-[var(--tm-fg)]",
        variant === "outline" &&
          "rounded-xl border border-[var(--tm-border)] bg-[var(--tm-surface)] text-[var(--tm-fg)] hover:border-[var(--tm-accent-muted)]",
        className
      )}
      {...props}
    />
  );
}
