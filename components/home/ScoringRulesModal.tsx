"use client";

import { Modal } from "@/components/ui/modal";
import { SCORING_RULES_MODAL_SECTIONS } from "@/lib/home/scoring-rules-content";

type ScoringRulesModalProps = {
  open: boolean;
  onClose: () => void;
};

export function ScoringRulesModal({ open, onClose }: ScoringRulesModalProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Normas de puntuación"
      headerTitleAlign="left"
      className="max-h-[calc(100dvh-1rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,28rem)]"
    >
      <div className="space-y-4 px-4 py-3">
        {SCORING_RULES_MODAL_SECTIONS.map((section) => (
          <section key={section.id} aria-labelledby={`scoring-rule-${section.id}`}>
            <h3
              id={`scoring-rule-${section.id}`}
              className="font-display text-sm font-semibold text-[var(--tm-fg)]"
            >
              {section.title}
            </h3>
            <ul className="mt-2 space-y-1.5">
              {section.body.map((line) => (
                <li
                  key={line}
                  className="flex gap-2 text-sm leading-relaxed text-[var(--tm-muted)]"
                >
                  <span
                    className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[var(--tm-accent)]"
                    aria-hidden="true"
                  />
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </Modal>
  );
}
