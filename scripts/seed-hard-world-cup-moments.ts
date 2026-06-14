/**
 * Fusiona momentos difíciles en el catálogo y marca los 13 originales como easy.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  DEFAULT_MOMENTS_PATH,
  syncMomentStatuses,
} from "@/lib/quiz/world-cup-moments.server";
import {
  parseWorldCupMomentsCatalog,
  type WorldCupMoment,
} from "@/lib/quiz/world-cup-moments";
import { hardMomentSeeds } from "@/lib/quiz/world-cup-moments-hard-seed";

const ORIGINAL_EASY_IDS = new Set([
  "wc1970-pelé-final",
  "wc1982-rossi-final",
  "wc1986-maradona-cup",
  "wc1986-burruchaga-goal",
  "wc1990-maradona-tears",
  "wc1994-baggio-penalty",
  "wc1998-zidane-final",
  "wc2002-ronaldo-celebration",
  "wc2006-zidane-headbutt",
  "wc2010-iniesta-goal",
  "wc2014-james-volley",
  "wc2018-mbappe-final",
  "wc2022-messi-cup",
]);

function normalizeExisting(moment: WorldCupMoment): WorldCupMoment {
  return {
    ...moment,
    difficulty: ORIGINAL_EASY_IDS.has(moment.id) ? "easy" : moment.difficulty ?? "medium",
    search_hint: moment.search_hint ?? null,
  };
}

async function main() {
  const catalogPath = resolve(DEFAULT_MOMENTS_PATH);
  const raw = JSON.parse(readFileSync(catalogPath, "utf8")) as unknown;
  const catalog = parseWorldCupMomentsCatalog(raw);

  const byId = new Map(catalog.moments.map((moment) => [moment.id, normalizeExisting(moment)]));
  const incoming = hardMomentSeeds();
  let added = 0;

  for (const moment of incoming) {
    if (byId.has(moment.id)) continue;
    byId.set(moment.id, moment);
    added += 1;
  }

  const merged = syncMomentStatuses({
    version: 1,
    moments: [...byId.values()].sort((a, b) => a.year - b.year || a.id.localeCompare(b.id)),
  });

  writeFileSync(catalogPath, `${JSON.stringify(merged, null, 2)}\n`, "utf8");

  const counts = merged.moments.reduce(
    (acc, moment) => {
      acc[moment.difficulty] += 1;
      return acc;
    },
    { easy: 0, medium: 0, hard: 0 }
  );

  console.log(
    `Catálogo actualizado: ${merged.moments.length} momentos (+${added} nuevos). ` +
      `easy=${counts.easy} medium=${counts.medium} hard=${counts.hard}. ` +
      `ready=${merged.moments.filter((m) => m.status === "ready").length} pending=${merged.moments.filter((m) => m.status === "pending").length}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
