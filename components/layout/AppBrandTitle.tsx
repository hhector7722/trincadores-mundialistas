import { cn } from "@/lib/utils";

type AppBrandTitleProps = {
  className?: string;
  stacked?: boolean;
};

function BrandLogo({ className }: { className?: string }) {
  return (
    <img
      src="/icons/logo.png"
      alt=""
      className={cn(
        "aspect-square shrink-0 rounded-[0.1em] object-cover opacity-85",
        className,
      )}
      aria-hidden
    />
  );
}

export function AppBrandTitle({ className, stacked = false }: AppBrandTitleProps) {
  if (stacked) {
    return (
      <span
        className={cn(
          "font-brand inline-flex items-center gap-1 uppercase tracking-tight text-[var(--tm-accent)]",
          className,
        )}
      >
        <BrandLogo className="size-[0.85em]" />
        <span className="flex flex-col gap-px text-left leading-tight">
          <span>Trincadores</span>
          <span>Mundialistas</span>
        </span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "font-brand inline-flex items-center gap-1 uppercase tracking-tight text-[var(--tm-accent)]",
        className,
      )}
    >
      <BrandLogo className="size-[0.7em]" />
      <span className="text-left leading-tight">Trincadores Mundialistas</span>
    </span>
  );
}
