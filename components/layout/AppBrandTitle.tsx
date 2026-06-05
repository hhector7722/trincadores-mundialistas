import { cn } from "@/lib/utils";

export function AppBrandTitle({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-stretch gap-1.5 uppercase text-[var(--tm-accent)]",
        className,
      )}
    >
      <span className="flex shrink-0 items-stretch">
        {/* img nativo: h-full fiable frente al bloque de texto (next/image fija dimensiones) */}
        <img
          src="/icons/logo.png"
          alt=""
          className="aspect-square h-full w-auto min-h-[1em] rounded-[0.12em] object-cover"
          aria-hidden
        />
      </span>
      <span className="flex items-center text-left leading-tight">Trincadores Mundialistas</span>
    </span>
  );
}
