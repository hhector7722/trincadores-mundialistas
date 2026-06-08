"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Modal, type ModalPanelSlide } from "@/components/ui/modal";
import {
  SCORING_RULES_MODAL_SECTIONS,
  type ScoringRulesSection,
} from "@/lib/home/scoring-rules-content";
import { cn } from "@/lib/utils";

type ScoringRulesModalProps = {
  open: boolean;
  onClose: () => void;
};

type DotPosition = "start" | "middle" | "end";

type SectionSlideState = {
  targetIndex: number;
  direction: "next" | "prev";
  phase: "prep" | "animate";
};

const SLIDE_MS = 300;
const SECTIONS = SCORING_RULES_MODAL_SECTIONS;

function resolveDotPosition(index: number, total: number): DotPosition {
  if (total <= 1 || index <= 0) return "start";
  if (index >= total - 1) return "end";
  return "middle";
}

function SectionSwipeDots({ position }: { position: DotPosition }) {
  return (
    <div className="flex items-center justify-center gap-1.5 py-1" aria-hidden="true">
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

function SectionPanel({ section }: { section: ScoringRulesSection }) {
  return (
    <div className="px-4 py-3">
      <h3 className="font-display text-sm font-semibold text-[var(--tm-fg)]">{section.title}</h3>
      <ul className="mt-2 space-y-1.5">
        {section.body.map((line) => (
          <li key={line} className="flex gap-2 text-xs leading-relaxed text-[var(--tm-muted)]">
            <span
              className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[var(--tm-accent)]"
              aria-hidden="true"
            />
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ScoringRulesModal({ open, onClose }: ScoringRulesModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [sectionSlide, setSectionSlide] = useState<SectionSlideState | null>(null);
  const slideLockRef = useRef(false);
  const slideTimerRef = useRef<number | null>(null);
  const wasOpenRef = useRef(false);

  const activeSection = SECTIONS[activeIndex] ?? SECTIONS[0];
  const canSwipe = SECTIONS.length > 1;
  const dotPosition = resolveDotPosition(activeIndex, SECTIONS.length);

  const clearSlideTimer = useCallback(() => {
    if (slideTimerRef.current !== null) {
      window.clearTimeout(slideTimerRef.current);
      slideTimerRef.current = null;
    }
  }, []);

  const finishSectionSlide = useCallback(() => {
    clearSlideTimer();
    if (!slideLockRef.current) return;
    slideLockRef.current = false;

    setSectionSlide((current) => {
      if (!current) return null;
      setActiveIndex(current.targetIndex);
      return null;
    });
  }, [clearSlideTimer]);

  const finishSectionSlideRef = useRef(finishSectionSlide);
  finishSectionSlideRef.current = finishSectionSlide;

  useEffect(() => {
    if (!open) {
      wasOpenRef.current = false;
      clearSlideTimer();
      slideLockRef.current = false;
      setSectionSlide(null);
      return;
    }

    if (!wasOpenRef.current) {
      wasOpenRef.current = true;
      setActiveIndex(0);
      setSectionSlide(null);
      slideLockRef.current = false;
    }
  }, [open, clearSlideTimer]);

  useEffect(() => () => clearSlideTimer(), [clearSlideTimer]);

  const startSectionSlide = useCallback(
    (offset: 1 | -1) => {
      if (!canSwipe || slideLockRef.current || sectionSlide) return;

      const nextIndex = activeIndex + offset;
      if (nextIndex < 0 || nextIndex >= SECTIONS.length) return;

      clearSlideTimer();
      slideLockRef.current = true;
      setSectionSlide({
        targetIndex: nextIndex,
        direction: offset === 1 ? "next" : "prev",
        phase: "prep",
      });

      slideTimerRef.current = window.setTimeout(() => {
        finishSectionSlideRef.current();
      }, SLIDE_MS + 80);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setSectionSlide((current) => (current ? { ...current, phase: "animate" } : current));
        });
      });
    },
    [activeIndex, canSwipe, clearSlideTimer, sectionSlide]
  );

  const panelSlide: ModalPanelSlide | null = sectionSlide
    ? {
        direction: sectionSlide.direction,
        phase: sectionSlide.phase,
        incoming: <SectionPanel section={SECTIONS[sectionSlide.targetIndex]!} />,
        onTransitionEnd: () => finishSectionSlideRef.current(),
      }
    : null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={activeSection.title}
      hideTitle
      hideHeaderDivider
      className="max-h-[min(70dvh,22rem)]"
      wrapperClassName="max-w-[min(100vw-2rem,18rem)]"
      onSwipeLeft={canSwipe && !panelSlide ? () => startSectionSlide(1) : undefined}
      onSwipeRight={canSwipe && !panelSlide ? () => startSectionSlide(-1) : undefined}
      belowPanel={canSwipe ? <SectionSwipeDots position={dotPosition} /> : undefined}
      panelSlide={panelSlide}
    >
      <SectionPanel section={activeSection} />
    </Modal>
  );
}
