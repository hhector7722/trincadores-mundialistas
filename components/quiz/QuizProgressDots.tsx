import { cn } from "@/lib/utils";

type QuizProgressDotsProps = {
  total: number;
  current: number;
};

export function QuizProgressDots({ total, current }: QuizProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`Pregunta ${current} de ${total}`}>
      {Array.from({ length: total }, (_, index) => {
        const step = index + 1;
        const active = step === current;
        const done = step < current;
        return (
          <span
            key={step}
            className={cn(
              "h-2 rounded-full transition-all",
              active ? "w-6 bg-[var(--tm-accent)]" : done ? "w-2 bg-white/50" : "w-2 bg-white/20"
            )}
          />
        );
      })}
    </div>
  );
}
