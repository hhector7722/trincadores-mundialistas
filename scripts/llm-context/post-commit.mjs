import { execSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "../..");

const WATCH_PREFIXES = [
  "app/",
  "actions/",
  "components/",
  "lib/",
  "types/",
  "supabase/migrations/",
  "docs/",
  "proxy.ts",
  "package.json",
  "PROJECT_STATUS.md",
  ".env.example",
  "vercel.json",
  "next.config.ts",
];

function getLastCommitFiles() {
  try {
    const out = execSync("git diff-tree --no-commit-id --name-only -r HEAD", {
      cwd: root,
      encoding: "utf8",
    });
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function matchesWatchList(file) {
  return WATCH_PREFIXES.some(
    (prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix),
  );
}

const committed = getLastCommitFiles();
const shouldRun = committed.some(matchesWatchList);

if (!shouldRun) {
  process.exit(0);
}

console.log("llm-context: regenerando tras commit (no bloquea la UI)...");
execSync("npx tsx scripts/generate-llm-context.ts", { cwd: root, stdio: "inherit" });
console.log("llm-context: listo. Si quieres incluirlo, commitea llm_context.md aparte.");
