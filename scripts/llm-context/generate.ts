import fs from "node:fs";
import path from "node:path";
import { LIMITS, OUTPUT_FILE, PROJECT_NAME, ROOT } from "./config";
import {
  extractExports,
  extractRouteFromPage,
  extractUseClient,
  findEnvVars,
  findPossiblyUnusedFiles,
  grepTodos,
  groupBy,
  parsePackageJson,
  parseSqlSchema,
  readText,
  summarizeList,
  walkDir,
  walkPaths,
} from "./scan";

const GENERATED_AT = new Date().toISOString();

function section(title: string, level = 2): string {
  return `${"#".repeat(level)} ${title}\n\n`;
}

function readProjectStatus(): string {
  const p = path.join(ROOT, "PROJECT_STATUS.md");
  return fs.existsSync(p) ? readText(p) : "_Sin PROJECT_STATUS.md_";
}

function parseStatusLists(statusMd: string): {
  completed: string[];
  pending: string[];
  phase: string;
} {
  const completed: string[] = [];
  const pending: string[] = [];
  let phase = "desconocida";

  const phaseMatch = statusMd.match(/Fase actual:\s*(.+)/i);
  if (phaseMatch) phase = phaseMatch[1].trim();

  for (const line of statusMd.split("\n")) {
    const done = line.match(/^-\s+\[x\]\s+(.+)/i);
    const todo = line.match(/^-\s+\[\s\]\s+(.+)/i);
    if (done) completed.push(done[1].trim());
    if (todo) pending.push(todo[1].trim());
  }

  return { completed, pending, phase };
}

function buildExecutive(): string {
  const status = readProjectStatus();
  const { completed, pending, phase } = parseStatusLists(status);

  return `${section("Resumen ejecutivo", 2)}> Fuente única de verdad para LLMs. Regenerado automáticamente. Última actualización: \`${GENERATED_AT}\`.

| Campo | Valor |
|-------|-------|
| **Nombre** | ${PROJECT_NAME} |
| **Paquete npm** | \`trincadores-mundialistas\` v0.1.0 |
| **Objetivo** | PWA de porras privadas para el Mundial 2026: predicciones de marcador, ranking por jornada, administración de resultados |
| **Problema** | Centralizar quinielas entre amigos con reglas claras (8/5/3/0), visibilidad controlada de predicciones rivales y multi-porra |
| **Usuarios** | Jugadores (\`player\`), administradores de porra (\`admin\`), propietarios (\`owner\`) |
| **Fase actual** | ${phase} |
| **Stack** | Next.js 16 App Router · React 19 · Tailwind 4 · Supabase (Auth + Postgres + RLS) |

**Completado reciente:** ${completed.slice(-6).join(" · ") || "—"}

**Siguiente:** ${pending[0] ?? "—"}

`;
}

function buildArchitecture(pkg: ReturnType<typeof parsePackageJson>): string {
  return `${section("Arquitectura", 2)}${section("Visión general", 3)}Monolito full-stack en **Next.js 16** con **Server Components** por defecto. Las mutaciones de usuario van por **Server Actions**; los **API Routes** en \`app/api/\` cubren crons Vercel, Web Push (VAPID) y helpers de auth/PWA. La base de datos es la fuente de verdad del scoring; TypeScript replica la lógica solo para tests.

${section("Stack técnico", 3)}| Capa | Tecnología |
|------|------------|
| Framework | Next.js ${pkg.dependencies.next ?? "16"} (App Router, \`proxy.ts\`) |
| Runtime | Node.js (server) + React 19 (client mínimo) |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 + variables CSS \`--tm-*\` |
| Backend datos | Supabase Postgres + RLS + RPC security definer |
| Auth | Supabase Auth con emails sintéticos por username |
| Deploy | Vercel (\`vercel.json\`) |
| Tests | Node test runner vía \`tsx --test\` |

${section("Patrón arquitectónico", 3)}- **Route groups:** \`(app)\` autenticado con shell, \`(auth)\` formularios públicos
- **Dominio en \`lib/{modulo}/\`:** queries, validación, formato
- **Mutaciones en \`actions/\`:** discriminated union \`{ ok: true } | { ok: false, error }\`
- **Protección en 3 capas:** \`proxy.ts\` → layout \`(app)\` → RLS Postgres

${section("Flujo de datos", 3)}\`\`\`mermaid
flowchart TB
  subgraph Client["Cliente (mínimo)"]
    Forms["Formularios client\\nLogin, Register, PredictionForm"]
    TabBar["TabBar / PoolSwitcher"]
  end

  subgraph Next["Next.js Server"]
    Pages["Server Components\\napp/(app)/*"]
    Actions["Server Actions\\nactions/*"]
    Lib["lib/*/queries.ts"]
    Proxy["proxy.ts\\nupdateSession"]
  end

  subgraph Supabase["Supabase"]
    Auth["Auth (JWT + cookies)"]
    PG["Postgres + RLS"]
    RPC["RPC functions\\nscoring, invites, quiz"]
  end

  Forms --> Actions
  TabBar --> Actions
  Proxy --> Auth
  Pages --> Lib
  Actions --> Lib
  Lib --> PG
  Actions --> RPC
  RPC --> PG
  Auth --> PG
\`\`\`

`;
}

