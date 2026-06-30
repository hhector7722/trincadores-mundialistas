import { createAdminClient } from "@/lib/scripts/supabase-admin";
import { geminiGenerateJson } from "@/lib/ai-predictions/sources/gemini-client";
import { JERSEY_CROP_MAP, findSimilarKits } from "./jersey-crop-map";

export async function generateNextJerseyPickQuestion(targetDate: string): Promise<void> {
  const admin = createAdminClient();

  try {
    const teamsWithCrops = Array.from(new Set(Object.values(JERSEY_CROP_MAP).map(crop => crop.team)));
    
    // Check if we already have one ready for this date
    const { data: existing, error: existingError } = await admin
      .from("quiz_jersey_pick_bank")
      .select("id")
      .eq("target_date", targetDate)
      .eq("status", "ready")
      .maybeSingle();

    if (existingError) throw existingError;
    if (existing) {
      console.log(`[generateNextJerseyPickQuestion] Ya existe una pregunta lista para ${targetDate}`);
      return;
    }

    // Load past matches used to avoid duplicates
    const { data: pastBank, error: pastBankError } = await admin
      .from("quiz_jersey_pick_bank")
      .select("match_reference");
    if (pastBankError) throw pastBankError;
    
    const usedMatches = new Set(
      pastBank
        .filter(r => r.match_reference?.external_id)
        .map(r => r.match_reference!.external_id as string)
    );

    // Fetch candidate matches
    const { data: matches, error: matchesError } = await admin
      .from("wc_historic_matches")
      .select(`
        external_id,
        stage_name,
        match_date,
        home_team:home_team_external_id(name),
        away_team:away_team_external_id(name),
        tournament:tournament_external_id(year)
      `)
      .not("stage_name", "ilike", "%group%")
      .order("match_date", { ascending: false });

    if (matchesError) throw matchesError;

    const candidates = (matches ?? []).filter(m => {
      if (usedMatches.has(m.external_id)) return false;
      
      const homeName = m.home_team && !Array.isArray(m.home_team) ? (m.home_team as any).name : null;
      const awayName = m.away_team && !Array.isArray(m.away_team) ? (m.away_team as any).name : null;
      
      return homeName && awayName && teamsWithCrops.includes(homeName) && teamsWithCrops.includes(awayName);
    });

    if (candidates.length === 0) {
      throw new Error("No hay partidos candidatos disponibles con equipaciones mapeadas.");
    }

    for (let attempt = 0; attempt < Math.min(3, candidates.length); attempt++) {
      const match = candidates[attempt];
      const homeName = match.home_team && !Array.isArray(match.home_team) ? (match.home_team as any).name : "";
      const awayName = match.away_team && !Array.isArray(match.away_team) ? (match.away_team as any).name : "";
      const year = match.tournament && !Array.isArray(match.tournament) ? (match.tournament as any).year : 0;
      
      try {
        const parsed = await geminiGenerateJson<{
          prompt: string;
          correctTeam: string;
          correctKit: "home" | "away";
          sourceNotes: string;
        }>({
          systemInstruction: "Devuelve SOLO JSON con esta forma exacta: { \"prompt\": \"texto de la pregunta\", \"correctTeam\": \"nombre del equipo (en inglés, como Spain, Brazil)\", \"correctKit\": \"home\" o \"away\", \"sourceNotes\": \"fuentes usadas\" }",
          userPrompt: `Para el partido ${homeName} vs ${awayName}, Mundial ${year}, ${match.stage_name}:

Busca qué equipación (local/visitante) llevó puesta cada equipo en ese partido exacto.
Identifica si hubo un momento icónico/memorable en ese partido (gol famoso, expulsión, polémica) y redacta una pregunta de trivia en español sobre ese momento que termine preguntando "¿con qué camiseta...?".
Si el momento icónico protagonizado fue de un portero, descarta ese partido y elige otro candidato (o elige el siguiente momento relevante del mismo partido).
Si no hay momento icónico claro de un jugador de campo, redacta la pregunta sobre el resultado del partido.`,
          useGoogleSearch: true,
        });

        const { prompt, correctTeam, correctKit, sourceNotes } = parsed;

        const cropKey = `${correctTeam}-${year}-${correctKit}`;
        const correctCrop = JERSEY_CROP_MAP[cropKey];

        if (!correctCrop) {
          console.warn(`[generateNextJerseyPickQuestion] Crop no encontrado para ${cropKey}, reintentando...`);
          continue; // Intenta con el siguiente candidato
        }

        const matchRef = {
          external_id: match.external_id,
          home_team: homeName,
          away_team: awayName,
          year,
          competition_round: match.stage_name,
        };

        const correctOption = {
          team: correctTeam,
          year,
          kit: correctKit,
          imageKey: cropKey,
        };

        const distractors = [];

        // 1. Mismo equipo, mismo kit, distinto año
        const sameTeamSameKit = Object.values(JERSEY_CROP_MAP).find(c => c.team === correctTeam && c.kit === correctKit && c.year !== year);
        if (sameTeamSameKit) {
          distractors.push({ team: sameTeamSameKit.team, year: sameTeamSameKit.year, kit: sameTeamSameKit.kit, imageKey: `${sameTeamSameKit.team}-${sameTeamSameKit.year}-${sameTeamSameKit.kit}` });
        }

        // 2. Mismo equipo, distinto kit, mismo año
        const oppKit = correctKit === "home" ? "away" : "home";
        const sameTeamOppKitKey = `${correctTeam}-${year}-${oppKit}`;
        if (JERSEY_CROP_MAP[sameTeamOppKitKey]) {
          distractors.push({ team: correctTeam, year, kit: oppKit, imageKey: sameTeamOppKitKey });
        }

        // 3. Similar kit de otro equipo
        const similarKits = findSimilarKits(correctCrop.dominantColor, correctTeam);
        for (const similar of similarKits) {
          if (distractors.length < 3) {
            distractors.push({ team: similar.team, year: similar.year, kit: similar.kit, imageKey: `${similar.team}-${similar.year}-${similar.kit}` });
          }
        }

        // Fill with random if we still don't have 3
        const allCrops = Object.values(JERSEY_CROP_MAP);
        while (distractors.length < 3) {
          const randomCrop = allCrops[Math.floor(Math.random() * allCrops.length)];
          const key = `${randomCrop.team}-${randomCrop.year}-${randomCrop.kit}`;
          if (key !== cropKey && !distractors.find(d => d.imageKey === key)) {
            distractors.push({ team: randomCrop.team, year: randomCrop.year, kit: randomCrop.kit, imageKey: key });
          }
        }

        const { error: insertError } = await admin.from("quiz_jersey_pick_bank").insert({
          target_date: targetDate,
          status: "ready",
          prompt,
          match_reference: matchRef,
          correct_option: correctOption,
          distractor_options: distractors.slice(0, 3),
          source_notes: sourceNotes,
          generated_at: new Date().toISOString(),
        });

        if (insertError) throw insertError;
        return;

      } catch (err) {
        console.error(`[generateNextJerseyPickQuestion] Error en intento ${attempt + 1}:`, err);
        if (attempt === 2) {
          throw err;
        }
      }
    }

    throw new Error("Se agotaron los intentos para generar la pregunta.");

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[generateNextJerseyPickQuestion] Fallo final:", err);
    await admin.from("quiz_jersey_pick_bank").insert({
      target_date: targetDate,
      status: "failed",
      source_notes: errorMsg,
      generated_at: new Date().toISOString(),
    });
  }
}
