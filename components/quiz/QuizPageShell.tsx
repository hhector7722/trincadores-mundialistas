import { cn } from "@/lib/utils";

type QuizPageShellProps = {
  children: React.ReactNode;
  /** scroll: hub/result; play: viewport con zona táctil sobre TabBar */
  variant?: "scroll" | "play" | "viewport";
  className?: string;
};

export function QuizPageShell({
  children,
  variant = "scroll",
  className,
}: QuizPageShellProps) {
  return (
    <div
      className={cn(
        "tm-quiz-page space-y-4 p-4",
        variant === "play" && "tm-quiz-page--play",
        variant === "viewport" && "tm-quiz-page--viewport",
        className
      )}
    >
      {children}
    </div>
  );
}