function buildFrontend(): string {
  const pages = walkDir(path.join(ROOT, "app"), { exts: new Set([".tsx"]) }).filter((f) =>
    f.rel.endsWith("/page.tsx"),
  );
  const layouts = walkDir(path.join(ROOT, "app"), { exts: new Set([".tsx"]) }).filter((f) =>
    f.rel.endsWith("/layout.tsx"),
  );
  const components = walkDir(path.join(ROOT, "components"), { exts: new Set([".tsx"]) });

  const routeRows = pages
    .map((p) => {
      const route = extractRouteFromPage(p.rel) ?? p.rel;
      const text = readText(p.abs);
      const dynamic = text.includes('dynamic = "force-dynamic"') ? "force-dynamic" : "default";
      return `| \`${route}\` | \`${p.rel}\` | ${dynamic} |`;
    })
    .join("\n");

  const layoutRows = layouts
    .map((l) => {
      const text = readText(l.abs);
      const hasAuth = text.includes("redirect") || text.includes("getUser");
      return `| \`${l.rel}\` | ${hasAuth ? "Auth/pool guard" : "Shell visual"} |`;
    })
    .join("\n");

  const compGroups = groupBy(components, (c) => path.dirname(c.rel).replace("components/", "") || "root");
  const compSections = [...compGroups.entries()]
    .map(([group, files]) => {
      const rows = files
        .slice(0, LIMITS.maxItemsPerGroup)
        .map((f) => {
          const exports = extractExports(readText(f.abs));
          const client = extractUseClient(readText(f.abs)) ? "client" : "server";
          const name = path.basename(f.rel, ".tsx");
          return `| \`${name}\` | \`${f.rel}\` | ${client} | ${exports.slice(0, 3).join(", ") || "—"} |`;
        })
        .join("\n");
      const extra = files.length > LIMITS.maxItemsPerGroup ? `\n_+${files.length - LIMITS.maxItemsPerGroup} componentes en \`${group}/\`._` : "";
      return `${section(group, 4)}| Componente | Ruta | Tipo | Exports |\n|------------|------|------|--------|\n${rows}${extra}\n`;
    })
    .join("\n");

  return `${section("Frontend", 2)}${section("Resumen", 3)}- **Sin** hooks globales, Context API, Zustand ni React Query
- Estado client solo en formularios y navegación (\`useState\`, \`useTransition\`, \`useRouter\`, \`usePathname\`)
- PWA: \`app/manifest.ts\`, iconos dinámicos \`icon.tsx\` / \`apple-icon.tsx\`
- Diseño: dark mode morado \`#2a1058\` + glass + acento neón lima \`#D4FF00\`, estilo porra deportiva, targets táctiles 48px+

${section("Rutas (pages)", 3)}| Ruta | Archivo | Render |
|------|---------|--------|
${routeRows}

${section("Layouts", 3)}| Archivo | Rol |
|---------|-----|
${layoutRows}

${section("Componentes por módulo", 3)}${compSections}

${section("Gestión de estado", 3)}| Mecanismo | Ubicación | Uso |
|-----------|-----------|-----|
| Cookie httpOnly | \`tm_active_pool_id\` | Porra activa multi-pool |
| Supabase session | cookies SSR | Auth global |
| Server cache | \`cache()\` en pool context | Dedup por request |
| Client local | formularios | Draft de predicción antes de guardar |

`;
}

function readVercelCrons(): { path: string; schedule: string }[] {
  const p = path.join(ROOT, "vercel.json");
  if (!fs.existsSync(p)) return [];
  try {
    const json = JSON.parse(readText(p)) as { crons?: { path: string; schedule: string }[] };
    return json.crons ?? [];
  } catch {
    return [];
  }
}

