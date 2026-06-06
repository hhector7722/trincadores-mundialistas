"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import type { GroupStandingDetail } from "@/lib/pool/group-standings";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type GroupStandingsModalProps = {
  open: boolean;
  onClose: () => void;
  groupCode: string | null;
  groups: GroupStandingDetail[];
  onGroupChange?: (groupCode: string) => void;
};

type DotPosition = "start" | "middle" | "end";

type SlideState = {
  target: GroupStandingDetail;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;

const STAT_COLUMNS = [
  { key: "pts", label: "PTS" },
  { key: "pj", label: "PJ" },
  { key: "pg", label: "PG" },
  { key: "pe", label: "PE" },
  { key: "pp", label: "PP" },
  { key: "gf", label: "GF" },
  { key: "gc", label: "GC" },
  { key: "dg", label: "DG" },
] as const;

function formatDg(value: number): string {
  if (value > 0) return `+${value}`;
  return String(value);
}

function resolveDotPosition(index: number, total: number): DotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

function GroupSwipeDots({ position }: { position: DotPosition }) {
  return (
    <div className="flex items-center justify-center gap-1.5" aria-hidden="true">
      {[0, 1, 2].map((dot) => {
        const active =
          (position === "start" && dot === 0) ||
          (position === "middle" && dot === 1) ||
          (position === "end" && dot === 2);

        return (
          <span
            key={dot}
            className={cn(
              "rounded-full transition-all duration-200",
              active ? "h-2 w-2 bg-white" : "h-1.5 w-1.5 bg-white/35"
            )}
          />
        );
      })}
    </div>
  );
}

function GroupStandingsTable({ group }: { group: GroupStandingDetail }) {
  return (
    <div className="overflow-x-auto px-3 pb-4 sm:px-4">
      <table className="w-full min-w-[20rem] border-collapse text-[11px] sm:text-xs">
        <thead>
          <tr className="text-[var(--tm-muted)]">
            <th className="pb-2 pr-2 text-left font-medium">Equipo</th>
            {STAT_COLUMNS.map((col) => (
              <th key={col.key} className="px-0.5 pb-2 text-center font-medium tabular-nums">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {group.teams.map((row, index) => (
            <tr
              key={row.team}
              className={cn(
                "border-t border-[var(--tm-border)]",
                index === 0 && "text-[var(--tm-fg)]"
              )}
            >
              <td className="py-2 pr-2">
                <div className="flex min-w-0 items-center gap-1.5">
                  <TeamFlagBadge name={row.team} size="xs" className="shrink-0" />
                  <span className="truncate font-medium">{teamNameEs(row.team)}</span>
                </div>
              </td>
              <td className="px-0.5 py-2 text-center font-semibold tabular-nums text-[var(--tm-accent)]">
                {row.pts}
              </td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.pj}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.pg}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.pe}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.pp}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.gf}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{row.gc}</td>
              <td className="px-0.5 py-2 text-center tabular-nums">{formatDg(row.dg)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function GroupStandingsModal({
  open,
  onClose,
  groupCode,
  groups,
  onGroupChange,
}: GroupStandingsModalProps) {
  const orderedGroups = useMemo(() => groups, [groups]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [slide, setSlide] = useState<SlideState | null>(null);
  const slideLockRef = useRef(false);
  const slideFinishTimerRef = useRef<number | null>(null);
  const onGroupChangeRef = useRef(onGroupChange);
  const wasOpenRef = useRef(false);

  onGroupChangeRef.current = onGroupChange;

  const viewGroup = orderedGroups[activeIndex] ?? null;
  const canSwipe = orderedGroups.length > 1 && Boolean(onGroupChange);
  const dotPosition = resolveDotPosition(activeIndex, orderedGroups.length);

  const clearSlideFinishTimer = useCallback(() => {
    if (slideFinishTimerRef.current !== null) {
      window.clearTimeout(slideFinishTimerRef.current);
      slideFinishTimerRef.current = null;
    }
  }, []);

  const finishSlide = useCallback(() => {
    clearSlideFinishTimer();
    if (!slideLockRef.current) return;

    slideLockRef.current = false;

    setSlide((current) => {
      if (!current) return null;

      const nextIndex = orderedGroups.findIndex((item) => item.code === current.target.code);
      if (nextIndex >= 0) {
        setActiveIndex(nextIndex);
      }
      onGroupChangeRef.current?.(current.target.code);
      return null;
    });
  }, [clearSlideFinishTimer, orderedGroups]);

  const finishSlideRef = useRef(finishSlide);
  finishSlideRef.current = finishSlide;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearSlideFinishTimer();
      slideLockRef.current = false;
      setSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      const idx = groupCode
        ? orderedGroups.findIndex((item) => item.code === groupCode.toUpperCase())
        : 0;
      setActiveIndex(idx >= 0 ? idx : 0);
      setSlide(null);
      slideLockRef.current = false;
    }
  }, [open, groupCode, orderedGroups, clearSlideFinishTimer]);

  useEffect(() => {
    return () => clearSlideFinishTimer();
  }, [clearSlideFinishTimer]);

  const startSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipe || slideLockRef.current) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= orderedGroups.length) return;

      const target = orderedGroups[nextIndex];
      if (!target) return;

      clearSlideFinishTimer();
      slideLockRef.current = true;

      setSlide({
        target,
        direction: offset === 1 ? "next" : "prev",
        phase: "prep",
      });

      slideFinishTimerRef.current = window.setTimeout(() => {
        finishSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [activeIndex, canSwipe, clearSlideFinishTimer, orderedGroups]
  );

  const handleSlideTransitionEnd = useCallback(() => {
    finishSlideRef.current();
  }, []);

  if (!viewGroup) return null;

  const panelSlide: ModalPanelSlide | null = slide
    ? {
        direction: slide.direction,
        phase: slide.phase,
        incoming: <GroupStandingsTable group={slide.target} />,
        onTransitionEnd: handleSlideTransitionEnd,
      }
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Grupo ${viewGroup.code}`}
      hideHeaderDivider
      backdropClassName="bg-[#2a1058]/40 backdrop-blur-[2px]"
      onSwipeLeft={canSwipe && !slide ? () => startSlide(1) : undefined}
      onSwipeRight={canSwipe && !slide ? () => startSlide(-1) : undefined}
      belowPanel={canSwipe ? <GroupSwipeDots position={dotPosition} /> : undefined}
      panelSlide={panelSlide}
    >
      <GroupStandingsTable group={viewGroup} />
    </Modal>
  );
}
