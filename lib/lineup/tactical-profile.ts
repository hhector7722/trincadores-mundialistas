import profiles from "@/data/lineup/wc2026-tactical-profiles.json";

export type TacticalSlot =
  | "GK"
  | "LB"
  | "RB"
  | "LWB"
  | "RWB"
  | "CB"
  | "DM"
  | "CM"
  | "LM"
  | "RM"
  | "AM"
  | "LW"
  | "RW"
  | "ST"
  | "CF"
  | "SS";

const DEFENSIVE_SIDE_SLOTS = new Set<TacticalSlot>(["LB", "RB", "LWB", "RWB"]);
const CENTER_BACK_SLOTS = new Set<TacticalSlot>(["CB"]);
const STRIKER_SLOTS = new Set<TacticalSlot>(["ST", "CF"]);
const WING_SLOTS = new Set<TacticalSlot>(["LW", "RW"]);
const ATTACKING_MID_SLOTS = new Set<TacticalSlot>(["AM", "SS"]);

/** Clave usada en `data/lineup/wc2026-tactical-profiles.json`. */
export function tacticalProfileKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function normalizeTacticalSlot(raw: string | null | undefined): TacticalSlot | null {
  const value = (raw ?? "").trim().toUpperCase();
  if (!value) return null;

  const map: Record<string, TacticalSlot> = {
    GK: "GK",
    G: "GK",
    GOALKEEPER: "GK",
    LB: "LB",
    RB: "RB",
    LWB: "LWB",
    RWB: "RWB",
    CB: "CB",
    DFC: "CB",
    DM: "DM",
    CDM: "DM",
    CM: "CM",
    LM: "LM",
    RM: "RM",
    AM: "AM",
    CAM: "AM",
    LW: "LW",
    RW: "RW",
    ST: "ST",
    CF: "CF",
    SS: "SS",
  };

  if (map[value]) return map[value]!;

  if (value.includes("LEFT") && value.includes("BACK")) return "LB";
  if (value.includes("RIGHT") && value.includes("BACK")) return "RB";
  if (value.includes("CENTRE") && value.includes("BACK")) return "CB";
  if (value.includes("CENTER") && value.includes("BACK")) return "CB";

  return null;
}

export function lookupTacticalProfile(playerName: string): TacticalSlot | null {
  const key = tacticalProfileKey(playerName);
  const hit = (profiles as Record<string, TacticalSlot>)[key];
  return hit ?? null;
}

export function resolveTacticalProfile(
  playerName: string,
  squadPosition: string | null | undefined
): TacticalSlot | null {
  return lookupTacticalProfile(playerName) ?? normalizeTacticalSlot(squadPosition);
}

function isDefensiveSlot(slot: string): boolean {
  const key = slot.trim().toUpperCase();
  return (
    key === "DF" ||
    key === "D" ||
    DEFENSIVE_SIDE_SLOTS.has(key as TacticalSlot) ||
    CENTER_BACK_SLOTS.has(key as TacticalSlot)
  );
}

function isAttackingSlot(slot: string): boolean {
  const key = slot.trim().toUpperCase();
  return (
    key === "FW" ||
    key === "F" ||
    STRIKER_SLOTS.has(key as TacticalSlot) ||
    WING_SLOTS.has(key as TacticalSlot) ||
    ATTACKING_MID_SLOTS.has(key as TacticalSlot)
  );
}

/**
 * Corrige slots BSD cuando chocan con el perfil táctico del jugador
 * (p. ej. Laporte CB mal colocado como RB, Porro RB como CB).
 */
export function refinePredictedSlotKey(
  playerName: string,
  bsdSlot: string,
  squadPosition: string | null | undefined
): string {
  const slot = (bsdSlot ?? "CM").trim().toUpperCase();
  const profile = resolveTacticalProfile(playerName, squadPosition);
  if (!profile) return slot;

  if (isDefensiveSlot(slot)) {
    if (CENTER_BACK_SLOTS.has(profile) && DEFENSIVE_SIDE_SLOTS.has(slot as TacticalSlot)) {
      return "CB";
    }

    if (DEFENSIVE_SIDE_SLOTS.has(profile) && CENTER_BACK_SLOTS.has(slot as TacticalSlot)) {
      return profile;
    }
  }

  if (isAttackingSlot(slot)) {
    if (STRIKER_SLOTS.has(profile) && WING_SLOTS.has(slot as TacticalSlot)) {
      return profile;
    }

    if (WING_SLOTS.has(profile) && STRIKER_SLOTS.has(slot as TacticalSlot)) {
      return profile;
    }

    if (ATTACKING_MID_SLOTS.has(profile) && WING_SLOTS.has(slot as TacticalSlot)) {
      return profile;
    }
  }

  return slot;
}