function buildBackend(): string {
  const actionFiles = walkDir(path.join(ROOT, "actions"), { exts: new Set([".ts"]) });
  const apiRoutes = walkDir(path.join(ROOT, "app/api"), { exts: new Set([".ts"]) }).filter((f) =>
    f.rel.endsWith("/route.ts"),
  );
  const libFiles = walkPaths(["lib"], new Set([".ts"]));
  const crons = readVercelCrons();

  const actionRows = actionFiles
    .flatMap((f) => {
      const text = readText(f.abs);
      const exports = extractExports(text);
      return exports.map((fn) => {
        const sig = text.match(new RegExp(`export async function ${fn}\\([^)]*\\)[^{]*`))?.[0] ?? fn;
        return `| \`${fn}\` | \`${f.rel}\` | \`${sig.replace(/\s+/g, " ").slice(0, 80)}\` |`;
      });
    })
    .join("\n");

  const apiRows = apiRoutes
    .map((r) => {
      const route = r.rel.replace(/^app\/api/, "/api").replace(/\/route\.ts$/, "");
      const methods = [...readText(r.abs).matchAll(/export async function (GET|POST|PUT|PATCH|DELETE)/g)]
        .map((m) => m[1])
        .join(", ");
      return `| \`${route}\` | \`${r.rel}\` | ${methods || "—"} |`;
    })
    .join("\n");

  const cronRows = crons
    .map((c) => `| \`${c.path}\` | \`${c.schedule}\` | \`CRON_SECRET\` |`)
    .join("\n");

  const libGroups = groupBy(
    libFiles.filter((f) => !f.rel.includes(".test.")),
    (f) => f.rel.split("/")[1] ?? "lib",
  );

  const libSections = [...libGroups.entries()]
    .map(([mod, files]) => {
      const rows = files
        .map((f) => `| \`${f.rel}\` | ${f.lines} líneas | ${extractExports(readText(f.abs)).join(", ") || "—"} |`)
        .join("\n");
      return `**${mod}/** — ${files.length} archivos\n\n| Archivo | Tamaño | Exports |\n|---------|--------|--------|\n${rows}\n`;
    })
    .join("\n");

  return `${section("Backend", 2)}${section("Resumen", 3)}Mutaciones de usuario vía **Server Actions** + queries en \`lib/\`. **API Routes** para crons, push y auth device.

${section("Server Actions", 3)}| Función | Archivo | Firma (resumen) |
|---------|---------|-----------------|
${actionRows}

${section("API Routes", 3)}| Ruta | Archivo | Métodos |
|------|---------|---------|
${apiRows || "| — | — | — |"}

${section("Detalle de acciones", 3)}| Acción | Recibe | Devuelve | Dependencias |
|--------|--------|----------|--------------|
| \`signIn\` | username, password | \`{ok}\` o error | Supabase Auth, cookie pool |
| \`signUpAndJoin\` | FormData (invite, user, pass, displayName) | \`{ok}\` o error | signUp → profile → RPC \`consume_invite_and_join\` |
| \`signOut\` | — | redirect \`/login\` | signOut + clear cookie |
| \`requestPasswordReset\` | username | siempre \`{ok:true}\` | resetPasswordForEmail (requiere SMTP) |
| \`setActivePool\` | poolId uuid | \`{ok}\` o error | valida membresía, cookie |
| \`savePrediction\` | poolId, matchId, goles | marcador guardado o error | RLS + \`prediction_edit_allowed\` |
| \`submitMatchResult\` | poolId, matchId, goles | \`{ok}\` o error | admin check + RPC scoring |
| \`savePushSubscriptionAction\` | PushSubscription JSON | \`{ok}\` o error | \`push_subscriptions\` + VAPID |
| \`startQuiz\` / \`submitQuiz\` | quizId, respuestas | intento + puntuación | RPC \`start_quiz_attempt\` / \`submit_quiz_attempt\` |
| \`saveMvpPrediction\` | poolId, matchId, dorsal | MVP guardado | \`match_mvp_predictions\` |
| \`fetchMatchLineupBundleAction\` | matchId | alineaciones tácticas | FotMob → BSD → API-Football |

${section("Proxy / Middleware", 3)}| Archivo | Rol |
|---------|-----|
| \`proxy.ts\` | Entry Next 16: delega en \`updateSession\` |
| \`lib/supabase/middleware.ts\` | Refresca sesión; redirect auth/no-auth |

${section("Módulos lib/ (capa de datos)", 3)}${libSections}

${section("Jobs / Cron / Webhooks", 3)}| Job | Schedule | Auth |
|-----|----------|------|
${cronRows || "| — | — | — |"}

| Tipo | Estado |
|------|--------|
| Edge Functions Supabase | No implementadas |
| Webhooks externos | No implementados |
| RPC batch | \`expire_stale_quiz_attempts\`, \`generate_news_batch\` (stub) preparados en SQL |

`;
}

