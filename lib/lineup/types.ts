export type PositionRole = "GK" | "DF" | "MF" | "FW";

export type FormationId = "4-3-3" | "4-4-2";

export type LineupPlayerInput = {
  player_name: string;
  position: string | null;
  shirt_number: number | null;
};

export type LineupPlayer = {
  key: string;
  name: string;
  shirtNumber: number | null;
  positionLabel: string;
  role: PositionRole;
  isPlaceholder: boolean;
  /** Clave táctica de plantilla (GK, LB, CM…) para relayout consistente entre equipos. */
  slotKey?: string;
};

export type FieldCoordinate = { x: number; y: number };

export type LineupSlot = LineupPlayer & FieldCoordinate;

export type ProbableXIResult = {
  formation: FormationId;
  slots: LineupSlot[];
  benchCount: number;
  isProbable: boolean;
};

/** Origen de la alineación, en orden de prioridad: confirmed > predicted > fallback. */
export type LineupSourceKind = "confirmed" | "predicted" | "fallback";

export type ResolvedLineup = ProbableXIResult & {
  /** Etiqueta táctica para UI (p. ej. "4-3-3" o "4-2-3-1" de fuente externa). */
  formationLabel: string;
  sourceKind: LineupSourceKind;
  dataSourceCode: string | null;
  fetchedAt: string | null;
  /** Suplentes cuando la fuente externa los aporta; si no, se derivan de la plantilla. */
  bench?: LineupBenchPlayer[];
};

export type StoredLineupRow = {
  match_id: string;
  team_name: string;
  source_kind: LineupSourceKind;
  data_source_code: string | null;
  formation: string;
  slots: LineupSlot[];
  bench: LineupBenchPlayer[];
  fetched_at: string | null;
  updated_at: string;
};

export type LineupBenchPlayer = {
  key: string;
  name: string;
  shirtNumber: number | null;
  position: string | null;
};

export type LineupResolveContext = {
  matchId?: string;
  teamName: string;
  players: LineupPlayerInput[];
  formationOverride?: FormationId;
};
