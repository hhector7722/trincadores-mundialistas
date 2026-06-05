import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { cn } from "@/lib/utils";

type TeamFlagBadgeProps = {
  name: string;
  size?: "cal" | "xxs" | "xs" | "sm" | "md";
  className?: string;
};

export function TeamFlagBadge({ name, size = "sm", className }: TeamFlagBadgeProps) {
  const flagCode = teamFlagCode(name);
  const scaled = size === "cal";
  const dim = scaled
    ? "tm-cal-flag-dim"
    : size === "xxs"
      ? "h-3.5 w-3.5"
      : size === "xs"
        ? "h-5 w-5"
        : size === "sm"
          ? "h-7 w-7"
          : "h-9 w-9";
  const px = scaled ? 40 : size === "xxs" ? 28 : size === "xs" ? 40 : size === "sm" ? 80 : 120;
  const imgSize = scaled ? undefined : size === "xxs" ? 14 : size === "xs" ? 20 : size === "sm" ? 28 : 36;

  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)]",
        dim,
        className
      )}
    >
      {flagCode ? (
        <img
          src={teamFlagUrl(flagCode, px)}
          alt=""
          width={imgSize}
          height={imgSize}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      ) : (
        <span
          className={cn(
            "font-display text-[var(--tm-accent)]",
            scaled || size === "xxs"
              ? "text-[6px]"
              : size === "xs"
                ? "text-[8px]"
                : "text-[10px]"
          )}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
