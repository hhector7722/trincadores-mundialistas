import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "../..");

export const OUTPUT_FILE = "llm_context.md";

export const WATCH_GLOBS = [
  "app",
  "actions",
  "components",
  "lib",
  "types",
  "supabase/migrations",
  "docs",
  "proxy.ts",
  "package.json",
  "PROJECT_STATUS.md",
  ".env.example",
  "vercel.json",
  "next.config.ts",
] as const;

export const IGNORE_DIRS = new Set([
  "node_modules",
  ".next",
  ".git",
  "dist",
  "build",
  ".turbo",
  "coverage",
]);

export const LIMITS = {
  maxFileLinesDetail: 300,
  maxItemsPerGroup: 40,
  maxLargeFiles: 15,
  maxDeadExports: 20,
} as const;

export const PROJECT_NAME = "Trincadores Mundialistas";
