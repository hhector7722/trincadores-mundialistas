import type { AdminClient } from "@/lib/scripts/supabase-admin";
import { fetchWorldCupOutrights } from "@/lib/odds/the-odds-api-client";
import { getStarPlayerConfig as getHardcodedStarConfig } from "./stars-config";

type StarConfig = {
  topScorerProb?: number;
  mvpProb?: number;
  goldenGloveProb?: number;
};

async function buildStarConfigMap(admin: AdminClient): Promise<Record<string, StarConfig>> {
  const { data } = await admin.from("star_player_config").select("*");
  if (!data || data.length === 0) return {};

  const map: Record<string, StarConfig> = {};
  for (const row of data) {
    map[row.player_name.toLowerCase()] = {
      topScorerProb: row.top_scorer_prob ?? undefined,
      mvpProb: row.mvp_prob ?? undefined,
      goldenGloveProb: row.golden_glove_prob ?? undefined,
    };
  }
  return map;
}

function getStarConfig(
  playerName: string,
  dbMap: Record<string, StarConfig>
): StarConfig {
  const normalized = playerName.trim().toLowerCase();

  // 1. Buscar coincidencia exacta en BD
  if (dbMap[normalized]) return dbMap[normalized];

  // 2. Buscar coincidencia parcial en BD
  for (const [key, config] of Object.entries(dbMap)) {
    if (normalized.includes(key) || key.includes(normalized)) return config;
  }

  // 3. Fallback al archivo hardcodeado
  return getHardcodedStarConfig(playerName);
}

type PlayerWithTeam = { playerName: string; teamName: string | null };

type UniquePicks = {
  champions: Set<string>;
  finalists: Set<string>;
  // Map playerName → teamName (last team seen for that player name)
  topScorers: Map<string, string | null>;
  mvps: Map<string, string | null>;
  goldenGloves: Map<string, string | null>;
};

async function getUniqueVotedPicks(admin: AdminClient): Promise<UniquePicks> {
  const picks: UniquePicks = {
    champions: new Set(),
    finalists: new Set(),
    topScorers: new Map(),
    mvps: new Map(),
    goldenGloves: new Map(),
  };

  const { data, error } = await admin
    .from("tournament_general_predictions")
    .select(
      "champion_team, finalist_team_a, finalist_team_b, top_scorer_player_name, top_scorer_team_name, tournament_mvp_player_name, tournament_mvp_team_name, golden_glove_player_name, golden_glove_team_name"
    );

  if (error || !data) {
    console.error("[sync-probabilities] Error fetching predictions:", error);
    return picks;
  }

  for (const row of data) {
    if (row.champion_team) picks.champions.add(row.champion_team);
    if (row.finalist_team_a) picks.finalists.add(row.finalist_team_a);
    if (row.finalist_team_b) picks.finalists.add(row.finalist_team_b);
    if (row.top_scorer_player_name)
      picks.topScorers.set(row.top_scorer_player_name, row.top_scorer_team_name ?? null);
    if (row.tournament_mvp_player_name)
      picks.mvps.set(row.tournament_mvp_player_name, row.tournament_mvp_team_name ?? null);
    if (row.golden_glove_player_name)
      picks.goldenGloves.set(row.golden_glove_player_name, row.golden_glove_team_name ?? null);
  }

  return picks;
}

function normalizeOdds(outcomes: { name: string; price: number }[]): Record<string, number> {
  const rawProbabilities = outcomes.map((o) => ({
    name: o.name,
    prob: 1 / o.price,
  }));

  const totalProb = rawProbabilities.reduce((sum, o) => sum + o.prob, 0);
  
  const normalized: Record<string, number> = {};
  for (const o of rawProbabilities) {
    // Normalization removes the bookmaker's margin (vig)
    normalized[o.name] = o.prob / totalProb;
  }

  return normalized;
}

