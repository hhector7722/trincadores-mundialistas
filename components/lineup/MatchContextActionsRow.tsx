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
    | "homeCardScheduledStacked"
    | "predictionModalLiveStacked";
  /** Centro de la fila superior (p. ej. MVP en card inicio). */
  centerSlot?: ReactNode;
  /** Fila central: pronóstico de marcador (entre MVP y alineaciones). */
  predictionSlot?: ReactNode;
  /** Fila inferior opcional (p. ej. MVP en último partido). */
  bottomSlot?: ReactNode;
  /** Ancla horizontal de plantilla local (debe coincidir con `MatchTeamsDisplay`). */
  homeAnchor?: string;
  /** Ancla horizontal de plantilla visitante. */
  awayAnchor?: string;
  /** Oculta el botón de posibles / confirmadas alineaciones (p. ej. partido finalizado). */
  hidePossibleLineups?: boolean;
  /** Oculta los botones «Plantilla» laterales (p. ej. cuando hay goleadores bajo el nombre). */
  hideLineupButtons?: boolean;
  /** `muted` = plantilla como enlace secundario (modal detalle). */
  lineupActionTone?: "accent" | "muted";
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
  bottomSlot,
  hidePossibleLineups = false,
  hideLineupButtons = false,
  lineupActionTone = "accent",
  className,
}: MatchContextActionsRowProps) {
  if (layout === "homeCardScheduledStacked") {
    return (
      <div
        className={cn(
          "pointer-events-none flex h-full w-full flex-col items-stretch justify-evenly gap-0 leading-none",
          className,
        )}
      >
        <div className="pointer-events-auto flex h-max w-full shrink-0 items-center justify-center">
          {centerSlot}
        </div>
        {predictionSlot ? (
          <div className="pointer-events-auto flex w-full shrink-0 items-center justify-center">
            {predictionSlot}
          </div>
        ) : null}
        {bottomSlot ? (
          <div className="pointer-events-auto flex w-full shrink-0 items-center justify-center">
            {bottomSlot}
          </div>
        ) : hidePossibleLineups ? null : (
          <div className="pointer-events-auto flex shrink-0 items-center justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
      </div>
    );
  }

  if (layout === "predictionModalLiveStacked") {
    return (
      <div className={cn("flex h-full w-full flex-col items-stretch justify-center gap-3 leading-none", className)}>
        {centerSlot ? (
          <div className="flex w-full items-center justify-center px-1">{centerSlot}</div>
        ) : null}
        {hidePossibleLineups ? null : (
          <div className="flex w-full items-center justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              tone={lineupActionTone}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
      </div>
    );
  }

  if (layout === "homeCardCompactStacked") {
    return (
      <div className={cn("flex h-full flex-col items-center justify-start gap-1", className)}>
        <div className="flex shrink-0 items-center justify-center px-1">{centerSlot}</div>
        <div className="flex shrink-0 items-center justify-center px-1">{predictionSlot}</div>
        {hidePossibleLineups ? null : (
          <div className="flex shrink-0 items-center justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
      </div>
    );
  }

  if (layout === "homeCardStacked") {
    return (
      <div className={className}>
        <div className={cn("relative w-full", hideLineupButtons ? "min-h-0" : "h-8")}>
          {hideLineupButtons ? null : (
            <>
              <div
                className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
                style={{ left: homeAnchor }}
              >
                <MatchContextActionButton
                  caption="Plantilla"
                  hideCaption={compact}
                  tone={lineupActionTone}
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
                  tone={lineupActionTone}
                  onClick={onOpenAwayLineup}
                />
              </div>
            </>
          )}
          <div className="absolute left-1/2 top-0 z-[1] w-max max-w-[44%] -translate-x-1/2 px-1">
            {centerSlot}
          </div>
        </div>
        {hidePossibleLineups ? null : (
          <div className="flex h-8 w-full items-center justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
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
              tone={lineupActionTone}
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
              tone={lineupActionTone}
              onClick={onOpenAwayLineup}
            />
          </div>
        </div>
        {hidePossibleLineups ? null : (
          <div className="flex min-h-[2rem] w-full items-center justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
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
              tone={lineupActionTone}
              onClick={onOpenHomeLineup}
            />
          </div>
          {hidePossibleLineups ? null : (
            <div className="absolute left-1/2 top-0 z-[1] w-max max-w-[44%] -translate-x-1/2 px-1">
              <MatchContextActionButton
                caption={possibleLineupsCaption}
                hideCaption={compact}
                showConfirmedBadge={possibleLineupsConfirmed}
                onClick={onOpenPossibleLineups}
              />
            </div>
          )}
          <div
            className="absolute top-0 z-[2] w-max max-w-[38%] -translate-x-1/2"
            style={{ left: awayAnchor }}
          >
            <MatchContextActionButton
              caption="Plantilla"
              hideCaption={compact}
              tone={lineupActionTone}
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
        {hidePossibleLineups ? (
          <div className="flex justify-center px-1" />
        ) : (
          <div className="flex justify-center px-1">
            <MatchContextActionButton
              caption={possibleLineupsCaption}
              hideCaption={compact}
              showConfirmedBadge={possibleLineupsConfirmed}
              onClick={onOpenPossibleLineups}
            />
          </div>
        )}
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
