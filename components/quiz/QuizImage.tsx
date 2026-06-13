import Image from "next/image";
import { cn } from "@/lib/utils";

type QuizImageProps = {
  src: string | null;
  alt: string;
  className?: string;
};

export function QuizImage({ src, alt, className }: QuizImageProps) {
  if (!src) {
    return null;
  }

  return (
    <div
      className={cn(
        "relative aspect-[4/3] w-full overflow-hidden rounded-2xl border border-[var(--tm-border)] bg-[var(--tm-surface)]",
        className
      )}
    >
      <Image src={src} alt={alt} fill className="object-contain" sizes="(max-width: 640px) 100vw, 480px" />
    </div>
  );
}
