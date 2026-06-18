import { sanitizePredictorOutput } from "@/lib/laboratorio/sanitize-predictor-output";
import { teamNameEs } from "@/lib/teams/display";
import { geminiGenerateJson } from "@/lib/ai-predictions/sources/gemini-client";

export type BsdNumericContext = {
  mainPrediction: string;
  confidence: string;
  homeWinProb: number;
  drawProb: number;
  awayWinProb: number;
  mostLikelyScore: string;
  xgHome: number;
  xgAway: number;
  bttsProb: number;
};

export type GeminiNarrativeResult = {
  mvpPlayerName: string;
  analysis: string;
  alternatives: string[];
};

type RawGeminiNarrative = {
  mvp_player_name?: unknown;
  analysis?: unknown;
  alternatives?: unknown;
};

function buildGeminiNarrativeSystemPrompt(): string {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Europe/Madrid",
  });

  return `Eres el analista de «Trincadores Mundialistas» (Mundial FIFA 2026).
Fecha de referencia (Madrid): ${today}.

Recibirás probabilidades y marcador ya calculados por un modelo estadistico (BSD). NO los modifiques ni los contradigas en el analisis.

Usa Google Search solo para contrastar forma reciente, bajas y contexto de plantilla. El usuario no debe saber que buscaste ni citar fuentes.

Responde SOLO JSON valido:
{
  "mvp_player_name": "Nombre Apellido",
  "analysis": "3 a 5 frases en espanol, telegraficas, sin markdown",
  "alternatives": ["X-Y", "X-Y"]
}

Reglas:
- analysis: maximo 5 frases cortas; sin URLs, sin «segun X», sin ingles.
- No contradigas ni reemplaces las probabilidades ni el marcador principal.
- Si mencionas xG, usa EXACTAMENTE los valores fijos que te pasamos.
- mvp_player_name: jugador realista para ESTE partido; puede ser de cualquier equipo.
- alternatives: exactamente 2 marcadores alternativos plausibles, distintos del principal.
- Prohibido inventar lesiones sin contrastar en web.`;
}

function parseAlternatives(value: unknown, mainScore: string): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => sanitizePredictorOutput(item.trim()))
    .filter((item) => item && item !== mainScore)
    .slice(0, 2);
}

export async function generateGeminiNarrative(input: {
  homeTeam: string;
  awayTeam: string;
  kickoffAt: string;
  stageLabel?: string | null;
  numeric: BsdNumericContext;
}): Promise<GeminiNarrativeResult> {
  const homeEs = teamNameEs(input.homeTeam);
  const awayEs = teamNameEs(input.awayTeam);
  const kickoffLabel = new Date(input.kickoffAt).toLocaleString("es-ES", {
    dateStyle: "full",
    timeStyle: "short",
    timeZone: "Europe/Madrid",
  });
  const stage = input.stageLabel?.trim() ? ` · ${input.stageLabel.trim()}` : "";

  const userPrompt = `Partido: ${homeEs} vs ${awayEs}${stage}
Kickoff (Madrid): ${kickoffLabel}

Datos fijos del modelo BSD (no cambiar):
- Pronostico principal: ${input.numeric.mainPrediction}
- Confianza: ${input.numeric.confidence}
- Probabilidades: ${homeEs} ${input.numeric.homeWinProb}% · Empate ${input.numeric.drawProb}% · ${awayEs} ${input.numeric.awayWinProb}%
- Marcador mas probable: ${input.numeric.mostLikelyScore}
- xG esperado: ${input.numeric.xgHome.toFixed(2)} - ${input.numeric.xgAway.toFixed(2)}
- BTTS: ${input.numeric.bttsProb}%

Redacta MVP probable, analisis contextual y 2 marcadores alternativos.`;

  const raw = await geminiGenerateJson<RawGeminiNarrative>({
    systemInstruction: buildGeminiNarrativeSystemPrompt(),
    userPrompt,
    useGoogleSearch: true,
  });

  const mvpPlayerName = sanitizePredictorOutput(String(raw.mvp_player_name ?? "").trim());
  const analysis = sanitizePredictorOutput(String(raw.analysis ?? "").trim());
  const alternatives = parseAlternatives(raw.alternatives, input.numeric.mostLikelyScore);

  if (!mvpPlayerName || !analysis) {
    throw new Error("Gemini devolvio narrativa incompleta (MVP o analisis).");
  }

  return { mvpPlayerName, analysis, alternatives };
}
