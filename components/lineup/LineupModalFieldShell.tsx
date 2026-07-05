"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LineupModalFieldShellProps = {
  children: ReactNode;
  className?: string;
  benchAbove?: ReactNode;
};

export function LineupModalFieldShell({ children, className, benchAbove }: LineupModalFieldShellProps) {
  return (
    <div className={cn("mx-auto flex w-full max-w-[500px] flex-col items-center pb-2", className)}>
      {benchAbove ? <div className="mb-2 w-full min-w-0 shrink-0">{benchAbove}</div> : null}
      {children}
    </div>
  );
}
