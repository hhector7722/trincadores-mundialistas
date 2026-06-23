"use client";

import { usePathname } from "next/navigation";
import { useQuizBonusActive, quizBonusStore } from "@/components/ranking/quiz-bonus-store";
import { trackUsageQuizBonusToggle } from "@/lib/usage/client";
import { cn } from "@/lib/utils";

export function QuizBonusToggle({ className }: { className?: string }) {
  const active = useQuizBonusActive();
  const pathname = usePathname();

  const handleToggle = () => {
    quizBonusStore.toggle();
    trackUsageQuizBonusToggle(!active, pathname);
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={handleToggle}
      className={cn(
        "flex h-5 w-8 shrink-0 items-center justify-center transition-opacity hover:opacity-80 active:opacity-60",
        className
      )}
    >
      <span
        className={cn(
          "relative flex items-center h-4 w-[1.75rem] rounded-full transition-colors duration-200 ease-in-out",
          active ? "bg-[#34C759] border border-[#34C759]" : "bg-transparent border border-white/40"
        )}
      >
        <span
          className={cn(
            "block h-3 w-3 rounded-full shadow-sm transition-transform duration-200 ease-in-out",
            active ? "translate-x-[14px] bg-white" : "translate-x-[1px] bg-white/60"
          )}
          aria-hidden="true"
        />
      </span>
    </button>
  );
}
