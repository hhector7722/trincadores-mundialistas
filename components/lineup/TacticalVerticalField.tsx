"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState<{ w: number; h: number } | null>(null);

  const PITCH_RATIO = 68 / 105;

  useEffect(() => {
    const node = containerRef.current;
    if (!node || widthPx != null || heightPx != null) return;

    function measure() {
      const parent = node!.parentElement;
      if (!parent) return;
      const rect = parent.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return;

      const parentW = rect.width;
      const parentH = rect.height || parentW / PITCH_RATIO;

      let finalW = parentW;
      let finalH = parentW / PITCH_RATIO;
      if (finalH > parentH) {
        finalH = parentH;
        finalW = parentH * PITCH_RATIO;
      }

      setSize({ w: finalW, h: finalH });
    }

    measure();

    const observer = new ResizeObserver(() => measure());
    // Observamos el padre para ver cuánto espacio real tenemos
    const target = node.parentElement || node;
    observer.observe(target);

    return () => observer.disconnect();
  }, [widthPx, heightPx]);

  // Dimensiones finales calculadas
  let finalW = 0;
  let finalH = 0;

  if (widthPx != null && heightPx != null) {
    finalW = widthPx;
    finalH = widthPx / PITCH_RATIO;
    if (finalH > heightPx) {
      finalH = heightPx;
      finalW = heightPx * PITCH_RATIO;
    }
  } else {
    finalW = size?.w ?? 0;
    finalH = size?.h ?? 0;
  }

  // PitchBounds único de referencia absoluto en píxeles
  const pitchBounds = {
    width: finalW,
    height: finalH,
  };

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

  const style = pitchBounds.width > 0 && pitchBounds.height > 0 ? { width: pitchBounds.width, height: pitchBounds.height } : { aspectRatio: "68/105" };

  return (
    <div
      ref={containerRef}
      className={cn("relative overflow-visible", className)}
      style={style}
    >
      <div className="pointer-events-none absolute inset-0 overflow-visible">
        <FootballPitchSurface />
      </div>

      {/* Visual verification indicators in pixels relative to PitchBounds */}
      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: '0px', top: '0px' }} title="Corner 0,0" />
      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: `${pitchBounds.width}px`, top: '0px' }} title="Corner 100,0" />
      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: '0px', top: `${pitchBounds.height}px` }} title="Corner 0,100" />
      <div className="absolute w-2.5 h-2.5 bg-red-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: `${pitchBounds.width}px`, top: `${pitchBounds.height}px` }} title="Corner 100,100" />

      <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: `${pitchBounds.width / 2}px`, top: '0px' }} title="Verification 50,0" />
      <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: `${pitchBounds.width / 2}px`, top: `${pitchBounds.height / 2}px` }} title="Verification 50,50" />
      <div className="absolute w-2.5 h-2.5 bg-blue-600 rounded-full z-50 transform -translate-x-1/2 -translate-y-1/2 border border-white" style={{ left: `${pitchBounds.width / 2}px`, top: `${pitchBounds.height}px` }} title="Verification 50,100" />

      {/* Visitante */}
      {awayResult && awayLineup && (
        <div className="absolute inset-0">
          {(() => {
            console.log("[AUDIT] TacticalVerticalField - Away calculated positions:", awayResult.positions.map(p => ({ id: p.id, x: p.x, y: p.y })));
            return awayResult.positions.map(pos => {
              const originalSlot = resolveVisualLineupSlots(awayLineup).find(s => s.key === pos.id);
              if (!originalSlot) return null;
              
              const pixelX = (pos.x / 100) * pitchBounds.width;
              const pixelY = (pos.y / 100) * pitchBounds.height;

              // Print coordinates received by TacticalVerticalField for this slot
              console.log(`[AUDIT] TacticalVerticalField - Rendering slot ${pos.id} (${originalSlot.name}) at calculated pixels: (${pixelX.toFixed(1)}px, ${pixelY.toFixed(1)}px), slot values: (${originalSlot.x.toFixed(2)}, ${originalSlot.y.toFixed(2)})`);
              
              return (
                <div
                  key={pos.id}
                  className="absolute z-10"
                  style={{
                    left: `${pixelX}px`,
                    top: `${pixelY}px`,
                    transform: `translate(-50%, -50%) scale(${awayResult.chipScale})`,
                  }}
                >
                  {/* Visual debug overlay displaying engine coordinates */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-[9px] font-mono text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/40 shadow z-50 pointer-events-none">
                    {pos.x.toFixed(1)},{pos.y.toFixed(1)}
                  </div>
                  <LineupPlayerChip
                    slot={{
                      ...originalSlot,
                      x: pos.x,
                      y: pos.y
                    }}
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
            });
          })()}
        </div>
      )}

      {/* Local */}
      {homeResult && homeLineup && (
        <div className="absolute inset-0">
          {(() => {
            console.log("[AUDIT] TacticalVerticalField - Home calculated positions:", homeResult.positions.map(p => ({ id: p.id, x: p.x, y: p.y })));
            return homeResult.positions.map(pos => {
              const originalSlot = resolveVisualLineupSlots(homeLineup).find(s => s.key === pos.id);
              if (!originalSlot) return null;
              
              const pixelX = (pos.x / 100) * pitchBounds.width;
              const pixelY = (pos.y / 100) * pitchBounds.height;

              // Print coordinates received by TacticalVerticalField for this slot
              console.log(`[AUDIT] TacticalVerticalField - Rendering slot ${pos.id} (${originalSlot.name}) at calculated pixels: (${pixelX.toFixed(1)}px, ${pixelY.toFixed(1)}px), slot values: (${originalSlot.x.toFixed(2)}, ${originalSlot.y.toFixed(2)})`);
              
              return (
                <div
                  key={pos.id}
                  className="absolute z-10"
                  style={{
                    left: `${pixelX}px`,
                    top: `${pixelY}px`,
                    transform: `translate(-50%, -50%) scale(${homeResult.chipScale})`,
                  }}
                >
                  {/* Visual debug overlay displaying engine coordinates */}
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black/85 text-[9px] font-mono text-cyan-400 px-1 py-0.5 rounded border border-cyan-500/40 shadow z-50 pointer-events-none">
                    {pos.x.toFixed(1)},{pos.y.toFixed(1)}
                  </div>
                  <LineupPlayerChip
                    slot={{
                      ...originalSlot,
                      x: pos.x,
                      y: pos.y
                    }}
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
            });
          })()}
        </div>
      )}
    </div>
  );
}
