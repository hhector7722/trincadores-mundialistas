"use client";

import { useState } from "react";
import { CalendarGuideModal } from "@/components/predictions/CalendarGuideModal";
import { cn } from "@/lib/utils";

type CalendarGuideAccessProps = {
  className?: string;
};

export function CalendarGuideAccess({ className }: CalendarGuideAccessProps) {
  const [guideOpen, setGuideOpen] = useState(false);

  return (
    <>
      <div className={cn("tm-cal-guide-access shrink-0", className)}>
        <button
          type="button"
          onClick={() => setGuideOpen(true)}
          className="tm-cal-guide-btn"
        >
          Guía calendario
        </button>
      </div>

      <CalendarGuideModal open={guideOpen} onClose={() => setGuideOpen(false)} />
    </>
  );
}
