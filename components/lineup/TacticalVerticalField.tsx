"use client";

import { useMemo } from "react";
import { LayoutEngine, LayoutConstraints, LayoutElementInput } from "@/lib/lineup/tactical-layout-engine";
import { FootballPitchSurface } from "@/components/lineup/FootballPitchSurface";
import { LineupPlayerChip } from "@/components/lineup/LineupPlayerChip";
import { type ResolvedLineup } from "@/lib/lineup/types";
import { resolveVisualLineupSlots } from "@/lib/lineup/visual-lineup-slots";
import { mvpSelectionKey, mvpPlayersMatch } from "@/lib/lineup/mvp-selection-key";
import { substitutionMarkerForPlayer } from "@/lib/live/substitution-markers";
import { cn } from "@/lib/utils";

type TacticalVerticalFieldProps = {
  homeLineup: ResolvedLineup | null;
  awayLineup: ResolvedLineup | null;
  homeTeam: string;
  awayTeam: string;
  homeSquadPlayerNames?: string[];
  awaySquadPlayerNames?: string[];
  className?: string;
  widthPx?: number;
  heightPx?: number;
  selectedKey?: string | null;
  selectedPlayer?: any;
  disabled?: boolean;
  readOnly?: boolean;
  onSelect?: (key: string) => void;
  homeSubstitutionMarkers?: any;
  awaySubstitutionMarkers?: any;
};

/* ------------------------------------------------------------------ */
/*  Constantes de layout — CADA MITAD ES UN CANVAS INDEPENDIENTE      */
/*  El motor nunca mezcla los 22 jugadores en un mismo espacio.       */
/*  Primero se optimiza el visitante (mitad superior),                */
/*  luego el local (mitad inferior), y al final se superponen.        */
/* ------------------------------------------------------------------ */

/** Márgenes compartidos por ambas mitades. */
const HALF_MARGINS = { side: 0.5, vertical: 0.25 };

const BASE_HALF_CONSTRAINTS: Omit<LayoutConstraints, "fieldBounds"> = {
  margins: HALF_MARGINS,
  spacing: { minHorizontal: 5, minVertical: 5 },
  chipSize: { minScale: 0.6, maxScale: 1.4, baseWidth: 10, baseHeight: 12 },
  nameAreaBounds: { width: 16, height: 4 },
  optimization: { mode: "balanced", maxIterations: 50, tolerance: 0.02 },
};

/**
 * Optimiza una mitad del campo de forma completamente aislada.
 * @param lineup     Alineación del equipo
 * @param fieldBounds  Porción del campo que ocupa esta mitad
 */
function solveHalf(lineup: ResolvedLineup | null, fieldBounds: LayoutConstraints["fieldBounds"]) {
  if (!lineup) return null;
  const slots = resolveVisualLineupSlots(lineup);
  const inputs: LayoutElementInput[] = slots.map(s => ({
    id: s.key,
    role: s.role,
    referenceX: s.x,
    referenceY: s.y,
  }));
  return LayoutEngine.calculate(inputs, { ...BASE_HALF_CONSTRAINTS, fieldBounds });
}