export type PredictedStarterSlotInput = {
  name: string;
  slotKey: string;
  squadPosition: string | null;
};

/** Intercambia slots espejo RB↔CB cuando BSD los cruza entre dos jugadores. */
export function swapMirroredDefenderSlots<T extends PredictedStarterSlotInput>(
  starters: T[]
): T[] {
  const adjusted = starters.map((starter) => ({ ...starter }));
  const misplacedRb = adjusted.find((starter) => {
    const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
    const slot = starter.slotKey.trim().toUpperCase();
    return profile === "RB" && slot === "CB";
  });
  const misplacedCbAtRb = adjusted.find((starter) => {
    const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
    const slot = starter.slotKey.trim().toUpperCase();
    return profile === "CB" && slot === "RB";
  });

  if (misplacedRb && misplacedCbAtRb) {
    const rbSlot = misplacedRb.slotKey;
    misplacedRb.slotKey = misplacedCbAtRb.slotKey;
    misplacedCbAtRb.slotKey = rbSlot;
  }

  const misplacedLb = adjusted.find((starter) => {
    const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
    const slot = starter.slotKey.trim().toUpperCase();
    return profile === "LB" && slot === "CB";
  });
  const misplacedCbAtLb = adjusted.find((starter) => {
    const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
    const slot = starter.slotKey.trim().toUpperCase();
    return profile === "CB" && slot === "LB";
  });

  if (misplacedLb && misplacedCbAtLb) {
    const lbSlot = misplacedLb.slotKey;
    misplacedLb.slotKey = misplacedCbAtLb.slotKey;
    misplacedCbAtLb.slotKey = lbSlot;
  }

  return adjusted;
}

/** Intercambia ST↔RW/LW cuando BSD cruza delantero y extremo. */
export function swapMirroredForwardSlots<T extends PredictedStarterSlotInput>(
  starters: T[]
): T[] {
  const adjusted = starters.map((starter) => ({ ...starter }));

  const swapPair = (
    strikerProfile: TacticalSlot,
    wingProfile: TacticalSlot,
    wingSlot: TacticalSlot
  ) => {
    const misplacedStriker = adjusted.find((starter) => {
      const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
      const slot = starter.slotKey.trim().toUpperCase();
      return profile === strikerProfile && slot === wingSlot;
    });
    const misplacedWinger = adjusted.find((starter) => {
      const profile = resolveTacticalProfile(starter.name, starter.squadPosition);
      const slot = starter.slotKey.trim().toUpperCase();
      return profile === wingProfile && STRIKER_SLOTS.has(slot as TacticalSlot);
    });

    if (misplacedStriker && misplacedWinger) {
      const wingSlotKey = misplacedStriker.slotKey;
      misplacedStriker.slotKey = misplacedWinger.slotKey;
      misplacedWinger.slotKey = wingSlotKey;
    }
  };

  swapPair("ST", "RW", "RW");
  swapPair("ST", "LW", "LW");

  return adjusted;
}

export function tacticalSlotLabelEs(slot: string | null | undefined): string | null {
  const key = (slot ?? "").trim().toUpperCase();
  const labels: Record<string, string> = {
    GK: "POR",
    LB: "LI",
    RB: "LD",
    LWB: "LI",
    RWB: "LD",
    CB: "DFC",
    DM: "MCD",
    CM: "MC",
    LM: "MI",
    RM: "MD",
    AM: "MP",
    LW: "EI",
    RW: "ED",
    ST: "DC",
    CF: "DC",
    SS: "MP",
  };
  return labels[key] ?? null;
}
