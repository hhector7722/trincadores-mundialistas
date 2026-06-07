import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

const GITHUB_RAW =
  "https://raw.githubusercontent.com/jfjelstul/worldcup/master/data-csv";

export const FJELSTUL_CSV_FILES = [
  "tournaments.csv",
  "teams.csv",
  "stadiums.csv",
  "matches.csv",
  "goals.csv",
  "award_winners.csv",
  "tournament_standings.csv",
  "squads.csv",
] as const;

export type FjelstulCsvFile = (typeof FJELSTUL_CSV_FILES)[number];

export async function downloadFjelstulCsv(
  targetDir: string,
  files: readonly FjelstulCsvFile[] = FJELSTUL_CSV_FILES
): Promise<string[]> {
  await mkdir(targetDir, { recursive: true });
  const saved: string[] = [];

  for (const file of files) {
    const url = `${GITHUB_RAW}/${file}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`No se pudo descargar ${url}: HTTP ${res.status}`);
    }
    const body = await res.text();
    const outPath = join(targetDir, file);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, body, "utf8");
    saved.push(outPath);
    console.log(`Descargado: ${file} (${body.length} bytes)`);
  }

  return saved;
}
