import { createAdminClient } from "@/lib/supabase/admin";
import {
  fetchMatchesForInsightGeneration,
  formatMatchLabel,
  generateAndPersistBsdInsight,
  generateAndPersistHybridInsight,
} from "../lib/ai-predictions/persist-insight";
import {
  resolvePredictionInsightSource,
  type PredictionInsightSource,
} from "../lib/ai-predictions/source-config";
import { assertServiceEnv } from "../lib/scripts/env-guard";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseArgs(argv: string[]) {
  const matchId = argv.find((arg) => arg.startsWith("--match="))?.slice("--match=".length) ?? null;
  const all = argv.includes("--all");
  const force = argv.includes("--force");
  const sourceArg = argv.find((arg) => arg.startsWith("--source="))?.slice("--source=".length);
  const source = resolvePredictionInsightSource(sourceArg ?? null);
  const horizonArg = argv.find((arg) => arg.startsWith("--days="));
  const horizonDays = all
    ? null
    : horizonArg
      ? Number(horizonArg.slice("--days=".length))
      : null;

  if (horizonDays != null && (!Number.isFinite(horizonDays) || horizonDays <= 0)) {
    throw new Error("--days debe ser un entero positivo.");
  }

  return { matchId, horizonDays, force, source };
}

function sourceDelayMs(source: PredictionInsightSource): number {
  return source === "hybrid" ? 1500 : 250;
}

async function main() {
  if (process.env.ALLOW_PREDICTION_INSIGHTS !== "1") {
    throw new Error("Generación bloqueada. Ejecuta con ALLOW_PREDICTION_INSIGHTS=1.");
  }

  assertServiceEnv();

  const { matchId, horizonDays, force, source } = parseArgs(process.argv.slice(2));
  const admin = createAdminClient();

  const matches = await fetchMatchesForInsightGeneration(admin, {
    horizonDays,
    matchId,
    force,
    source,
  });

  if (matches.length === 0) {
    console.log("No hay partidos pendientes de sincronizar.");
    return;
  }

  console.log(`Generando ${matches.length} predicción(es) IA (${source})…`);

  let ok = 0;
  let failed = 0;

  for (const [index, match] of matches.entries()) {
    const label = formatMatchLabel(match);
    process.stdout.write(`[${index + 1}/${matches.length}] ${label}… `);

    try {
      const insight =
        source === "hybrid"
          ? await generateAndPersistHybridInsight(admin, match)
          : await generateAndPersistBsdInsight(admin, match);
      ok += 1;
      console.log(`OK · ${insight.mainPrediction} · ${insight.confidence}`);
    } catch (error) {
      failed += 1;
      const message = error instanceof Error ? error.message : String(error);
      console.log(`ERROR · ${message}`);
    }

    if (index < matches.length - 1) {
      await sleep(sourceDelayMs(source));
    }
  }

  console.log(`Listo: ${ok} ok, ${failed} error(es).`);
  if (failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
