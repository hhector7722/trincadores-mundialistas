import { readFileSync, readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const dir = dirname(fileURLToPath(import.meta.url));
const files = readdirSync(dir)
  .filter((f) => f.startsWith("bsd-map-batch-") && f.endsWith(".sql"))
  .sort();

for (const file of files) {
  const sql = readFileSync(resolve(dir, file), "utf8");
  console.log(JSON.stringify({ file, sql }));
}
