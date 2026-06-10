import type { PoolMemberRole } from "@/types/database";

export type ParticipantSeed = {
  username: string;
  displayName: string;
  role: PoolMemberRole;
};

export const REAL_POOL_SLUG = "trincadores-mundial-2026";
export const REAL_POOL_NAME = "Trincadores Mundialistas";

/** Participantes reales — alias normalizado ASCII para login. */
export const REAL_PARTICIPANTS: ParticipantSeed[] = [
  { username: "hector", displayName: "Hector", role: "owner" },
  { username: "damo", displayName: "Damo", role: "player" },
  { username: "sanfe", displayName: "Sanfe", role: "player" },
  { username: "gonza", displayName: "Gonza", role: "player" },
  { username: "nacho", displayName: "Nacho", role: "player" },
  { username: "oro", displayName: "Oro", role: "player" },
  { username: "teixeira", displayName: "Teixeira", role: "player" },
  { username: "dani", displayName: "Dani", role: "player" },
  { username: "gabri", displayName: "Gabri", role: "player" },
  { username: "paco", displayName: "Paco", role: "player" },
  { username: "aitor", displayName: "Aitor", role: "player" },
];
