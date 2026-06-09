import { normalizeUsername } from "@/lib/auth/validation";

/**
 * Codigos de acceso del bootstrap inicial (solo servidor).
 * Permiten login por telefono sin depender de ONBOARDING_ACCESS_CODES_JSON en Vercel.
 * Tras regenerar un codigo en admin, actualizar aqui o en la variable de entorno.
 */
const RAW_CODES: Record<string, string> = {
  hector: "8W3D38T4NKKS",
  damo: "P77VPZHBXX6E",
  sanfe: "VV2ZMCWUWHB8",
  solskjaer: "TQPYHRC7QWVH",
  gonza: "TP4AE88DGGLT",
  nacho: "BRUSREQRP9HE",
  oro: "WKF48HVZ2L65",
  teixeira: "BGBV5K63YG3Q",
  dani: "4T33UE48AAVC",
  gabri: "A6YJ4TJZWXYA",
  paco: "AHN3EL6KVB68",
  aitor: "GMXZ8AY2E9XB",
};

export const BUILT_IN_ONBOARDING_ACCESS_CODES: Record<string, string> = Object.fromEntries(
  Object.entries(RAW_CODES).map(([username, code]) => [normalizeUsername(username), code.trim().toUpperCase()])
);
