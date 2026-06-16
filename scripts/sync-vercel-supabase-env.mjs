import { readFileSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";

function parseEnv(path) {
  if (!existsSync(path)) throw new Error(`Missing ${path}`);
  const out = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function run(args) {
  const result = spawnSync("npx", args, { encoding: "utf8", shell: true });
  if (result.status !== 0) {
    console.error(result.stderr || result.stdout);
    process.exit(result.status ?? 1);
  }
  return result.stdout;
}

const KEYS = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const env = parseEnv(".env.local");
const mode = process.argv[2] ?? "production";

for (const key of KEYS) {
  const value = env[key]?.trim();
  if (!value) throw new Error(`Missing ${key}`);
  const isSecret = key === "SUPABASE_SERVICE_ROLE_KEY";

  if (mode === "production") {
    run([
      "vercel",
      "env",
      "update",
      key,
      "production",
      "--yes",
      "--value",
      value,
      ...(isSecret ? ["--sensitive"] : []),
    ]);
    console.log(`updated ${key} -> production`);
    continue;
  }

  run([
    "vercel",
    "env",
    "add",
    key,
    "preview",
    "--yes",
    "--force",
    "--value",
    value,
    ...(isSecret ? ["--sensitive"] : ["--no-sensitive"]),
  ]);
  console.log(`added ${key} -> preview (all branches)`);
}
