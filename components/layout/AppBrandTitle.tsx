import { cn } from "@/lib/utils";
import { BrandLogo } from "@/components/layout/BrandLogo";

type AppBrandTitleProps = {
  className?: string;
  stacked?: boolean;
};

export function AppBrandTitle({ className, stacked = false }: AppBrandTitleProps) {
  if (stacked) {
    return (
      <span
        className={cn(
          "font-brand inline-block uppercase tracking-[-0.03em] text-[var(--tm-accent)]",
          className,
        )}
      >
        <span className="flex flex-col text-left leading-[0.82]">
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
      <span className="text-left leading-tight">Trincadores Mundialistas</span>
    </span>
  );
}
