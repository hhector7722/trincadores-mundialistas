import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { cn } from "@/lib/utils";

type TeamFlagBadgeProps = {
  name: string;
  size?: "xs" | "sm" | "md";
  className?: string;
};

export function TeamFlagBadge({ name, size = "sm", className }: TeamFlagBadgeProps) {
  const flagCode = teamFlagCode(name);
  const dim =
    size === "xs" ? "h-5 w-5" : size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const px = size === "xs" ? 40 : size === "sm" ? 80 : 120;
  const imgSize = size === "xs" ? 20 : size === "sm" ? 28 : 36;

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
        />
      ) : (
        <span
          className={cn(
            "font-display text-[var(--tm-accent)]",
            size === "xs" ? "text-[8px]" : "text-[10px]"
          )}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
