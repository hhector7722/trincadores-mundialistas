import { cn } from "@/lib/utils";

type SubstitutionMarkerIconProps = {
  kind: "in" | "out";
  className?: string;
};

export function SubstitutionMarkerIcon({ kind, className }: SubstitutionMarkerIconProps) {
  const up = kind === "in";

  return (
    <span
      className={cn(
        "inline-flex h-2 w-2 shrink-0 items-center justify-center",
        className,
      )}
      aria-hidden
    >
      <span
        className={cn(
          "h-0 w-0 border-x-[4px] border-x-transparent",
          up
            ? "border-b-[6px] border-b-emerald-400"
            : "border-t-[6px] border-t-red-500",
        )}
      />
    </span>
  );
}
