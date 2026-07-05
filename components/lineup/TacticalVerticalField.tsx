"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { LayoutEngine, LayoutConstraints, LayoutElementInput, LayoutResult, LayoutPosition } from "@/lib/lineup/tactical-layout-engine";
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
 * Post-process para formaciones 4-2-3-1: garantiza que la distancia vertical
 * entre ST y AM sea mayor que la distancia entre AM y el doble pivote (LDM/RDM),
 * creando tres alturas ofensivas claramente diferenciadas.
 * Solo aplica en el modal comparativo; la vista individual no lo usa.
 */
function apply4231VerticalSeparation(
  result: LayoutResult,
  isAwayHalf: boolean
): LayoutResult {
  const positions = result.positions;
  const st = positions.find(p => p.id === "ST");
  const am = positions.find(p => p.id === "AM");
  if (!st || !am) return result;

  const ldm = positions.find(p => p.id === "LDM") || positions.find(p => p.id === "LCM") || positions.find(p => p.id === "DM");
  const rdm = positions.find(p => p.id === "RDM") || positions.find(p => p.id === "RCM") || positions.find(p => p.id === "DM");
  if (!ldm && !rdm) return result;

  const pivots = [ldm, rdm].filter((p): p is LayoutPosition => p != null);
  const pivotY = pivots.reduce((acc, p) => acc + p.y, 0) / pivots.length;

  const distST_AM = Math.abs(st.y - am.y);
  const distAM_pivot = Math.abs(am.y - pivotY);

  const targetGap = distAM_pivot + 2.5;
  if (distST_AM < targetGap) {
    const diff = targetGap - distST_AM;
    if (isAwayHalf) {
      st.y += diff * 0.4;
      am.y -= diff * 0.6;
    } else {
      st.y -= diff * 0.4;
      am.y += diff * 0.6;
    }
  }

  return result;
}

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
  const result = LayoutEngine.calculate(inputs, { ...BASE_HALF_CONSTRAINTS, fieldBounds });
  return apply4231VerticalSeparation(result, fieldBounds.isAwayHalf);
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

      {/* Visitante */}
      {awayResult && awayLineup && (
        <div className="absolute inset-0">
          {awayResult.positions.map(pos => {
            const originalSlot = resolveVisualLineupSlots(awayLineup).find(s => s.key === pos.id);
            if (!originalSlot) return null;
            
            const pixelX = (pos.x / 100) * pitchBounds.width;
            const pixelY = (pos.y / 100) * pitchBounds.height;

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
          })}
        </div>
      )}

      {/* Local */}
      {homeResult && homeLineup && (
        <div className="absolute inset-0">
          {homeResult.positions.map(pos => {
            const originalSlot = resolveVisualLineupSlots(homeLineup).find(s => s.key === pos.id);
            if (!originalSlot) return null;
            
            const pixelX = (pos.x / 100) * pitchBounds.width;
            const pixelY = (pos.y / 100) * pitchBounds.height;

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
          })}
        </div>
      )}
    </div>
  );
}
