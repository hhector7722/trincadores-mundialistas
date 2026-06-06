import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

type AppBrandTitleProps = {
  className?: string;
  stacked?: boolean;
  centered?: boolean;
};

const brandTextClass = "tm-brand-title-text";

export function AppBrandTitle({
  className,
  stacked = false,
  centered = false,
}: AppBrandTitleProps) {
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
            "flex flex-col leading-[0.82]",
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
