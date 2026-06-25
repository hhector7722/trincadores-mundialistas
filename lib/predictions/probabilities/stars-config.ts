// Diccionario manual de probabilidades base para estrellas del Mundial
// Estos valores se usan como multiplicadores/porcentajes fijos (0 a 1) en caso de que 
// la API de cuotas oficial no disponga de los mercados individuales (Pichichi, MVP, etc).

export type StarPlayerConfig = {
  topScorerProb?: number; // Ej: 0.15 (15%)
  mvpProb?: number;       // Ej: 0.12 (12%)
  goldenGloveProb?: number; // Ej: 0.15 (15%)
};

// Claves en minúsculas para facilitar el cruce (case-insensitive)
export const STAR_PLAYERS_CONFIG: Record<string, StarPlayerConfig> = {
  "kylian mbappé": { topScorerProb: 0.18, mvpProb: 0.15 },
  "harry kane": { topScorerProb: 0.15, mvpProb: 0.08 },
  "vinícius júnior": { topScorerProb: 0.12, mvpProb: 0.14 },
  "lamine yamal": { topScorerProb: 0.08, mvpProb: 0.10 },
  "jude bellingham": { topScorerProb: 0.06, mvpProb: 0.12 },
  "lionel messi": { topScorerProb: 0.08, mvpProb: 0.10 },
  "cristiano ronaldo": { topScorerProb: 0.08, mvpProb: 0.05 },
  "kevin de bruyne": { topScorerProb: 0.04, mvpProb: 0.09 },
  "antoine griezmann": { topScorerProb: 0.05, mvpProb: 0.08 },
  "erling haaland": { topScorerProb: 0.14, mvpProb: 0.10 },
  "bukayo saka": { topScorerProb: 0.07, mvpProb: 0.08 },
  "rodri": { topScorerProb: 0.01, mvpProb: 0.11 },
  "pedri": { topScorerProb: 0.02, mvpProb: 0.06 },
  "yeremy pino": { topScorerProb: 0.01, mvpProb: 0.01 }, // Menor probabilidad que Yamal
  
  // Porteros
  "emiliano martínez": { goldenGloveProb: 0.15 },
  "thibaut courtois": { goldenGloveProb: 0.12 },
  "alisson becker": { goldenGloveProb: 0.14 },
  "unai simón": { goldenGloveProb: 0.10 },
  "gianluigi donnarumma": { goldenGloveProb: 0.09 },
  "mike maignan": { goldenGloveProb: 0.13 },
  "ederson": { goldenGloveProb: 0.08 },
};

export function getStarPlayerConfig(playerName: string): StarPlayerConfig {
  const normalizedName = playerName.trim().toLowerCase();
  // Busca el nombre exacto, o si la clave del diccionario está incluida en el nombre (ej. "Yamal" en "Lamine Yamal")
  // Para mayor precisión empezamos por coincidencia exacta
  if (STAR_PLAYERS_CONFIG[normalizedName]) {
    return STAR_PLAYERS_CONFIG[normalizedName];
  }

  // Búsqueda parcial (ej si en BD guardaron solo "Mbappé" en lugar de "Kylian Mbappé")
  for (const [key, config] of Object.entries(STAR_PLAYERS_CONFIG)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return config;
    }
  }

  // Valores por defecto muy bajitos para cualquier jugador no listado
  return {
    topScorerProb: 0.005, // 0.5%
    mvpProb: 0.005,       // 0.5%
    goldenGloveProb: 0.005 // 0.5%
  };
}