function buildDatabase(): string {
  const migrations = walkDir(path.join(ROOT, "supabase/migrations"), { exts: new Set([".sql"]) });
  const texts = migrations.map((m) => readText(m.abs));
  const schema = parseSqlSchema(texts);

  const tableDescriptions: Record<string, string> = {
    profiles: "Perfil 1:1 con auth.users (username, display_name)",
    pools: "Porra privada con settings_json (visibilidad predicciones)",
    pool_members: "Membresía N:M con rol owner/admin/player",
    invite_codes: "Códigos de invitación (solo RPC, sin SELECT directo)",
    matchdays: "Jornadas de competición dentro de una porra",
    matches: "Partidos con kickoff, equipos, status y highlight_headline",
    match_results: "Marcador oficial + MVP oficial (1:1 con match)",
    predictions: "Predicción de marcador por usuario/partido/porra",
    pool_member_scores: "Puntos acumulados y rank por jornada",
    activity_events: "Eventos para feed de actividad (fase 1e)",
    news_items: "Noticias/narrativa generada por pool",
    notifications: "Notificaciones in-app por usuario (4 kinds + push)",
    achievements: "Catálogo de logros",
    profile_achievements: "Logros desbloqueados por perfil",
    push_subscriptions: "Suscripciones Web Push (VAPID)",
    admin_audit_log: "Auditoría acciones administrativas",
    quizzes: "Cuestionarios diarios por porra",
    quiz_questions: "Preguntas de un quiz",
    quiz_question_keys: "Respuestas correctas (acceso revocado)",
    quiz_attempts: "Intento de quiz por usuario",
    quiz_responses: "Respuestas individuales por intento",
    quiz_facts_worldcup: "Banco de hechos históricos para generador quiz",
    quiz_final_ranking_scores: "Bonus ranking final quiz",
    competitions: "Catálogo OpenFootball (competiciones)",
    tournament_stages: "Fases del torneo (grupos, eliminatorias)",
    host_cities: "Sedes del Mundial",
    teams: "Equipos del catálogo WC2026",
    team_squads: "Plantillas oficiales por equipo/torneo",
    team_squad_players: "Jugadores de plantilla",
    external_id_map: "Mapeo partidos → IDs externos (BSD, FotMob, API-Football)",
    match_live_state: "Snapshot live: marcador, stats, payload BSD",
    match_team_lineups: "Alineaciones confirmadas/predicted por partido/equipo",
    match_mvp_predictions: "Predicción MVP por usuario/partido",
    match_highlights: "Vídeos resumen YouTube vinculados a partido",
    tournament_general_predictions: "Pronósticos generales (campeón, finalistas, goleador…)",
    tournament_official_awards: "Premios oficiales del torneo (admin)",
    tournament_general_prediction_scores: "Puntos pronósticos generales",
    data_source_registry: "Registro de fuentes de datos externas",
    wc_historic_tournaments: "Histórico Mundiales (Fjelstul)",
    wc_historic_teams: "Equipos históricos",
    wc_historic_stadiums: "Estadios históricos",
    wc_historic_matches: "Partidos históricos",
    wc_historic_goals: "Goles históricos",
    wc_historic_award_winners: "Premios históricos",
    wc_historic_tournament_standings: "Clasificaciones históricas",
  };

  const tableRows = schema.tables
    .map((t) => {
      const desc = tableDescriptions[t] ?? "Ver migraciones SQL";
      return `| \`${t}\` | ${desc} | RLS habilitado |`;
    })
    .join("\n");

  const fnRows = schema.functions.map((f) => `| \`${f}\` | RPC / trigger |`).join("\n");

  return `${section("Base de datos", 2)}${section("Resumen", 3)}| Aspecto | Valor |
|---------|-------|
| ORM | **Ninguno** — SQL directo vía Supabase JS + RPC |
| Migraciones | ${migrations.length} archivos en \`supabase/migrations/\` |
| Tablas | ${schema.tables.length} |
| Enums | ${schema.enums.join(", ")} |
| Funciones SQL | ${schema.functions.length} |
| Políticas RLS | ${schema.policies.length} |
| Vistas | ${schema.views.join(", ") || "—"} |

${section("Diagrama ER (simplificado)", 3)}\`\`\`mermaid
erDiagram
  auth_users ||--|| profiles : "1:1"
  profiles ||--o{ pool_members : "miembro"
  pools ||--o{ pool_members : "tiene"
  pools ||--o{ matchdays : "organiza"
  matchdays ||--o{ matches : "contiene"
  matches ||--o| match_results : "resultado"
  pools ||--o{ predictions : "scope"
  matches ||--o{ predictions : "objeto"
  profiles ||--o{ predictions : "autor"
  pools ||--o{ pool_member_scores : "ranking"
  profiles ||--o{ pool_member_scores : "puntos"
  matchdays ||--o{ pool_member_scores : "jornada"
  pools ||--o{ invite_codes : "invitaciones"
  pools ||--o{ quizzes : "quiz"
  quizzes ||--o{ quiz_questions : "preguntas"
  quiz_questions ||--|| quiz_question_keys : "respuesta oculta"
  profiles ||--o{ quiz_attempts : "intento"
  quizzes ||--o{ quiz_attempts : "sesión"
\`\`\`

${section("Tablas", 3)}| Tabla | Descripción funcional | Seguridad |
|-------|----------------------|-----------|
${tableRows}

${section("Enums", 3)}${schema.enums.map((e) => `- \`${e}\``).join("\n")}

${section("Funciones SQL críticas", 3)}| Función | Propósito |
|---------|-----------|
| \`compute_match_points\` | Scoring 8/5/3/0 exclusivo |
| \`prediction_edit_allowed\` | Bloqueo T-5 min antes kickoff |
| \`can_view_peer_predictions\` | Visibilidad rivales según settings |
| \`recalculate_match_scores\` | Propaga puntos tras resultado |
| \`rebuild_pool_member_scores\` | Ranking por jornada + acumulado |
| \`consume_invite_and_join\` | Registro con código invitación |
| \`start_quiz_attempt\` / \`submit_quiz_attempt\` | Flujo quiz sin exponer respuestas |

${section("Todas las funciones detectadas", 3)}| Función | Tipo |
|---------|------|
${fnRows}

${section("Migraciones", 3)}${migrations.map((m) => `- \`${m.rel}\` (${m.lines} líneas)`).join("\n")}