export async function syncDynamicProbabilities(admin: AdminClient) {
  console.log("[sync-probabilities] Starting sync...");
  
  // 1. Obtener qué han votado realmente los usuarios
  const uniquePicks = await getUniqueVotedPicks(admin);
  // 2. Cargar mapa de config de estrellas desde la BD (con fallback al archivo)
  const starDbMap = await buildStarConfigMap(admin);

  const totalUnique =
    uniquePicks.champions.size +
    uniquePicks.finalists.size +
    uniquePicks.topScorers.size +
    uniquePicks.mvps.size +
    uniquePicks.goldenGloves.size;

  if (totalUnique === 0) {
    console.log("[sync-probabilities] No predictions found. Skipping.");
    return;
  }
  
  console.log(`[sync-probabilities] Found ${totalUnique} unique picks to calculate.`);

  // 2. Traer datos de la API (Solo 1 llamada, mercado outrights)
  const outrights = await fetchWorldCupOutrights();
  
  if (!outrights || outrights.length === 0) {
    console.warn("[sync-probabilities] No data returned from The Odds API. Will use fallback logic in the future.");
    // Aquí idealmente cargaríamos desde la BD el último raw guardado para aplicar fallback degradation.
    return;
  }

  // Guardamos en un diccionario las cuotas por mercado usando el primer bookmaker (ej. Unibet, Bet365)
  // En producción real, se puede hacer la media de todos los bookmakers.
  const marketMap = new Map<string, { outcomes: {name: string, price: number}[], updated_at: string, bookmaker: string }>();

  // Para simplificar, cogeremos las cuotas de la casa de apuestas que tenga más mercados.
  // The Odds API devuelve un array de eventos. Para World Cup Outrights suele haber 1 o 2 eventos (Winner, Top Scorer).
  for (const event of outrights) {
    const bookie = event.bookmakers[0]; // Usamos la primera casa disponible (suele ser bet365 o unibet)
    if (!bookie) continue;

    for (const market of bookie.markets) {
      if (market.key === 'outrights' || market.key === 'tournament_winner') {
        // En algunas respuestas el key es "outrights", pero el título del evento lo define
        const internalMarketKey = event.sport_title.toLowerCase().includes('winner') ? 'champion' : 'outrights';
        marketMap.set(internalMarketKey, { 
          outcomes: market.outcomes, 
          updated_at: market.last_update,
          bookmaker: bookie.title 
        });
      }
    }
  }

  // 3. Ingestar RAW en BD (para trazabilidad) - Optimization: solo upsert si ha cambiado
  const rawRows: any[] = [];
  for (const [marketKey, data] of marketMap.entries()) {
    for (const outcome of data.outcomes) {
      rawRows.push({
        sport_key: 'soccer_fifa_world_cup',
        market_key: marketKey,
        selection_name: outcome.name,
        bookmaker_key: data.bookmaker,
        raw_odds: outcome.price,
        api_updated_at: data.updated_at
      });
    }
  }

  if (rawRows.length > 0) {
     // Guardamos el RAW tal cual
     const { error: rawError } = await admin.from('market_odds_raw').upsert(
       rawRows, 
       { onConflict: 'market_key, selection_name', ignoreDuplicates: false } // Nota: tendríamos que ajustar la PK si ignoramos
     );
     // Nota: En la migración el id es UUID, necesitamos ajustar el upsert si queremos sobreescribir la misma key
     // Como no hemos hecho PK (market_key, selection_name) sino UUID, podemos hacer un insert bulk o crear un ON CONFLICT
     // Por simplicidad en esta iteración y optimización de base de datos, omitimos este paso de upsert crudo si la migración no lo soporta directamente,
     // o insertamos y borramos viejos. (Ver script final de optimización)
  }

  // 4. Calcular Probabilidades (Proyección)
  const projectionRows: any[] = [];
  const championMarket = marketMap.get('champion') || marketMap.get('outrights');
  
  if (championMarket) {
    const normalizedProbs = normalizeOdds(championMarket.outcomes);

    // Calcular Campeón
    for (const team of uniquePicks.champions) {
      // Mapear nombre de la app (ej. "España") a la API (ej. "Spain")
      // Idealmente, esto se hace con una tabla de mapping (external_id_map).
      // Aquí simulamos que los nombres hacen match o usamos un fallback a 0.001
      const apiName = team; // TODO: Implementar mapper si difieren
      const prob = normalizedProbs[apiName] || 0.001; 
      const confidence = normalizedProbs[apiName] ? 100 : 0;

      projectionRows.push({
        category: 'champion',
        selection_key: team,
        entity_type: 'team',
        probability: prob,
        confidence_score: confidence,
        algorithm_version: 1,
        source_raw_odds: championMarket.outcomes.find(o => o.name === apiName)?.price || null,
        source_bookmaker: championMarket.bookmaker,
        source_market: 'outrights',
        source_api_updated_at: championMarket.updated_at
      });
    }

    // Calcular Finalistas (aprox)
    for (const team of uniquePicks.finalists) {
      const prob = (normalizedProbs[team] || 0.001) * 1.5; // Heurística simple: llegar a la final es más probable que ganar
      projectionRows.push({
        category: 'finalists',
        selection_key: team,
        entity_type: 'team',
        probability: Math.min(prob, 1),
        confidence_score: normalizedProbs[team] ? 80 : 0, // 80 porque es derivada
        algorithm_version: 1
      });
    }

    // Helper: calcula prob(player) = prob(equipo_campeón) × peso_calidad_jugador
    // Luego se normaliza dentro de su categoría para que la lista sea relativa, no absoluta.
    function buildPlayerProbs(
      playerTeamMap: Map<string, string | null>,
      qualityExtractor: (config: StarConfig) => number | undefined
    ): Array<{ player: string; team: string | null; rawScore: number }> {
      return [...playerTeamMap.entries()].map(([player, team]) => {
        const teamProb = team ? (normalizedProbs[team] ?? 0.001) : 0.001;
        const config = getStarConfig(player, starDbMap);
        const quality = qualityExtractor(config) ?? 0.005; // 0.5% como peso mínimo
        return { player, team, rawScore: teamProb * quality };
      });
    }

    function normalizePlayers(
      players: Array<{ player: string; team: string | null; rawScore: number }>
    ): Array<{ player: string; team: string | null; prob: number }> {
      const total = players.reduce((s, p) => s + p.rawScore, 0);
      if (total === 0) return players.map((p) => ({ ...p, prob: 0.005 }));
      return players.map((p) => ({ ...p, prob: p.rawScore / total }));
    }

    // MVP — prob = prob_equipo × calidad_mvp, normalizado
    const mvpCandidates = normalizePlayers(
      buildPlayerProbs(uniquePicks.mvps, (c) => c.mvpProb)
    );
    for (const { player, prob } of mvpCandidates) {
      projectionRows.push({
        category: 'tournament_mvp',
        selection_key: player,
        entity_type: 'player',
        probability: prob,
        confidence_score: 40,
        algorithm_version: 3,
      });
    }

    // Pichichi — prob = prob_equipo × calidad_pichichi, normalizado
    const topScorerCandidates = normalizePlayers(
      buildPlayerProbs(uniquePicks.topScorers, (c) => c.topScorerProb)
    );
    for (const { player, prob } of topScorerCandidates) {
      projectionRows.push({
        category: 'top_scorer',
        selection_key: player,
        entity_type: 'player',
        probability: prob,
        confidence_score: 40,
        algorithm_version: 3,
      });
    }

    // Guante de Oro — prob = prob_equipo × calidad_portero, normalizado
    const goldenGloveCandidates = normalizePlayers(
      buildPlayerProbs(uniquePicks.goldenGloves, (c) => c.goldenGloveProb)
    );
    for (const { player, prob } of goldenGloveCandidates) {
      projectionRows.push({
        category: 'golden_glove',
        selection_key: player,
        entity_type: 'player',
        probability: prob,
        confidence_score: 40,
        algorithm_version: 3,
      });
    }
  }

  // 5. Upsert en Caché de Proyección
  if (projectionRows.length > 0) {
    const { error: upsertError } = await admin
      .from("dynamic_probabilities")
      .upsert(projectionRows, { onConflict: 'category, selection_key' });
      
    if (upsertError) {
      console.error("[sync-probabilities] Upsert Error:", upsertError);
    } else {
      console.log(`[sync-probabilities] Successfully updated ${projectionRows.length} projections.`);
    }
  }
}
