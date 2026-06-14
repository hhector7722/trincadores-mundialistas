import { resolve } from "node:path";
import { parseScriptCli, logCliOptions } from "@/lib/scripts/cli";
import {
  DEFAULT_VIDEO_MOMENTS_PATH,
  loadWorldCupVideoMomentsCatalog,
  saveWorldCupVideoMomentsCatalog,
  syncVideoMomentStatuses,
} from "@/lib/quiz/world-cup-video-moments.server";

async function main() {
  const argv = process.argv.slice(2);
  const opts = parseScriptCli(argv);
  logCliOptions("validate-world-cup-video-moments", opts);

  const catalogPath = resolve(DEFAULT_VIDEO_MOMENTS_PATH);
  const catalog = loadWorldCupVideoMomentsCatalog(catalogPath);
  const synced = syncVideoMomentStatuses(catalog);
  saveWorldCupVideoMomentsCatalog(synced, catalogPath);

  const ready = synced.moments.filter((m) => m.status === "ready").length;
  const pending = synced.moments.length - ready;

  console.log(
    JSON.stringify(
      {
        ok: true,
        catalogPath,
        total: synced.moments.length,
        ready,
        pending,
        moments: synced.moments.map((m) => ({
          id: m.id,
          status: m.status,
          local_path: m.local_path,
        })),
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
