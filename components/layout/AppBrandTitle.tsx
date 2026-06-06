import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

type AppBrandTitleProps = {
  className?: string;
  stacked?: boolean;
  centered?: boolean;
  /** Home: cada línea centrada en viewport + logo a la izquierda del bloque. */
  homeHeader?: boolean;
  /** Más separación entre líneas del título apilado (p. ej. login). */
  spacedStack?: boolean;
};

const brandTextClass = "tm-brand-title-text";

export function AppBrandTitle({
  className,
  stacked = false,
  centered = false,
  homeHeader = false,
  spacedStack = false,
}: AppBrandTitleProps) {
  if (homeHeader) {
    return (
      <span
        className={cn(
          "font-brand relative block w-full uppercase tracking-[-0.03em] text-[var(--tm-accent)]",
          brandTextClass,
          className,
        )}
      >
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="relative">
            <BrandLogo className="absolute right-full top-1/2 mr-2 -translate-y-1/2 size-9 rounded-md sm:size-10" />
            <span className="invisible flex flex-col leading-[0.82]">
              <span>Trincadores</span>
              <span>Mundialistas</span>
            </span>
          </span>
        </span>
        <span className="grid w-full grid-cols-[1fr_auto_1fr] leading-[0.82]">
          <span className="col-start-2">Trincadores</span>
        </span>
        <span className="grid w-full grid-cols-[1fr_auto_1fr] leading-[0.82]">
          <span className="col-start-2">Mundialistas</span>
        </span>
      </span>
    );
  }

  if (stacked) {
    return (
      <span
        className={cn(
          "font-brand inline-block uppercase tracking-[-0.03em] text-[var(--tm-accent)]",
          brandTextClass,
          centered && "text-center",
          className,
        )}
      >
        <span
          className={cn(
            "flex flex-col",
            spacedStack ? "gap-0.5 leading-[0.9]" : "leading-[0.82]",
            centered ? "items-center text-center" : "text-left",
          )}
        >
          <span>Trincadores</span>
          <span>Mundialistas</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-brand inline-flex items-center gap-1 uppercase tracking-[-0.03em] text-[var(--tm-accent)]",
        className,
      )}
    >
      <BrandLogo className="size-[0.7em]" />
      <span className={cn("text-left leading-tight", brandTextClass)}>Trincadores Mundialistas</span>
    </span>
  );
}
