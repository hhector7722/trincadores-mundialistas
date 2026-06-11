"use client";

import type { ReactNode } from "react";
import { MatchContextActionButton } from "@/components/lineup/MatchContextActionButton";
import { cn } from "@/lib/utils";

type MatchContextActionsRowProps = {
  onOpenHomeLineup: () => void;
  onOpenAwayLineup: () => void;
  onOpenPossibleLineups: () => void;
  possibleLineupsCaption?: string;
  possibleLineupsConfirmed?: boolean;
  /** Sin etiquetas grises ni borde superior. */
  compact?: boolean;
  /** Alineado a anclas de equipo / centro / equipo (modal, card inicio…). */
  layout?:
    | "grid"
    | "teamAnchors"
    | "predictionModalStacked"
    | "homeCardStacked"
    | "homeCardCompactStacked"
    | "homeCardScheduledStacked";
  /** Centro de la fila superior (p. ej. MVP en card inicio). */
  centerSlot?: ReactNode;
  /** Fila central: pronóstico de marcador (entre MVP y alineaciones). */
  predictionSlot?: ReactNode;
  /** Ancla horizontal de plantilla local (debe coincidir con `MatchTeamsDisplay`). */
  homeAnchor?: string;
  /** Ancla horizontal de plantilla visitante. */
  awayAnchor?: string;
  className?: string;
};

export function MatchContextActionsRow({
  onOpenHomeLineup,
  onOpenAwayLineup,
  onOpenPossibleLineups,
  possibleLineupsCaption = "Posibles alineaciones",
  possibleLineupsConfirmed = false,
  compact = false,
  layout = "grid",
  homeAnchor = "10%",
  awayAnchor = "90%",
  centerSlot,
  predictionSlot,
  className,
}: MatchContextActionsRowProps) {
  if (layout === "homeCardScheduledStacked") {
    return (
      <div className={cn("flex h-full flex-col items-center justify-start gap-1.5", className)}>
        <div className="flex shrink-0 items-center justify-center px-1">{centerSlot}</div>
        <div className="flex shrink-0 items-center justify-center px-1">{predictionSlot}</div>
        <div className="flex shrink-0 items-center justify-center px-1">
          <MatchContextActionButton
            caption={possibleLineupsCaption}
            hideCaption={compact}
            showConfirmedBadge={possibleLineupsConfirmed}
            onClick={onOpenPossibleLineups}
          />
        </div>
      </div>
    );
  }

  if (layout === "homeCardCompactStacked") {
    return (
      <div className={cn("grid h-full grid-rows-3 gap-0", className)}>
        <div className="flex min-h-0 items-center justify-center px-1">{centerSlot}</div>
        <div className="flex min-h-0 items-center justify-center px-1">{predictionSlot}</div>
        <div className="flex min-h-0 items-center justify-center px-1">
          <MatchContextActionButton
            caption={possibleLineupsCaption}
            hideCaption={compact}
            showConfirmedBadge={possibleLineupsConfirmed}
            onClick={onOpenPossibleLineups}
          />
        </div>
      </div>
    );
  }

  if (layout === "homeCardStacked") {
    return (
      <div className={className}>
        <div className="relative h-8 w-full">
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: homeAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenHomeLineup}
            />
          </div>
          <div className="absolute left-1/2 top-0 z-[1] w-max max-w-[44%] -translate-x-1/2 px-1">
            {centerSlot}
          </div>
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: awayAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenAwayLineup}
            />
          </div>
        </div>
        <div className="flex h-8 w-full items-center justify-center px-1">
          <MatchContextActionButton
            caption={possibleLineupsCaption}
            hideCaption={compact}
            showConfirmedBadge={possibleLineupsConfirmed}
            onClick={onOpenPossibleLineups}
          />
        </div>
      </div>
    );
  }

  if (layout === "predictionModalStacked") {
    return (
      <div className={className}>
        <div className="relative min-h-[2rem] w-full">
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: homeAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenHomeLineup}
            />
          </div>
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: awayAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenAwayLineup}
            />
          </div>
        </div>
        <div className="flex min-h-[2rem] w-full items-center justify-center px-1">
          <MatchContextActionButton
            caption={possibleLineupsCaption}
            hideCaption={compact}
            showConfirmedBadge={possibleLineupsConfirmed}
            onClick={onOpenPossibleLineups}
          />
        </div>
      </div>
    );
  }

  if (layout === "teamAnchors") {
    return (
      <div className={className}>
        <div className="relative min-h-[2.75rem] w-full">
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: homeAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenHomeLineup}
            />
          </div>
          <div className="absolute left-1/2 top-0 z-[1] w-max max-w-[44%] -translate-x-1/2 px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: awayAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              onClick={onOpenAwayLineup}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="relative grid min-h-[2.75rem] grid-cols-3 items-start">
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption="Plantilla"
            hideCaption={compact}
            onClick={onOpenHomeLineup}
          />
        </div>
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption={possibleLineupsCaption}
            hideCaption={compact}
            showConfirmedBadge={possibleLineupsConfirmed}
            onClick={onOpenPossibleLineups}
          />
        </div>
        <div className="flex justify-center px-1">
          <MatchContextActionButton
            caption="Plantilla"
            hideCaption={compact}
            onClick={onOpenAwayLineup}
          />
        </div>
      </div>
    </div>
  );
}
