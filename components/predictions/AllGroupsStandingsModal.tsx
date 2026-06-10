"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { GroupStandingsTable } from "@/components/predictions/group-standings-table";
import { Modal } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { cn } from "@/lib/utils";

type GroupStandingsView = "official" | "predictions";

type ViewSlideState = {
  from: 0 | 1;
  to: 0 | 1;
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

function viewToIndex(view: GroupStandingsView): 0 | 1 {
  return view === "official" ? 0 : 1;
}

function indexToView(index: 0 | 1): GroupStandingsView {
  return index === 0 ? "official" : "predictions";
}

function LivePulseIcon() {
  return (
    <span className="relative inline-flex h-2 w-2 shrink-0" aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--tm-danger)] opacity-80" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--tm-danger)]" />
    </span>
  );
}

function GroupStandingsViewToggle({
  value,
  onChange,
}: {
  value: GroupStandingsView;
  onChange: (value: GroupStandingsView) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-[var(--tm-border)] bg-[rgba(111,43,255,0.08)] p-0.5"
      role="tablist"
      aria-label="Fuente de clasificación"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "official"}
        onClick={() => onChange("official")}
        className={cn(
          "inline-flex min-h-7 items-center gap-1 rounded-full px-2 text-[9px] font-semibold uppercase tracking-wide transition-colors",
          value === "official"
            ? "bg-[var(--tm-accent)] text-[#2a1058]"
            : "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
        )}
      >
        <LivePulseIcon />
        Live
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={value === "predictions"}
        onClick={() => onChange("predictions")}
        className={cn(
          "min-h-7 rounded-full px-2.5 text-[9px] font-semibold uppercase tracking-wide transition-colors",
          value === "predictions"
            ? "bg-[var(--tm-accent)] text-[#2a1058]"
            : "text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
        )}
      >
        Pronostico
      </button>
    </div>
  );
}

function ViewSwipeDots({ activeIndex }: { activeIndex: 0 | 1 }) {
  const labels = ["Live", "Pronóstico"] as const;

  return (
    <div
      className="flex items-center justify-center gap-2 py-1"
      role="tablist"
      aria-label="Vista de clasificación"
    >
      {labels.map((label, index) => (
        <span
          key={label}
          role="tab"
          aria-selected={activeIndex === index}
          aria-label={label}
          className={cn(
            "rounded-full transition-all duration-200",
            activeIndex === index ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/35"
          )}
        />
      ))}
    </div>
  );
}

function GroupsGrid({
  groups,
  onSelectGroup,
}: {
  groups: GroupStandingDetail[];
  onSelectGroup: (groupCode: string) => void;
}) {
  return (
    <div className="grid min-h-0 flex-1 auto-rows-auto grid-cols-3 items-stretch gap-2 overflow-y-auto px-2.5 pb-2.5 sm:gap-2.5 sm:px-3 sm:pb-3">
      {groups.map((group) => (
        <button
          key={group.code}
          type="button"
          onClick={() => onSelectGroup(group.code)}
          className={cn(
            "flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border border-[var(--tm-border)]",
            "bg-[rgba(111,43,255,0.12)] text-left transition-colors",
            "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
          )}
        >
          <div className="flex shrink-0 items-center justify-start px-0.5 pb-0.5 pt-1.5 leading-none">
            <span className="text-[7px] font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
              Grupo {group.code}
            </span>
          </div>
          <div className="flex min-h-0 flex-1 flex-col overflow-visible">
            <GroupStandingsTable group={group} variant="grid" />
          </div>
        </button>
      ))}
    </div>
  );
}

type AllGroupsStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  officialGroups: GroupStandingDetail[];
  predictedGroups: GroupStandingDetail[];
  onSelectGroup: (groupCode: string) => void;
};