Documentación RLS ampliada: \`docs/RLS_NOTES.md\`

`;
}

function buildAuth(): string {
  return `${section("Autenticación", 2)}${section("Proveedor", 3)}**Supabase Auth** con emails internos: \`{username}@{AUTH_INTERNAL_DOMAIN}\` (default \`auth.trincadores.local\`). La UI nunca muestra email.

${section("Roles", 3)}| Rol | Permisos |
|-----|----------|
| \`player\` | Predicciones, ranking, perfiles |
| \`admin\` | + resultados oficiales, gestión miembros (RLS) |
| \`owner\` | Igual que admin vía \`is_pool_admin\` |

${section("Protección de rutas", 3)}\`\`\`mermaid
sequenceDiagram
  participant U as Usuario
  participant P as proxy.ts
  participant L as (app)/layout
  participant DB as Postgres RLS

  U->>P: Request
  P->>P: updateSession + refresh JWT
  alt sin sesión y ruta protegida
    P-->>U: redirect /login?next=
  else ruta auth con sesión
    P-->>U: redirect /
  else ok
    P->>L: continúa
    L->>L: valida pool activo
    L->>DB: queries con JWT
    DB-->>U: datos filtrados RLS
  end
\`\`\`

${section("Flujo login/registro", 3)}1. **Login:** username → \`toAuthEmail()\` → \`signInWithPassword\` → cookie pool si una sola membresía
2. **Registro:** código invite → signUp → insert \`profiles\` → RPC \`consume_invite_and_join\` → rollback \`deleteUser\` si falla
3. **Logout:** signOut + borrar cookie \`tm_active_pool_id\`
4. **Recovery:** técnico; requiere SMTP real (no operativo en dev)

`;
}

function buildEnv(): string {
  const used = findEnvVars();
  const example = fs.existsSync(path.join(ROOT, ".env.example"))
    ? readText(path.join(ROOT, ".env.example"))
    : "";

  const exampleVars = new Set<string>();
  for (const line of example.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m) exampleVars.add(m[1]);
  }

  const allNames = [...new Set([...used.map((u) => u.name), ...exampleVars])].sort();

  const rows = allNames
    .map((name) => {
      const usage = used.find((u) => u.name === name);
      const inExample = exampleVars.has(name);
      const purpose = envPurpose(name);
      const required = envRequired(name);
      const sample = envSample(name);
      const files = usage?.files.slice(0, 3).join(", ") ?? "—";
      return `| \`${name}\` | ${purpose} | ${required} | \`${sample}\` | ${files} |`;
    })
    .join("\n");

  return `${section("Variables de entorno", 2)}> Sin secretos reales. Valores de ejemplo ficticios.

| Variable | Uso | Obligatoria | Ejemplo | Referenciada en |
|----------|-----|-------------|---------|-----------------|
${rows}

`;
}

function envPurpose(name: string): string {
  const map: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: "URL proyecto Supabase",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "Clave pública anon",
    SUPABASE_SERVICE_ROLE_KEY: "Service role (server/seed/rollback)",
    NEXT_PUBLIC_SITE_URL: "URL pública para redirects auth",
    DATABASE_URL: "Postgres directo para seed.sql",
    AUTH_INTERNAL_DOMAIN: "Dominio email sintético",
    CRON_SECRET: "Bearer token para endpoints `/api/cron/*`",
    NODE_ENV: "Entorno Node (cookies secure)",
    BSD_API_KEY: "API key Bzzoiro/BSD (lineups, live, headlines)",
    API_FOOTBALL_KEY: "API-Football (lineups confirmadas fallback)",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "Clave pública Web Push",
    VAPID_PRIVATE_KEY: "Clave privada Web Push",
    VAPID_SUBJECT: "mailto: para VAPID",
    FIFA_API_BASE_URL: "Base URL API FIFA (squads, MVP)",
    FIFA_SEASON_ID: "Season ID FIFA WC2026",
    WC2026_API_BASE: "Base URL feed worldcup2026",
    WC2026_API_TOKEN: "Token feed worldcup2026",
    ONBOARDING_ACCESS_CODES_JSON: "Mapa username→código acceso PWA",
    VERCEL_DEPLOYMENT_ID: "ID deploy Vercel (detección actualización PWA)",
    VERCEL_GIT_COMMIT_SHA: "SHA commit Vercel (fallback versión PWA)",
    QUIZ_DATE: "Fecha civil quiz para scripts seed/publish",
    POOL_SLUG: "Slug porra para scripts quiz/seed",
    CONFIRM_RESEED: "Flag `1` para permitir reseed quiz",
  };
  return map[name] ?? "Ver código";
}

function envRequired(name: string): string {
  const required = new Set([
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
  ]);
  if (required.has(name)) return "Sí";
  if (name === "NODE_ENV") return "Auto";
  return "Opcional";
}

