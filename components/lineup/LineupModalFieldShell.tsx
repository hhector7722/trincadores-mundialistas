"use client";

import type { ReactNode } from "react";
import { PITCH_ASPECT_CLASS } from "@/lib/lineup/field-layout";
import { LINEUP_MODAL_FIELD_WIDTH_CLASS } from "@/lib/lineup/field-asset";
import {
  MODAL_FIELD_WRAPPER_SCALE,
  modalFieldScaleBottomTrim,
} from "@/lib/lineup/modal-field-scale";
import { cn } from "@/lib/utils";

type LineupModalFieldShellProps = {
  children: ReactNode;
  className?: string;
  benchAbove?: ReactNode;
};

export function LineupModalFieldShell({
  children,
  className,
  benchAbove,
}: LineupModalFieldShellProps) {
  return (
    <div className={cn("flex w-full flex-1 flex-col items-center", className)}>
      <div className="flex w-full max-w-md flex-1 shrink-0 flex-col items-stretch">
        {benchAbove ? <div className="mb-1 w-full min-w-0 shrink-0">{benchAbove}</div> : null}
        <div className="relative flex-1 w-full shrink-0 overflow-visible">
          {children}
        </div>
      </div>
    </div>
  );
}
