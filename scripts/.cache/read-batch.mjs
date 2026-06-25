import { readFileSync } from "node:fs";
const i = Number(process.argv[2] ?? 0);
const sql = readFileSync(`scripts/.cache/bsd-map-batch-${i}.sql`, "utf8");
process.stdout.write(sql);