function envSample(name: string): string {
  const map: Record<string, string> = {
    NEXT_PUBLIC_SUPABASE_URL: "https://xxxx.supabase.co",
    NEXT_PUBLIC_SUPABASE_ANON_KEY: "eyJhbG...anon",
    SUPABASE_SERVICE_ROLE_KEY: "eyJhbG...service",
    NEXT_PUBLIC_SITE_URL: "http://localhost:3000",
    DATABASE_URL: "postgresql://postgres:pass@host:5432/postgres",
    AUTH_INTERNAL_DOMAIN: "auth.trincadores.local",
    CRON_SECRET: "random-secret-string",
    NODE_ENV: "development",
    BSD_API_KEY: "bsd_xxxx",
    API_FOOTBALL_KEY: "af_xxxx",
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: "BExxxx...",
    VAPID_PRIVATE_KEY: "xxxx",
    VAPID_SUBJECT: "mailto:admin@example.com",
    FIFA_API_BASE_URL: "https://api.fifa.com",
    FIFA_SEASON_ID: "285023",
    WC2026_API_BASE: "https://api.example.com",
    WC2026_API_TOKEN: "token",
    ONBOARDING_ACCESS_CODES_JSON: '{"hector":"CODE1234"}',
    VERCEL_DEPLOYMENT_ID: "dpl_xxxx",
    VERCEL_GIT_COMMIT_SHA: "abc123",
    QUIZ_DATE: "2026-06-11",
    POOL_SLUG: "trincadores",
    CONFIRM_RESEED: "1",
  };
  return map[name] ?? "";
}

function buildIntegrations(pkg: ReturnType<typeof parsePackageJson>): string {
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };
  const rows = [
    ["Supabase", "Auth, Postgres, RLS, RPC", "@supabase/ssr, @supabase/supabase-js", "lib/supabase/*, actions/*"],
    ["Vercel", "Deploy + crons (live, quiz, lineups, push)", "—", "vercel.json, app/api/cron/*"],
    ["BSD (Bzzoiro)", "Lineups predicted/confirmed, live stats, headlines", "fetch nativo", "lib/lineup/sources/bsd-*, lib/live/sources/bsd-*"],
    ["FotMob", "Lineups confirmadas WC2026, MVP oficial", "fetch nativo", "lib/lineup/sources/fotmob-*, lib/live/sources/fotmob-*"],
    ["FIFA API", "Squads oficiales, MVP fallback", "fetch nativo", "lib/worldcup2026/fifa-squads.ts, lib/live/sources/fifa-*"],
    ["API-Football", "Lineups confirmadas fallback", "fetch nativo", "lib/lineup/sources/api-football-*"],
    ["YouTube RSS", "Resúmenes DAZN/FIFA/Teledeporte", "fetch nativo", "lib/youtube/*, cron youtube-highlights"],
    ["Web Push (VAPID)", "Notificaciones push navegador", "web-push", "lib/push/*, actions/push.ts"],
    ["Google Fonts", "Tipografía", "next/font", "app/layout.tsx"],
    ["lucide-react", "Iconos UI", deps["lucide-react"] ?? "", "components/layout/TabBar.tsx"],
    ["pg", "Seed SQL directo", deps.pg ?? "", "supabase/seed-auth.ts"],
  ]
    .map(([name, uso, pkgName, files]) => `| **${name}** | ${uso} | ${pkgName} | ${files} |`)
    .join("\n");

  return `${section("APIs e integraciones externas", 2)}| Integración | Para qué | Paquete | Archivos clave |
|-------------|----------|---------|----------------|
${rows}

**No integrado aún:** OpenAI/Anthropic (stub en \`lib/narrative/llm-provider.stub.ts\`), Stripe, Resend, Twilio, Clerk.

`;
}

