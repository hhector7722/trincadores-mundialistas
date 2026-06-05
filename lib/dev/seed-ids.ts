/**
 * UUIDs fijos para desarrollo y seed SQL/Auth.
 */
export const DEV_SEED_PASSWORD = "DevSeed2026!";

export const SEED_USER_IDS = {
  owner: "b0000000-0000-4000-8000-000000000001",
  admin: "b0000000-0000-4000-8000-000000000002",
  maria: "b0000000-0000-4000-8000-000000000003",
  pedro: "b0000000-0000-4000-8000-000000000004",
  lucia: "b0000000-0000-4000-8000-000000000005",
  diego: "b0000000-0000-4000-8000-000000000006",
  ana: "b0000000-0000-4000-8000-000000000007",
} as const;

export const SEED_POOL_ID = "a0000000-0000-4000-8000-000000000001";
export const SEED_MATCHDAY_ID = "c0000000-0000-4000-8000-000000000001";
export const SEED_MATCH_FINISHED_ID = "d0000000-0000-4000-8000-000000000001";
export const SEED_MATCH_LIVE_ID = "d0000000-0000-4000-8000-000000000002";
export const SEED_MATCH_SCHEDULED_ID = "d0000000-0000-4000-8000-000000000003";
export const SEED_QUIZ_ID = "e0000000-0000-4000-8000-000000000001";
export const SEED_INVITE_CODE_ID = "f0000000-0000-4000-8000-000000000001";

export const SEED_USERNAMES: Record<keyof typeof SEED_USER_IDS, string> = {
  owner: "owner",
  admin: "admin",
  maria: "maria",
  pedro: "pedro",
  lucia: "lucia",
  diego: "diego",
  ana: "ana",
};