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

/** Marco táctico del modal de alineación: ancho y alto idénticos al campo cargado. */
export function LineupModalFieldShell({
  children,
  className,
  benchAbove,
}: LineupModalFieldShellProps) {
  return (
    <div className={cn("flex w-full flex-col", className)}>
      <div
        className={cn(
          "flex w-full shrink-0 flex-col items-stretch",
          LINEUP_MODAL_FIELD_WIDTH_CLASS
        )}
        style={{
          transform: `scale(${MODAL_FIELD_WRAPPER_SCALE})`,
          transformOrigin: "top left",
          marginBottom: modalFieldScaleBottomTrim(),
        }}
      >
        {benchAbove ? <div className="mb-1 w-full min-w-0 shrink-0">{benchAbove}</div> : null}
        <div className={cn("relative w-full shrink-0 overflow-visible", PITCH_ASPECT_CLASS)}>
          {children}
        </div>
      </div>
    </div>
  );
}
