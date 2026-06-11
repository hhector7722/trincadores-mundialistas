import { teamFlagCode, teamFlagUrl } from "@/lib/teams/flags";
import { cn } from "@/lib/utils";

type TeamFlagBadgeProps = {
  name: string;
  size?: "cal" | "ko" | "text" | "xxs" | "xs" | "sm" | "md" | "lg";
  className?: string;
  loading?: "lazy" | "eager";
  /** Ancho fuente flagcdn (px). Por defecto según size. */
  imageWidth?: number;
  /** Placeholder sin bandera: negro y negrita (cuadro eliminatoria). */
  placeholderStyle?: "default" | "knockout";
};

export function TeamFlagBadge({
  name,
  size = "sm",
  className,
  loading = "lazy",
  imageWidth,
  placeholderStyle = "default",
}: TeamFlagBadgeProps) {
  const flagCode = teamFlagCode(name);
  const scaled = size === "cal";
  const dim = scaled
    ? "tm-cal-flag-dim"
    : size === "ko"
      ? "tm-ko-flag-dim"
      : size === "text"
        ? "h-[1em] w-[1em]"
        : size === "xxs"
          ? "h-3.5 w-3.5"
          : size === "xs"
          ? "h-5 w-5"
          : size === "sm"
            ? "h-7 w-7"
            : size === "lg"
              ? "h-10 w-10 sm:h-11 sm:w-11"
              : "h-9 w-9";
  const px = imageWidth ??
    (scaled
      ? 40
      : size === "ko"
        ? 40
        : size === "text"
          ? 20
          : size === "xxs"
            ? 28
            : size === "xs"
            ? 80
            : size === "sm"
              ? 80
              : size === "lg"
                ? 160
                : 120);
  const imgSize = scaled
    ? undefined
    : size === "ko"
      ? 18
      : size === "text"
        ? undefined
        : size === "xxs"
          ? 14
          : size === "xs"
          ? 20
          : size === "sm"
            ? 28
            : size === "lg"
              ? 44
              : 36;

  return (
    <div
      className={cn(
        "tm-circle-depth flex shrink-0 items-center justify-center overflow-hidden rounded-full",
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
          loading={loading}
          decoding="async"
        />
      ) : (
        <span
          className={cn(
            "font-display",
            placeholderStyle === "knockout"
              ? "font-extrabold text-black"
              : "text-[var(--tm-accent)]",
            scaled || size === "ko" || size === "text" || size === "xxs"
              ? size === "text" ? "text-[0.55em] leading-none" : "text-[6px]"
              : size === "xs"
                ? "text-[8px]"
                : size === "lg"
                  ? "text-base"
                  : "text-[10px]"
          )}
        >
          {name.slice(0, 2).toUpperCase()}
        </span>
      )}
    </div>
  );
}
