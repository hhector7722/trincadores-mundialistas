import Image from "next/image";
import { cn } from "@/lib/utils";

type QuizImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function QuizImage({ src, alt, className }: QuizImageProps) {
  if (!src) {
    return (
      <div
        className={cn(
          "tm-quiz-image-fallback flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)]",
          className
        )}
      >
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--tm-muted)]">
          Mundial
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)]",
        className
      )}
    >
      <Image src={src} alt={alt} fill className="object-cover" sizes="(max-width: 640px) 100vw, 480px" />
    </div>
  );
}
