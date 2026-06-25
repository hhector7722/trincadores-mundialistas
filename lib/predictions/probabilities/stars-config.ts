// Diccionario manual de probabilidades base para estrellas del Mundial
// Estos valores se usan como multiplicadores/porcentajes fijos (0 a 1) en caso de que 
// la API de cuotas oficial no disponga de los mercados individuales (Pichichi, MVP, etc).

export type StarPlayerConfig = {
  topScorerProb?: number; // Ej: 0.15 (15%)
  mvpProb?: number;       // Ej: 0.12 (12%)
  goldenGloveProb?: number; // Ej: 0.15 (15%)
};

// Claves en minúsculas para facilitar el cruce (case-insensitive)
// Los valores representan probabilidad condicional: P(jugador gana premio | equipo gana el mundial)
export const STAR_PLAYERS_CONFIG: Record<string, StarPlayerConfig> = {
  "kylian mbappé": { topScorerProb: 0.35, mvpProb: 0.30 },
  "harry kane": { topScorerProb: 0.30, mvpProb: 0.18 },
  "vinícius júnior": { topScorerProb: 0.25, mvpProb: 0.25 },
  "lamine yamal": { topScorerProb: 0.20, mvpProb: 0.20 },
  "jude bellingham": { topScorerProb: 0.15, mvpProb: 0.25 },
  "lionel messi": { topScorerProb: 0.20, mvpProb: 0.30 },
  "cristiano ronaldo": { topScorerProb: 0.20, mvpProb: 0.15 },
  "kevin de bruyne": { topScorerProb: 0.08, mvpProb: 0.22 },
  "antoine griezmann": { topScorerProb: 0.10, mvpProb: 0.18 },
  "erling haaland": { topScorerProb: 0.35, mvpProb: 0.25 },
  "bukayo saka": { topScorerProb: 0.15, mvpProb: 0.15 },
  "rodri": { topScorerProb: 0.03, mvpProb: 0.25 },
  "pedri": { topScorerProb: 0.05, mvpProb: 0.12 },
  "yeremy pino": { topScorerProb: 0.03, mvpProb: 0.03 },
  
  // Porteros — probabilidad de ganar Guante de Oro si su equipo gana el mundial
  "emiliano martínez": { goldenGloveProb: 0.75 },
  "thibaut courtois": { goldenGloveProb: 0.60 },
  "alisson becker": { goldenGloveProb: 0.70 },
  "unai simón": { goldenGloveProb: 0.70 },
  "gianluigi donnarumma": { goldenGloveProb: 0.65 },
  "mike maignan": { goldenGloveProb: 0.70 },
  "ederson": { goldenGloveProb: 0.40 },
};

/** Elimina acentos y convierte a minúsculas para comparaciones robustas. */
function normalizeStr(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function getStarPlayerConfig(playerName: string): StarPlayerConfig {
  const normalizedName = normalizeStr(playerName);

  // Coincidencia exacta (sin acentos)
  for (const [key, config] of Object.entries(STAR_PLAYERS_CONFIG)) {
    if (normalizeStr(key) === normalizedName) return config;
  }

  // Coincidencia parcial (sin acentos)
  for (const [key, config] of Object.entries(STAR_PLAYERS_CONFIG)) {
    const normalizedKey = normalizeStr(key);
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return config;
    }
  }

  // Valores por defecto muy bajitos para cualquier jugador no listado
  return {
    topScorerProb: 0.005,
    mvpProb: 0.005,
    goldenGloveProb: 0.005,
  };
}
