import { execSync } from "node:child_process";
import fs from "node:fs";
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

function getStagedFiles() {
  try {
    const out = execSync("git diff --cached --name-only", { cwd: root, encoding: "utf8" });
    return out.split("\n").map((l) => l.trim()).filter(Boolean);
  } catch {
    return [];
  }
}

const staged = getStagedFiles();
const shouldRun = staged.some((file) =>
  WATCH_PREFIXES.some((prefix) => file === prefix.replace(/\/$/, "") || file.startsWith(prefix)),
);

if (!shouldRun) {
  process.exit(0);
}

console.log("llm-context: regenerando por cambios en archivos vigilados...");
execSync("npm run llm-context", { cwd: root, stdio: "inherit" });
execSync("git add llm_context.md", { cwd: root, stdio: "inherit" });
