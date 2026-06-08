"use client";

import { useRef } from "react";
import { useLayoutAboveTabBar } from "@/components/layout/useLayoutAboveTabBar";
import { cn } from "@/lib/utils";

type QuizPageShellProps = {
  children: React.ReactNode;
  /** scroll: result; hub: bloque centrado verticalmente; play: viewport a pantalla completa */
  variant?: "scroll" | "hub" | "play" | "viewport";
  className?: string;
};

export function QuizPageShell({
  children,
  variant = "scroll",
  className,
}: QuizPageShellProps) {
  const ref = useRef<HTMLDivElement>(null);
  const syncViewport =
    variant === "hub" || variant === "play" || variant === "viewport";
  useLayoutAboveTabBar(ref, syncViewport);

  return (
    <div
      ref={ref}
      className={cn(
        "tm-quiz-page space-y-4",
        variant === "play" ? "tm-quiz-page--play px-4 pb-4 pt-0" : "",
        variant === "hub" && "tm-quiz-page--hub px-4 pb-4 pt-0",
        variant === "viewport" && "tm-quiz-page--viewport",
        variant === "scroll" && "p-4",
        className
      )}
    >
      {children}
    </div>
  );
}
