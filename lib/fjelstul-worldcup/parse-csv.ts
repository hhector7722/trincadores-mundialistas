/** Parser CSV mínimo (RFC4180 básico) para datasets Fjelstul. */

export type CsvRow = Record<string, string>;

export function parseCsvContent(content: string): CsvRow[] {
  const lines = content.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const rows: CsvRow[] = [];
  let headers: string[] | null = null;

  for (const line of lines) {
    if (!line.trim()) continue;
    const fields = parseCsvLine(line);
    if (!headers) {
      headers = fields.map((h) => h.trim());
      continue;
    }
    const row: CsvRow = {};
    for (let i = 0; i < headers.length; i++) {
      row[headers[i]] = (fields[i] ?? "").trim();
    }
    rows.push(row);
  }
  return rows;
}

function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
      continue;
    }
    if (ch === '"') {
      inQuotes = true;
      continue;
    }
    if (ch === ",") {
      out.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  out.push(cur);
  return out;
}

export function readBool(raw: string): boolean {
  const v = raw.trim().toLowerCase();
  return v === "1" || v === "true";
}

export function readInt(raw: string): number | null {
  const v = raw.trim();
  if (!v) return null;
  const n = Number(v);
  return Number.isFinite(n) ? Math.trunc(n) : null;
}

export function readOptionalText(raw: string | undefined): string | null {
  if (!raw) return null;
  const v = raw.trim();
  if (!v || v === "not applicable" || v === "NA") return null;
  return v;
}