export function AllGroupsStandingsModal({
  open,
  onClose,
  officialGroups,
  predictedGroups,
  onSelectGroup,
}: AllGroupsStandingsModalProps) {
  const [view, setView] = useState<GroupStandingsView>("official");
  const [viewSlide, setViewSlide] = useState<ViewSlideState | null>(null);
  const viewSlideLockRef = useRef(false);
  const viewSlideTimerRef = useRef<number | null>(null);

  const viewIndex = viewToIndex(view);
  const activeDotIndex = (viewSlide ? viewSlide.to : viewIndex) as 0 | 1;
  const toggleView = indexToView(viewSlide ? viewSlide.to : viewIndex);

  const clearViewSlideTimer = useCallback(() => {
    if (viewSlideTimerRef.current !== null) {
      window.clearTimeout(viewSlideTimerRef.current);
      viewSlideTimerRef.current = null;
    }
  }, []);

  const finishViewSlide = useCallback(() => {
    clearViewSlideTimer();
    if (!viewSlideLockRef.current) return;
    viewSlideLockRef.current = false;

    setViewSlide((current) => {
      if (!current) return null;
      setView(indexToView(current.to));
      return null;
    });
  }, [clearViewSlideTimer]);

  const finishViewSlideRef = useRef(finishViewSlide);
  finishViewSlideRef.current = finishViewSlide;

  useEffect(() => {
    if (!open) {
      clearViewSlideTimer();
      viewSlideLockRef.current = false;
      setViewSlide(null);
      return;
    }
  }, [open, clearViewSlideTimer]);

  useEffect(() => () => clearViewSlideTimer(), [clearViewSlideTimer]);

  const startViewSlide = useCallback(
    (target: GroupStandingsView) => {
      const targetIndex = viewToIndex(target);
      if (viewSlideLockRef.current || viewSlide || targetIndex === viewIndex) return;

      clearViewSlideTimer();
      viewSlideLockRef.current = true;
      setViewSlide({
        from: viewIndex,
        to: targetIndex,
        phase: "prep",
      });

      viewSlideTimerRef.current = window.setTimeout(() => {
        finishViewSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setViewSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [clearViewSlideTimer, viewIndex, viewSlide]
  );

  const slideTranslateIndex = viewSlide
    ? viewSlide.phase === "prep"
      ? viewSlide.from
      : viewSlide.to
    : viewIndex;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Clasificación de grupos"
      hideHeader
      ariaLabel="Clasificación de grupos"
      className="flex max-h-[calc(100dvh-1rem)] flex-col"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      backdropClassName="bg-[#2a1058]/40"
      onSwipeLeft={viewIndex === 0 && !viewSlide ? () => startViewSlide("predictions") : undefined}
      onSwipeRight={viewIndex === 1 && !viewSlide ? () => startViewSlide("official") : undefined}
      belowPanel={<ViewSwipeDots activeIndex={activeDotIndex} />}
    >
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="grid shrink-0 grid-cols-[2.5rem_1fr_2.5rem] items-center gap-2 px-2.5 pb-2 pt-2.5 sm:px-3 sm:pt-3">
          <span aria-hidden="true" />
          <div className="flex justify-center">
            <GroupStandingsViewToggle value={toggleView} onChange={startViewSlide} />
          </div>
          <button
            type="button"
            aria-label="Cerrar modal"
            onClick={onClose}
            className="flex h-10 w-10 shrink-0 items-center justify-center justify-self-end rounded-full text-[var(--tm-muted)] transition-colors hover:bg-[var(--tm-surface-elevated)] hover:text-[var(--tm-fg)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-hidden">
          <div
            className={cn(
              "flex h-full w-[200%]",
              viewSlide?.phase === "animate" && "transform-gpu transition-transform duration-300 ease-in-out",
              slideTranslateIndex === 1 ? "-translate-x-1/2" : "translate-x-0"
            )}
            onTransitionEnd={(event) => {
              if (event.target !== event.currentTarget) return;
              if (event.propertyName !== "transform") return;
              if (viewSlide?.phase !== "animate") return;
              finishViewSlideRef.current();
            }}
          >
            <div className="flex h-full w-1/2 min-h-0 min-w-0 flex-col" aria-hidden={slideTranslateIndex !== 0}>
              <GroupsGrid groups={officialGroups} onSelectGroup={onSelectGroup} />
            </div>
            <div className="flex h-full w-1/2 min-h-0 min-w-0 flex-col" aria-hidden={slideTranslateIndex !== 1}>
              <GroupsGrid groups={predictedGroups} onSelectGroup={onSelectGroup} />
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
