import Image from "next/image";
import { cn } from "@/lib/utils";

type QuizImageProps = {
  src: string | null;
  alt: string;
  className?: string;
  /** La imagen se adapta al alto del contenedor (play sin scroll). */
  fitContainer?: boolean;
};

export function QuizImage({ src, alt, className, fitContainer = false }: QuizImageProps) {
  if (!src) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)]",
        fitContainer ? "h-full min-h-0" : "aspect-[4/3]",
        className
      )}
    >
      <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 640px) 100vw, 480px" />
    </div>
  );
}