function buildBusinessFlows(): string {
  return `${section("Flujos de negocio", 2)}${section("1. Registro y alta en porra", 3)}1. Usuario recibe código de invitación (\`invite_codes\`)
2. \`/register\` → \`signUpAndJoin\`
3. Supabase crea \`auth.users\` + \`profiles\`
4. RPC \`consume_invite_and_join\` valida código, inserta \`pool_members\` como \`player\`
5. Cookie \`tm_active_pool_id\` apunta a la porra

${section("2. Predicción de marcador", 3)}1. Jugador abre \`/predictions\` o detalle \`/predictions/:matchId\`
2. Sistema verifica \`prediction_edit_allowed\` (scheduled + T-5 min)
3. \`savePrediction\` upsert en \`predictions\`
4. Estado UI: \`empty\` → \`draft\` → \`saved\` → \`locked\`
5. Rivales visibles post-kickoff si \`prediction_visibility=kickoff\`

${section("3. Resultado y scoring (admin)", 3)}1. Admin en \`/admin\` introduce marcador oficial
2. \`submitMatchResult\` → upsert \`match_results\`, match → \`finished\`
3. RPC \`recalculate_match_points\` → actualiza \`points_awarded\`
4. RPC \`rebuild_pool_member_scores\` → acumulado por jornada + rank

${section("4. Ranking y home", 3)}1. Jornada de referencia = mayor \`sequence\` en \`matchdays\`
2. \`pool_member_scores\` alimenta \`/ranking\` y cards en home
3. Home muestra: posición, top 3, rival delante/detras, partidos pendientes

${section("5. Perfil público", 3)}1. \`/profile/:profileId\` muestra standing de un rival
2. Solo datos de porra compartida (RLS \`is_pool_member\`)

${section("6. Quiz diario", 3)}1. Cron \`quiz-daily\` abre/cierra día (Madrid 00:00 / 23:59)
2. Hub \`/quiz\` → play \`/quiz/play\` → result \`/quiz/result\`
3. RPC \`start_quiz_attempt\` / \`submit_quiz_attempt\` — un intento competitivo por día
4. Recordatorio push vía cron \`quiz-daily-reminder\`

${section("7. Alineaciones y MVP partido", 3)}1. Fuentes: FotMob (confirmada) → BSD → API-Football; predicted BSD
2. Cron \`lineup-prewarm\` precalienta XI confirmado T-90
3. Modal táctico en calendario/home; predicción MVP por dorsal (+5 pts)

${section("8. Partido en vivo y highlights", 3)}1. Cron \`live-matches\` (2 min): marcador/stats BSD → \`match_live_state\` + \`match_results\`
2. MVP oficial: FotMob → FIFA → BSD → \`match_results.mvp_*\`
3. Cron \`youtube-highlights\`: RSS DAZN/FIFA/Teledeporte → \`match_highlights\`
4. UI hero con reproductor in-app y titular \`highlight_headline\`

${section("9. Notificaciones (in-app + push)", 3)}4 kinds: pronóstico T-30, alineaciones confirmadas, quiz activo, recordatorio quiz diario.
\`savePushSubscriptionAction\` + VAPID en \`/api/push/vapid-key\`.

${section("10. Activity feed (pendiente fase 1e)", 3)}Tabla \`activity_events\` existe; ruta \`/activity\` retirada del TabBar (sustituida por Quiz).

`;
}

function buildConventions(): string {
  return `${section("Convenciones del proyecto", 2)}| Área | Convención |
|------|------------|
| Carpetas | \`app/\` rutas · \`actions/\` mutaciones · \`lib/{dominio}/\` lógica · \`components/{feature}/\` UI |
| Naming TS | PascalCase tipos · camelCase funciones · snake_case DB |
| Imports | Alias \`@/*\` → raíz |
| Componentes | Server por defecto; \`"use client"\` solo en forms/nav |
| Páginas auth | \`export const dynamic = "force-dynamic"\` |
| Errores actions | \`{ ok: false, error: string }\` en español |
| Lectura numérica | ZERO-DISPLAY: 0 → \`" "\` en vistas (\`formatAggregateStat\`) |
| Cookies | Prefijo \`tm_\` |
| CSS | Variables \`--tm-*\`, Tailwind only, \`rounded-xl\`, min 48px táctil |
| Validación | Duplicada TS (\`validation.ts\`) + RLS SQL |
| Tests | \`*.test.ts\` junto al módulo, runner nativo Node |

${section("Estructura de carpetas", 3)}\`\`\`
app/(app)/          → rutas autenticadas
app/(auth)/         → login, register, recover
actions/            → Server Actions
components/{feat}/  → UI por feature
lib/{dominio}/      → queries, validación, formato
types/database.ts   → tipos de dominio
supabase/migrations → esquema SQL versionado
docs/               → AUTH, RLS, SEED
\`\`\`

`;
}

function buildDependencies(pkg: ReturnType<typeof parsePackageJson>): string {
  const critical = [
    ["next", "Framework App Router, proxy, PWA", "Crítico — toda la app"],
    ["react", "UI", "Crítico"],
    ["@supabase/ssr", "Sesión SSR con cookies", "Crítico — auth y datos"],
    ["@supabase/supabase-js", "Cliente admin/seed", "Alto — operaciones privilegiadas"],
    ["tailwindcss", "Estilos v4", "Alto — todo el UI"],
    ["lucide-react", "Iconografía", "Medio — navegación"],
    ["tsx", "Tests y scripts seed", "Medio — DX"],
    ["pg", "Seed SQL", "Bajo — solo dev/seed"],
  ] as const;

  const rows = critical
    .map(([dep, motivo, impacto]) => {
      const ver = pkg.dependencies[dep] ?? pkg.devDependencies[dep] ?? "—";
      return `| \`${dep}\` ${ver} | ${motivo} | ${impacto} |`;
    })
    .join("\n");

  return `${section("Dependencias críticas", 2)}| Dependencia | Motivo | Impacto |
|-------------|--------|---------|
${rows}

`;
}

