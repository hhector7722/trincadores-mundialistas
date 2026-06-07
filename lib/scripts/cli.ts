export type ScriptCliOptions = {
  dryRun: boolean;
  truncateFirst: boolean;
  download: boolean;
  fromApi: boolean;
  insert: boolean;
  sourceDir: string | null;
  limit: number | null;
  category: string | null;
};

const BOOL_FLAGS = new Set([
  "--dry-run",
  "--truncate-first",
  "--download",
  "--from-api",
  "--insert",
  "--upsert",
]);

export function parseScriptCli(
  argv: string[],
  defaults?: Partial<Pick<ScriptCliOptions, "sourceDir">>
): ScriptCliOptions {
  let sourceDir = defaults?.sourceDir ?? null;
  let limit: number | null = null;
  let category: string | null = null;

  for (const arg of argv) {
    if (BOOL_FLAGS.has(arg)) continue;
    if (arg.startsWith("--source-dir=")) {
      sourceDir = arg.slice("--source-dir=".length).trim() || null;
      continue;
    }
    if (arg.startsWith("--limit=")) {
      const n = Number(arg.slice("--limit=".length));
      limit = Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
      continue;
    }
    if (arg.startsWith("--category=")) {
      category = arg.slice("--category=".length).trim() || null;
    }
  }

  return {
    dryRun: argv.includes("--dry-run"),
    truncateFirst: argv.includes("--truncate-first"),
    download: argv.includes("--download"),
    fromApi: argv.includes("--from-api"),
    insert: argv.includes("--insert") || argv.includes("--upsert"),
    sourceDir,
    limit,
    category,
  };
}

export function logCliOptions(label: string, opts: ScriptCliOptions): void {
  console.log(
    `[${label}] dryRun=${opts.dryRun} insert=${opts.insert} truncateFirst=${opts.truncateFirst}`
  );
  if (opts.sourceDir) console.log(`[${label}] sourceDir=${opts.sourceDir}`);
}
