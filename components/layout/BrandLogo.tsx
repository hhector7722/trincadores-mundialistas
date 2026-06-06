import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
};

export function BrandLogo({ className }: BrandLogoProps) {
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

export function BrandLogoFixed() {
  return (
    <BrandLogo className="fixed left-3 top-[max(0.5rem,env(safe-area-inset-top))] z-30 size-8 rounded-md sm:left-4 sm:size-9" />
  );
}