function buildRisks(): string {
  const allFiles = walkPaths(["app", "actions", "components", "lib", "supabase"], new Set([".ts", ".tsx", ".sql"]));
  const large = allFiles
    .filter((f) => f.lines >= LIMITS.maxFileLinesDetail)
    .sort((a, b) => b.lines - a.lines)
    .slice(0, LIMITS.maxLargeFiles);

  const components = walkDir(path.join(ROOT, "components"), { exts: new Set([".tsx"]) });
  const libFiles = walkDir(path.join(ROOT, "lib"), { exts: new Set([".ts", ".tsx"]) });
  const unused = findPossiblyUnusedFiles(components, libFiles);

  const largeRows = large.map((f) => `| \`${f.rel}\` | ${f.lines} | Revisar extracción |`).join("\n");
  const unusedRows = unused.map((f) => `- \`${f}\` — posible código muerto`).join("\n");

  return `${section("Riesgos técnicos detectados", 2)}${section("Archivos grandes", 3)}| Archivo | Líneas | Nota |
|---------|--------|------|
${largeRows || "| — | — | — |"}

${section("Código posiblemente sin uso", 3)}${unusedRows || "_Ninguno detectado._"}

${section("Deuda técnica conocida", 3)}| Item | Detalle |
|------|---------|
| PWA icons | Manifest referencia \`/icons/*.png\` inexistentes en \`public/\` |
| Recovery password | UI sin SMTP real |
| \`lib/narrative/*\` | Motor sin integrar en UI |
| API-Football free tier | Temporada 2026 no disponible; lineups vía BSD/FotMob |
| N+1 RPC | \`fetchEditableByMatchIds\` llama RPC por partido |
| Duplicación | Profile loading repetido en ranking y predictions |
| Timezone | \`formatKickoff\` usa \`new Date(iso)\` directo |
| Placeholders UEFA | 11 partidos sin mapeo BSD por placeholders \`3A/B/C/D/F\` |

`;
}

function buildStatus(): string {
  const status = readProjectStatus();
  const { completed, pending, phase } = parseStatusLists(status);
  const todos = grepTodos();

  const placeholders = walkPaths(["app"], new Set([".tsx"]))
    .filter((f) => {
      const text = readText(f.abs).toLowerCase();
      return (
        text.includes("placeholder") ||
        text.includes("próximamente") ||
        text.includes("proximamente") ||
        /feed\s+real|fase\s+2|ui\s+quiz/i.test(text)
      );
    })
    .map((f) => f.rel);

  return `${section("Estado actual del desarrollo", 2)}${section("Fase", 3)}**${phase}**

${section("Funcionalidades completadas", 3)}${completed.map((c) => `- [x] ${c}`).join("\n") || "_—_"}

${section("En desarrollo / pendiente", 3)}${pending.map((p) => `- [ ] ${p}`).join("\n") || "_—_"}

${section("Placeholders detectados", 3)}${placeholders.map((p) => `- \`${p}\``).join("\n") || "_Ninguno._"}

${section("TODOs / FIXMEs en código", 3)}${todos.length ? todos.map((t) => `- \`${t.file}:${t.line}\` — ${t.text}`).join("\n") : "_Sin comentarios TODO/FIXME en el código._"}

${section("Roadmap implícito", 3)}| Fase | Estado |
|------|--------|
| 0b Esquema + scoring SQL | ✅ |
| 1a Auth username + invites | ✅ |
| 1b Shell UI + PWA | ✅ |
| 1c Predicciones + admin | ✅ |
| 1d Ranking + home + rivales + perfil | ✅ |
| 1e Activity feed | 📅 |
| 2a Catálogo OpenFootball + import WC2026 | ✅ |
| 2b Datos externos (Fjelstul, squads, live, lineups, highlights) | ✅ |
| Quiz UI + gameplay + crons | ✅ |
| Push + notificaciones in-app | ✅ |
| Narrative/LLM | 📅 |

`;
}

function buildMeta(): string {
  return `${section("Meta", 2)}- **Generador:** \`npm run llm-context\` → \`scripts/generate-llm-context.ts\`
- **Auto-actualización:** manual (\`npm run llm-context\`). Hook git desactivado.
- **Archivos vigilados:** \`app/\`, \`app/api/\`, \`actions/\`, \`components/\`, \`lib/\`, \`types/\`, \`supabase/migrations/\`, \`docs/\`, configs raíz
- **Límites escalabilidad:** ${LIMITS.maxItemsPerGroup} ítems por grupo; archivos >${LIMITS.maxFileLinesDetail} líneas solo en riesgos

`;
}

export function generateLlMContext(): string {
  const pkg = parsePackageJson();

  const parts = [
    `# ${PROJECT_NAME} — LLM Context\n`,
    `> Documento auto-generado. No editar manualmente; usar \`npm run llm-context\`.\n`,
    buildExecutive(),
    buildArchitecture(pkg),
    buildFrontend(),
    buildBackend(),
    buildDatabase(),
    buildAuth(),
    buildEnv(),
    buildIntegrations(pkg),
    buildBusinessFlows(),
    buildConventions(),
    buildDependencies(pkg),
    buildRisks(),
    buildStatus(),
    buildMeta(),
  ];

  return parts.join("\n");
}

export function writeLlMContext(): { path: string; lines: number } {
  const content = generateLlMContext();
  const out = path.join(ROOT, OUTPUT_FILE);
  fs.writeFileSync(out, content, "utf8");
  return { path: out, lines: content.split("\n").length };
}
