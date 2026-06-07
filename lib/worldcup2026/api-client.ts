/**
 * Cliente mínimo para worldcup26.ir (capa futura de live scores).
 * Requiere WC2026_API_TOKEN en entorno para endpoints protegidos.
 */

const DEFAULT_BASE = "https://worldcup26.ir";

export type Wc2026ApiGame = {
  id: string;
  home_score: number;
  away_score: number;
  finished: boolean;
  time_elapsed: string;
  group?: string;
  date?: string;
};

async function apiFetch(path: string): Promise<unknown> {
  const base = process.env.WC2026_API_BASE?.trim() || DEFAULT_BASE;
  const token = process.env.WC2026_API_TOKEN?.trim();
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${base}${path}`, { headers });
  if (!res.ok) {
    throw new Error(`worldcup2026 API ${path}: HTTP ${res.status}`);
  }
  return res.json();
}

export async function fetchWc2026Games(): Promise<Wc2026ApiGame[]> {
  const data = await apiFetch("/get/games");
  if (!Array.isArray(data)) return [];
  return data as Wc2026ApiGame[];
}

export async function fetchWc2026Teams(): Promise<unknown[]> {
  const data = await apiFetch("/get/teams");
  return Array.isArray(data) ? data : [];
}
