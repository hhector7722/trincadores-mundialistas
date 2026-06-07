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
};

export type FieldCoordinate = { x: number; y: number };

export type LineupSlot = LineupPlayer & FieldCoordinate;

export type ProbableXIResult = {
  formation: FormationId;
  slots: LineupSlot[];
  benchCount: number;
  isProbable: boolean;
};