export function TacticalVerticalField({
  homeLineup,
  awayLineup,
  homeTeam,
  awayTeam,
  homeSquadPlayerNames,
  awaySquadPlayerNames,
  className,
  widthPx,
  heightPx,
  selectedKey,
  selectedPlayer,
  disabled,
  readOnly,
  onSelect,
  homeSubstitutionMarkers,
  awaySubstitutionMarkers,
}: TacticalVerticalFieldProps) {
  
  // ── Optimización independiente: visitante (mitad superior, ataca hacia abajo) ──
  const awayResult = useMemo(
    () => solveHalf(awayLineup, { xMin: 0, xMax: 100, yMin: 0, yMax: 50, isAwayHalf: true }),
    [awayLineup]
  );

  // ── Optimización independiente: local (mitad inferior, ataca hacia arriba) ──
  const homeResult = useMemo(
    () => solveHalf(homeLineup, { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false }),
    [homeLineup]
  );

  const sized = widthPx != null && heightPx != null && widthPx > 0 && heightPx > 0;
  const vbWidth = 100;
  const vbHeight = sized ? Math.round((100 * heightPx) / widthPx) : 150;
  
  return (
    <div
      className={cn("relative w-full overflow-visible", className)}
      style={sized ? { width: widthPx, height: heightPx } : { aspectRatio: "2/3" }}
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        <FootballPitchSurface vbWidth={vbWidth} vbHeight={vbHeight} />
      </div>
      
      {/* Visitante */}
      {awayResult && awayLineup && (
        <div className="absolute inset-0">
          {awayResult.positions.map(pos => {
            const originalSlot = resolveVisualLineupSlots(awayLineup).find(s => s.key === pos.id);
            if (!originalSlot) return null;
            return (
              <div
                key={pos.id}
                className="absolute z-10"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${awayResult.chipScale})`,
                }}
              >
                <LineupPlayerChip
                  slot={originalSlot}
                  teamName={awayTeam}
                  squadPlayerNames={awaySquadPlayerNames}
                  variant="default"
                  onClick={
                    onSelect && !originalSlot.isPlaceholder && !disabled
                      ? () =>
                          onSelect(
                            mvpSelectionKey(awayTeam, {
                              name: originalSlot.name,
                              shirtNumber: originalSlot.shirtNumber,
                            })
                          )
                      : undefined
                  }
                  selected={
                    selectedPlayer
                      ? mvpPlayersMatch(awayTeam, originalSlot, selectedPlayer)
                      : selectedKey ===
                        mvpSelectionKey(awayTeam, {
                          name: originalSlot.name,
                          shirtNumber: originalSlot.shirtNumber,
                        })
                  }
                  disabled={disabled}
                  substitutionMarker={
                    awaySubstitutionMarkers
                      ? substitutionMarkerForPlayer(
                          originalSlot.name,
                          originalSlot.shirtNumber,
                          awaySubstitutionMarkers
                        )
                      : null
                  }
                  stickerUrl={selectedPlayer?.sticker_url ?? null}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Local */}
      {homeResult && homeLineup && (
        <div className="absolute inset-0">
          {homeResult.positions.map(pos => {
            const originalSlot = resolveVisualLineupSlots(homeLineup).find(s => s.key === pos.id);
            if (!originalSlot) return null;
            return (
              <div
                key={pos.id}
                className="absolute z-10"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`, // y is relative to the half because of the top-1/2 wrapper? No, the LayoutEngine calculates Y as 0-100 of its bounding box.
                  transform: `translate(-50%, -50%) scale(${homeResult.chipScale})`,
                }}
              >
                <LineupPlayerChip
                  slot={originalSlot}
                  teamName={homeTeam}
                  squadPlayerNames={homeSquadPlayerNames}
                  variant="default"
                  onClick={
                    onSelect && !originalSlot.isPlaceholder && !disabled
                      ? () =>
                          onSelect(
                            mvpSelectionKey(homeTeam, {
                              name: originalSlot.name,
                              shirtNumber: originalSlot.shirtNumber,
                            })
                          )
                      : undefined
                  }
                  selected={
                    selectedPlayer
                      ? mvpPlayersMatch(homeTeam, originalSlot, selectedPlayer)
                      : selectedKey ===
                        mvpSelectionKey(homeTeam, {
                          name: originalSlot.name,
                          shirtNumber: originalSlot.shirtNumber,
                        })
                  }
                  disabled={disabled}
                  substitutionMarker={
                    homeSubstitutionMarkers
                      ? substitutionMarkerForPlayer(
                          originalSlot.name,
                          originalSlot.shirtNumber,
                          homeSubstitutionMarkers
                        )
                      : null
                  }
                  stickerUrl={selectedPlayer?.sticker_url ?? null}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
