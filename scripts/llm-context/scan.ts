import fs from "node:fs";
import path from "node:path";
import { IGNORE_DIRS, LIMITS, ROOT } from "./config.ts";

export type FileEntry = {
  rel: string;
  abs: string;
  ext: string;
  lines: number;
};

export function readText(abs: string): string {
  return fs.readFileSync(abs, "utf8");
}

export function countLines(text: string): number {
  if (!text) return 0;
  return text.split("\n").length;
}

export function walkDir(
  dir: string,
  opts?: { exts?: Set<string>; base?: string },
): FileEntry[] {
  const base = opts?.base ?? ROOT;
  const exts = opts?.exts;
  const results: FileEntry[] = [];

  if (!fs.existsSync(dir)) return results;

  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE_DIRS.has(entry.name)) continue;
    const abs = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDir(abs, { exts, base }));
      continue;
    }
    const ext = path.extname(entry.name);
    if (exts && !exts.has(ext)) continue;
    const rel = path.relative(base, abs).replaceAll("\\", "/");
    const text = readText(abs);
    results.push({ rel, abs, ext, lines: countLines(text) });
  }

  return results.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function walkPaths(relativePaths: string[], exts?: Set<string>): FileEntry[] {
  const all: FileEntry[] = [];
  for (const rel of relativePaths) {
    const abs = path.join(ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const stat = fs.statSync(abs);
    if (stat.isDirectory()) {
      all.push(...walkDir(abs, { exts }));
    } else {
      const ext = path.extname(abs);
      if (exts && !exts.has(ext)) continue;
      const text = readText(abs);
      all.push({
        rel: rel.replaceAll("\\", "/"),
        abs,
        ext,
        lines: countLines(text),
      });
    }
  }
  return all.sort((a, b) => a.rel.localeCompare(b.rel));
}

export function groupBy<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFn(item);
    const list = map.get(key) ?? [];
    list.push(item);
    map.set(key, list);
  }
  return map;
}

export function summarizeList<T>(
  items: T[],
  formatter: (item: T) => string,
  max = LIMITS.maxItemsPerGroup,
): string {
  if (items.length === 0) return "_Ninguno._";
  const shown = items.slice(0, max).map(formatter);
  const extra = items.length - shown.length;
  const body = shown.join("\n");
  return extra > 0 ? `${body}\n\n_+${extra} más (ver código fuente)._` : body;
}

export function extractExports(text: string): string[] {
  const names: string[] = [];
  const patterns = [
    /export\s+async\s+function\s+(\w+)/g,
    /export\s+function\s+(\w+)/g,
    /export\s+const\s+(\w+)\s*=/g,
    /export\s+default\s+function\s+(\w+)?/g,
    /export\s+type\s+(\w+)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) {
      if (match[1]) names.push(match[1]);
    }
  }
  return [...new Set(names)];
}

export function extractUseClient(text: string): boolean {
  return /^\s*["']use client["']/m.test(text);
}

export function extractRouteFromPage(rel: string): string | null {
  const match = rel.match(/^app\/(.+)\/page\.tsx$/);
  if (!match) return null;
  let route = match[1]
    .replace(/\(app\)\/?/, "")
    .replace(/\(auth\)\/?/, "")
    .replace(/\[(\w+)\]/g, ":$1");
  return route ? `/${route}` : "/";
}

export function parseSqlSchema(migrationTexts: string[]): {
  tables: string[];
  enums: string[];
  functions: string[];
  policies: string[];
  views: string[];
} {
  const tables = new Set<string>();
  const enums = new Set<string>();
  const functions = new Set<string>();
  const policies = new Set<string>();
  const views = new Set<string>();

  for (const text of migrationTexts) {
    for (const m of text.matchAll(/create\s+table\s+(?:public\.)?(\w+)/gi)) tables.add(m[1]);
    for (const m of text.matchAll(/create\s+type\s+(?:public\.)?(\w+)/gi)) enums.add(m[1]);
    for (const m of text.matchAll(
      /create\s+(?:or\s+replace\s+)?function\s+(?:public\.)?(\w+)/gi,
    ))
      functions.add(m[1]);
    for (const m of text.matchAll(/create\s+policy\s+"([^"]+)"/gi)) policies.add(m[1]);
    for (const m of text.matchAll(/create\s+(?:or\s+replace\s+)?view\s+(?:public\.)?(\w+)/gi))
      views.add(m[1]);
  }

  return {
    tables: [...tables].sort(),
    enums: [...enums].sort(),
    functions: [...functions].sort(),
    policies: [...policies].sort(),
    views: [...views].sort(),
  };
}

export function findEnvVars(): { name: string; files: string[] }[] {
  const files = walkPaths(["app", "actions", "lib", "supabase", "scripts"], new Set([".ts", ".tsx"]));
  const map = new Map<string, Set<string>>();

  for (const file of files) {
    const text = readText(file.abs);
    for (const m of text.matchAll(/process\.env\.([A-Z0-9_]+)/g)) {
      const name = m[1];
      const set = map.get(name) ?? new Set<string>();
      set.add(file.rel);
      map.set(name, set);
    }
  }

  return [...map.entries()]
    .map(([name, fileSet]) => ({ name, files: [...fileSet].sort() }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function parsePackageJson(): {
  name: string;
  version: string;
  scripts: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
} {
  const raw = readText(path.join(ROOT, "package.json"));
  const pkg = JSON.parse(raw) as {
    name: string;
    version: string;
    scripts?: Record<string, string>;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  return {
    name: pkg.name,
    version: pkg.version,
    scripts: pkg.scripts ?? {},
    dependencies: pkg.dependencies ?? {},
    devDependencies: pkg.devDependencies ?? {},
  };
}

export function findPossiblyUnusedFiles(componentFiles: FileEntry[], libFiles: FileEntry[]): string[] {
  const allSource = walkPaths(
    ["app", "actions", "components", "lib", "supabase", "proxy.ts"],
    new Set([".ts", ".tsx"]),
  );
  const corpus = allSource.map((f) => readText(f.abs)).join("\n");
  const suspects: string[] = [];

  const candidates = [...componentFiles, ...libFiles].filter((f) => {
    if (f.rel.includes(".test.")) return false;
    if (f.rel.endsWith(".contract.ts")) return false;
    return f.rel.endsWith(".tsx") || f.rel.startsWith("lib/");
  });

  for (const file of candidates) {
    const base = path.basename(file.rel, path.extname(file.rel));
    if (base === "page" || base === "layout" || base === "route") continue;

    const modulePath = file.rel.replace(/\.tsx?$/, "");
    const importNeedles = [
      `@/${modulePath}`,
      modulePath,
      `./${base}`,
      `../${base}`,
    ];

    const imported = importNeedles.some((needle) => corpus.includes(needle));
    if (!imported && file.rel !== "lib/utils.ts") {
      suspects.push(file.rel);
    }
  }

  return suspects.slice(0, LIMITS.maxDeadExports);
}

export function grepTodos(): { file: string; line: number; text: string }[] {
  const files = walkPaths(["app", "actions", "components", "lib", "supabase"], new Set([".ts", ".tsx", ".sql"]));
  const hits: { file: string; line: number; text: string }[] = [];
  const pattern = /\b(TODO|FIXME|HACK|XXX)\b/i;

  for (const file of files) {
    const lines = readText(file.abs).split("\n");
    lines.forEach((line, idx) => {
      if (pattern.test(line)) {
        hits.push({ file: file.rel, line: idx + 1, text: line.trim() });
      }
    });
  }
  return hits;
}
