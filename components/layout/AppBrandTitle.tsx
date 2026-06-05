import { cn } from "@/lib/utils";

type AppBrandTitleProps = {
  className?: string;
  stacked?: boolean;
};

const logoClassName =
  "aspect-square h-full w-auto shrink-0 rounded-[0.12em] object-cover";

function BrandLogo() {
  return (
    <img
      src="/icons/logo.png"
      alt=""
      className={logoClassName}
      aria-hidden
    />
  );
}

export function AppBrandTitle({ className, stacked = false }: AppBrandTitleProps) {
  if (stacked) {
    return (
      <span
        className={cn(
          "inline-grid grid-cols-[auto_auto] grid-rows-[auto_auto] items-center gap-x-1.5 gap-y-px uppercase text-[var(--tm-accent)]",
          className,
        )}
      >
        <span className="col-start-1 row-start-1 row-span-2 flex items-stretch self-stretch">
          <BrandLogo />
        </span>
        <span className="col-start-2 row-start-1 leading-tight">Trincadores</span>
        <span className="col-start-2 row-start-2 leading-tight">Mundialistas</span>
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-stretch gap-1.5 uppercase text-[var(--tm-accent)]",
        className,
      )}
    >
      <span className="flex shrink-0 items-stretch self-stretch">
        <BrandLogo />
      </span>
      <span className="flex items-center text-left leading-tight">Trincadores Mundialistas</span>
    </span>
  );
}
