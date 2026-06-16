import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

function getLocal(key) {
  for (const line of readFileSync(".env.local", "utf8").split(/\r?\n/)) {
    const m = line.match(new RegExp(`^${key}=(.+)$`));
    if (m) return m[1].trim();
  }
  throw new Error(`Missing ${key}`);
}

const authPath = join(homedir(), "AppData", "Roaming", "xdg.data", "com.vercel.cli", "auth.json");
const auth = JSON.parse(readFileSync(authPath, "utf8"));
const token = auth.token;
if (!token) throw new Error("No Vercel token");

const projectId = "prj_gh3Ly806XzPJzfbWLtzLsi5VWqo7";
const teamId = "team_x8UiCZBKWaSaVh9meYLhHBZM";

const entries = [
  { key: "NEXT_PUBLIC_SUPABASE_URL", value: getLocal("NEXT_PUBLIC_SUPABASE_URL"), type: "plain" },
  { key: "NEXT_PUBLIC_SUPABASE_ANON_KEY", value: getLocal("NEXT_PUBLIC_SUPABASE_ANON_KEY"), type: "plain" },
  { key: "SUPABASE_SERVICE_ROLE_KEY", value: getLocal("SUPABASE_SERVICE_ROLE_KEY"), type: "sensitive" },
];

for (const entry of entries) {
  const res = await fetch(
    `https://api.vercel.com/v10/projects/${projectId}/env?teamId=${teamId}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: entry.key,
        value: entry.value,
        type: entry.type,
        target: ["preview"],
      }),
    }
  );
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error(entry.key, res.status, JSON.stringify(body));
    process.exit(1);
  }
  console.log(`preview env ok: ${entry.key}`);
}
