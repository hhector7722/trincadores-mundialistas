/**
 * Tipos fundamentales del Tactical Layout Engine.
 * Esta librería está completamente desacoplada de React, SVG, y proveedores de datos.
 */

export type LayoutOptimizationMode =
  | "balanced"
  | "maximumScale"
  | "compact"
  | "mobile"
  | "tablet"
  | "broadcast"
  | (string & {}); // Permite expansión futura sin romper el tipado

export type LayoutConstraints = {
  margins: { side: number; vertical: number };
  spacing: { minHorizontal: number; minVertical: number };
  chipSize: { minScale: number; maxScale: number; baseWidth: number; baseHeight: number };
  nameAreaBounds: { width: number; height: number };
  optimization: { mode: LayoutOptimizationMode; maxIterations: number; tolerance: number };
  fieldBounds: { xMin: number; xMax: number; yMin: number; yMax: number; isAwayHalf: boolean };
};

/** Representa la entrada abstracta de un elemento a posicionar (jugador, avatar, etc.) */
export type LayoutElementInput = {
  id: string;
  role: string;
  /** Coordenada teórica de referencia en X (ej. 0 a 100, donde 0 es izquierda) */
  referenceX: number;
  /** Coordenada teórica de referencia en Y (ej. 0 a 100, donde 0 es rival, 100 es portería propia) */
  referenceY: number;
};

/** Salida geométrica para cada elemento */
export type LayoutPosition = {
  id: string;
  x: number; // Porcentaje final (0-100) del contenedor (ej. 50 es el centro)
  y: number; // Porcentaje final (0-100) del contenedor
};

export type TacticalBand = {
  id: string;
  depthOrder: number; // Orden de profundidad
  elements: string[]; // IDs de los elementos en esta banda, ordenados por x de izquierda a derecha
};

export type LayoutMetrics = {
  chipScale: number;
  fieldCoverage: number;
  usefulSpacePercentage: number;
  wastedSpace: number;
  symmetryScore: number;
  horizontalDeviation: number;
  verticalDeviation: number;
  tacticalDeviation: number;
  minimumElementDistance: number;
  minimumNameDistance: number;
  iterations: number;
  adjustmentsMade: number;
  collisionsResolved: number;
  stopReason: string;
};

export type LayoutDebug = {
  detectedBands: TacticalBand[];
  detectedLanes: Record<string, string[]>;
  attemptedLayouts: number;
  rejectedLayouts: number;
  optimizationStageReached: string;
  activeConstraints: string[];
  optimizationSequence: string[];
  collisionBoxes: any[];
  stopReason: string;
  warnings: string[];
};

export type LayoutResult = {
  positions: LayoutPosition[];
  bands: TacticalBand[];
  chipScale: number;
  calculatedMargins: { side: number; vertical: number };
  metrics: LayoutMetrics;
  debug?: LayoutDebug;
};
