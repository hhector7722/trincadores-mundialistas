# Trincadores Mundialistas — LLM Context

> Documento auto-generado. No editar manualmente; usar `npm run llm-context`.

## Resumen ejecutivo

> Fuente única de verdad para LLMs. Regenerado automáticamente. Última actualización: `2026-06-05T18:51:05.470Z`.

| Campo | Valor |
|-------|-------|
| **Nombre** | Trincadores Mundialistas |
| **Paquete npm** | `trincadores-mundialistas` v0.1.0 |
| **Objetivo** | PWA de porras privadas para el Mundial 2026: predicciones de marcador, ranking por jornada, administración de resultados |
| **Problema** | Centralizar quinielas entre amigos con reglas claras (8/5/3/0), visibilidad controlada de predicciones rivales y multi-porra |
| **Usuarios** | Jugadores (`player`), administradores de porra (`admin`), propietarios (`owner`) |
| **Fase actual** | 2a datos Mundial 2026 importados (OpenFootball) |
| **Stack** | Next.js 16 App Router · React 19 · Tailwind 4 · Supabase (Auth + Postgres + RLS) |

**Completado reciente:** 1d predicciones rivales en detalle partido · 1d perfil publico /profile/[profileId] · 1f acceso cerrado alias + codigo (sin registro abierto) · 1f purga demo + bootstrap 11 participantes reales · 2a catalogo OpenFootball (competitions, teams, host_cities, tournament_stages) · 2a import WC2026: 104 partidos, 23 matchdays, 48 equipos, 16 sedes

**Siguiente:** Fase 1e activity feed real


## Arquitectura

### Visión general

Monolito full-stack en **Next.js 16** con **Server Components** por defecto y **Server Actions** como única capa de mutación. No hay API Routes REST. La base de datos es la fuente de verdad del scoring; TypeScript replica la lógica solo para tests.

### Stack técnico

| Capa | Tecnología |
|------|------------|
| Framework | Next.js 16.2.7 (App Router, `proxy.ts`) |
| Runtime | Node.js (server) + React 19 (client mínimo) |
| Lenguaje | TypeScript 5 (strict) |
| Estilos | Tailwind CSS 4 + variables CSS `--tm-*` |
| Backend datos | Supabase Postgres + RLS + RPC security definer |
| Auth | Supabase Auth con emails sintéticos por username |
| Deploy | Vercel (`vercel.json`) |
| Tests | Node test runner vía `tsx --test` |

### Patrón arquitectónico

- **Route groups:** `(app)` autenticado con shell, `(auth)` formularios públicos
- **Dominio en `lib/{modulo}/`:** queries, validación, formato
- **Mutaciones en `actions/`:** discriminated union `{ ok: true } | { ok: false, error }`
- **Protección en 3 capas:** `proxy.ts` → layout `(app)` → RLS Postgres

### Flujo de datos

```mermaid
flowchart TB
  subgraph Client["Cliente (mínimo)"]
    Forms["Formularios client\nLogin, Register, PredictionForm"]
    TabBar["TabBar / PoolSwitcher"]
  end

  subgraph Next["Next.js Server"]
    Pages["Server Components\napp/(app)/*"]
    Actions["Server Actions\nactions/*"]
    Lib["lib/*/queries.ts"]
    Proxy["proxy.ts\nupdateSession"]
  end

  subgraph Supabase["Supabase"]
    Auth["Auth (JWT + cookies)"]
    PG["Postgres + RLS"]
    RPC["RPC functions\nscoring, invites, quiz"]
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
```


## Frontend

### Resumen

- **Sin** hooks globales, Context API, Zustand ni React Query
- Estado client solo en formularios y navegación (`useState`, `useTransition`, `useRouter`, `usePathname`)
- PWA: `app/manifest.ts`, iconos dinámicos `icon.tsx` / `apple-icon.tsx`
- Diseño: panel claro, cobalto `#0047FF`, lima solo LIVE, targets táctiles 48px+

### Rutas (pages)

| Ruta | Archivo | Render |
|------|---------|--------|
| `/activity` | `app/(app)/activity/page.tsx` | force-dynamic |
| `/admin` | `app/(app)/admin/page.tsx` | force-dynamic |
| `/` | `app/(app)/page.tsx` | force-dynamic |
| `/predictions/:matchId` | `app/(app)/predictions/[matchId]/page.tsx` | force-dynamic |
| `/predictions` | `app/(app)/predictions/page.tsx` | force-dynamic |
| `/profile/:profileId` | `app/(app)/profile/[profileId]/page.tsx` | force-dynamic |
| `/profile` | `app/(app)/profile/page.tsx` | force-dynamic |
| `/quiz` | `app/(app)/quiz/page.tsx` | force-dynamic |
| `/ranking` | `app/(app)/ranking/page.tsx` | force-dynamic |
| `/login` | `app/(auth)/login/page.tsx` | default |

### Layouts

| Archivo | Rol |
|---------|-----|
| `app/(app)/layout.tsx` | Auth/pool guard |
| `app/(auth)/layout.tsx` | Shell visual |
| `app/layout.tsx` | Shell visual |

### Componentes por módulo

#### admin

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AdminResultForm` | `components/admin/AdminResultForm.tsx` | client | AdminResultForm |

#### auth

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `LoginForm` | `components/auth/LoginForm.tsx` | client | LoginForm |
| `LoginHero` | `components/auth/LoginHero.tsx` | server | LoginHero |

#### home

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `BackgroundPlayerLayer` | `components/home/BackgroundPlayerLayer.tsx` | server | BackgroundPlayerLayer |
| `HomeAtmosphere` | `components/home/HomeAtmosphere.tsx` | server | HomeAtmosphere |
| `HomeHero` | `components/home/HomeHero.tsx` | server | HomeHero |
| `HomeHeroCarousel` | `components/home/HomeHeroCarousel.tsx` | client | HomeHeroCarousel |
| `HomeNextMatch` | `components/home/HomeNextMatch.tsx` | client | HomeNextMatch |
| `HomeStandingCard` | `components/home/HomeStandingCard.tsx` | server | HomeStandingCard |
| `HomeTopThree` | `components/home/HomeTopThree.tsx` | server | HomeTopThree |

#### layout

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AppBrandTitle` | `components/layout/AppBrandTitle.tsx` | server | AppBrandTitle |
| `AppHeader` | `components/layout/AppHeader.tsx` | server | AppHeader |
| `AppShell` | `components/layout/AppShell.tsx` | server | AppShell |
| `PoolSwitcher` | `components/layout/PoolSwitcher.tsx` | client | PoolSwitcher |
| `TabBar` | `components/layout/TabBar.tsx` | client | TabBar |

#### match

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchRow` | `components/match/MatchRow.tsx` | server | MatchRow |

#### matches

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchTeamsDisplay` | `components/matches/MatchTeamsDisplay.tsx` | server | MatchTeamsDisplay |

#### predictions

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchPredictionCard` | `components/predictions/MatchPredictionCard.tsx` | server | MatchPredictionCard |
| `PeerPredictionsList` | `components/predictions/PeerPredictionsList.tsx` | server | PeerPredictionsList |
| `PredictionDeadlineCountdown` | `components/predictions/PredictionDeadlineCountdown.tsx` | client | PredictionDeadlineCountdown |
| `PredictionForm` | `components/predictions/PredictionForm.tsx` | client | PredictionForm |
| `PredictionsCalendar` | `components/predictions/PredictionsCalendar.tsx` | client | PredictionsCalendar |
| `PredictionStatusBadge` | `components/predictions/PredictionStatusBadge.tsx` | server | PredictionStatusBadge |
| `QuickPredictionModal` | `components/predictions/QuickPredictionModal.tsx` | client | QuickPredictionModal |
| `ScoreStepper` | `components/predictions/ScoreStepper.tsx` | client | ScoreStepper |
| `TeamFlagBadge` | `components/predictions/TeamFlagBadge.tsx` | server | TeamFlagBadge |

#### profile

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MemberStandingCard` | `components/profile/MemberStandingCard.tsx` | server | MemberStandingCard |
| `ProfileAvatar` | `components/profile/ProfileAvatar.tsx` | server | ProfileAvatar |

#### ranking

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `PositionTrendIndicator` | `components/ranking/PositionTrendIndicator.tsx` | server | PositionTrendIndicator |
| `RankingRow` | `components/ranking/RankingRow.tsx` | server | RankingRow |
| `RankingTable` | `components/ranking/RankingTable.tsx` | server | RankingTable |

#### ui

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `badge` | `components/ui/badge.tsx` | server | Badge |
| `button` | `components/ui/button.tsx` | server | Button |
| `card` | `components/ui/card.tsx` | server | Card |
| `input` | `components/ui/input.tsx` | server | Input |
| `modal` | `components/ui/modal.tsx` | client | Modal |


### Gestión de estado

| Mecanismo | Ubicación | Uso |
|-----------|-----------|-----|
| Cookie httpOnly | `tm_active_pool_id` | Porra activa multi-pool |
| Supabase session | cookies SSR | Auth global |
| Server cache | `cache()` en pool context | Dedup por request |
| Client local | formularios | Draft de predicción antes de guardar |


## Backend

### Resumen

No existen `app/api/*` routes. Toda la lógica server-side usa Server Actions + queries en `lib/`.

### Server Actions

| Función | Archivo | Firma (resumen) |
|---------|---------|-----------------|
| `submitMatchResult` | `actions/admin.ts` | `export async function submitMatchResult( poolId: string, matchId: string, homeGo` |
| `regenerateAccessCode` | `actions/admin.ts` | `export async function regenerateAccessCode( poolId: string, targetUsername: stri` |
| `AdminActionResult` | `actions/admin.ts` | `AdminActionResult` |
| `signIn` | `actions/auth.ts` | `export async function signIn( usernameRaw: string, accessCodeRaw: string ): Prom` |
| `signOut` | `actions/auth.ts` | `export async function signOut(): Promise<void> ` |
| `setActivePool` | `actions/auth.ts` | `export async function setActivePool(poolId: string): Promise<AuthActionResult> ` |
| `AuthActionResult` | `actions/auth.ts` | `AuthActionResult` |
| `savePrediction` | `actions/predictions.ts` | `export async function savePrediction( poolId: string, matchId: string, homeGoals` |
| `PredictionActionResult` | `actions/predictions.ts` | `PredictionActionResult` |

### Detalle de acciones

| Acción | Recibe | Devuelve | Dependencias |
|--------|--------|----------|--------------|
| `signIn` | username, password | `{ok}` o error | Supabase Auth, cookie pool |
| `signUpAndJoin` | FormData (invite, user, pass, displayName) | `{ok}` o error | signUp → profile → RPC `consume_invite_and_join` |
| `signOut` | — | redirect `/login` | signOut + clear cookie |
| `requestPasswordReset` | username | siempre `{ok:true}` | resetPasswordForEmail (requiere SMTP) |
| `setActivePool` | poolId uuid | `{ok}` o error | valida membresía, cookie |
| `savePrediction` | poolId, matchId, goles | marcador guardado o error | RLS + `prediction_edit_allowed` |
| `submitMatchResult` | poolId, matchId, goles | `{ok}` o error | admin check + RPC scoring |

### Proxy / Middleware

| Archivo | Rol |
|---------|-----|
| `proxy.ts` | Entry Next 16: delega en `updateSession` |
| `lib/supabase/middleware.ts` | Refresca sesión; redirect auth/no-auth |

### Módulos lib/ (capa de datos)

**auth/** — 5 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/auth/access-code.ts` | 24 líneas | generateAccessCode, normalizeAccessCode, validateAccessCode, ACCESS_CODE_LENGTH |
| `lib/auth/credentials.ts` | 21 líneas | getAuthInternalDomain, toAuthEmail, fromAuthEmail |
| `lib/auth/participants.ts` | 26 líneas | REAL_POOL_SLUG, REAL_POOL_NAME, ParticipantSeed |
| `lib/auth/session.ts` | 41 líneas | getActivePoolIdFromCookie, setActivePoolCookie, clearActivePoolCookie, resolvePoolMemberships, ACTIVE_POOL_COOKIE, PoolMembershipResolution |
| `lib/auth/validation.ts` | 13 líneas | normalizeUsername, validateUsername, USERNAME_REGEX |

**dev/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/dev/seed-ids.ts` | 32 líneas | DEV_SEED_PASSWORD, SEED_USER_IDS, SEED_POOL_ID, SEED_MATCHDAY_ID, SEED_MATCH_FINISHED_ID, SEED_MATCH_LIVE_ID, SEED_MATCH_SCHEDULED_ID, SEED_QUIZ_ID, SEED_INVITE_CODE_ID |

**narrative/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/narrative/engine.ts` | 25 líneas | NarrativeEngineOptions |
| `lib/narrative/llm-provider.stub.ts` | 10 líneas | — |
| `lib/narrative/template-provider.ts` | 16 líneas | — |
| `lib/narrative/types.ts` | 22 líneas | NarrativeTone, NarrativeContext, NarrativeItem |

**openfootball/** — 6 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/openfootball/kickoff.ts` | 65 líneas | parseDateKey, parseUtcOffset, buildKickoffIso |
| `lib/openfootball/parse-cup-finals.ts` | 107 líneas | parseCupFinalsTxt |
| `lib/openfootball/parse-football-txt.ts` | 193 líneas | parseCupTxt |
| `lib/openfootball/parse-stadiums-csv.ts` | 59 líneas | parseStadiumsCsv |
| `lib/openfootball/slug.ts` | 52 líneas | toSlug, teamExternalKey, cityExternalKey, groupStageKey, calendarMatchdayKey, poolMatchdayKey, knockoutRoundKey, groupMatchId, knockoutMatchId, isPlaceholderTeam |
| `lib/openfootball/types.ts` | 70 líneas | COMPETITION_CODE, COMPETITION_YEAR, SOURCE_PATH, ParsedStadium, ParsedTeam, StageType, ParsedStage, ParsedMatch, ParsedCalendarMatchday, ParseFootballTxtResult, ParseCupFinalsResult |

**pool/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/pool/active-pool.ts` | 72 líneas | loadAppShellContext, assertPoolMembership, UserPool, AppShellContext |
| `lib/pool/admin.ts` | 31 líneas | isPoolAdmin, isPoolOwner |
| `lib/pool/calendar-layout.ts` | 103 líneas | getMaxMatchesInMonthGrid, fitCalendarLayout, resetCalendarLayout, CalendarLayoutResult |
| `lib/pool/format-kickoff.ts` | 11 líneas | formatKickoff |
| `lib/pool/match-calendar.ts` | 198 líneas | kickoffDateKey, toMonthKey, parseMonthKey, formatCalendarDayLabel, formatCalendarMonthLabel, formatMonthYearLabel, formatMonthLabel, formatKickoffTime, indexMatchesByDate, getMonthRangeFromMatches, getInitialMonthYear, shiftMonth, compareMonth, buildMonthGrid, groupMatchesByDay, WEEKDAY_LABELS, CalendarMatchLike, MatchDayGroup, CalendarCell, CalendarWeek, MonthYear |
| `lib/pool/queries.ts` | 44 líneas | getPoolMatches, PoolMatchRow |
| `lib/pool/require-context.ts` | 29 líneas | requireActivePoolContext, getCachedAppShellContext |

**predictions/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/predictions/deadline.ts` | 27 líneas | predictionLockDeadlineMs, formatPredictionCountdown, PREDICTION_LOCK_MINUTES |
| `lib/predictions/edit-state.ts` | 54 líneas | resolvePredictionUiState, displayGoals, formatListScore, NO_PREDICTION_LABEL, PredictionUiState, PredictionUiInput |
| `lib/predictions/queries.ts` | 287 líneas | assertMatchInPool, fetchMatchEditableFromDb, getPoolMatchesWithPredictions, getMatchPredictionDetail, countPendingPredictions, getAdminOpenMatches, getPeerPredictionsForMatch, computePredictionEditableLocally, arePeerPredictionsLikelyVisible, MatchWithPrediction, MatchDetail, AdminOpenMatch, PeerPredictionRow |
| `lib/predictions/validation.ts` | 24 líneas | parseGoalValue, validatePredictionGoals, MAX_GOALS |

**quiz/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/quiz/module.contract.ts` | 3 líneas | QuizModuleContract |

**ranking/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/ranking/format.ts` | 4 líneas | formatAggregateStat |
| `lib/ranking/queries.ts` | 355 líneas | getReferenceMatchday, getReferenceMatchdayId, getPoolLeaderboard, getMemberStanding, memberStandingFromLeaderboard, ReferenceMatchday, PositionTrend, LeaderboardRow, MemberStanding |
| `lib/ranking/reliability.ts` | 17 líneas | computeReliabilityPct, formatReliabilityPct, MAX_POINTS_PER_MATCH |

**scoring/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/scoring/compute.ts` | 36 líneas | matchOutcome, computeMatchPoints, ScoreInput |

**scripts/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/scripts/env-guard.ts` | 44 líneas | getProjectRef, assertProjectRef, assertServiceEnv, assertPurgeConfirmed, assertBootstrapAllowed, assertImportAllowed |

**supabase/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/supabase/admin.ts` | 16 líneas | createAdminClient |
| `lib/supabase/client.ts` | 11 líneas | createClient |
| `lib/supabase/middleware.ts` | 55 líneas | updateSession |
| `lib/supabase/server.ts` | 30 líneas | createClient |

**teams/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/teams/display.ts` | 82 líneas | teamNameEs, teamAbbr, formatMatchCalendarAbbr |
| `lib/teams/flags.ts` | 62 líneas | teamFlagCode, teamFlagUrl |

**utils.ts/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/utils.ts` | 4 líneas | cn |


### Jobs / Cron / Webhooks

| Tipo | Estado |
|------|--------|
| Vercel Cron | `vercel.json` → `crons: []` (vacío) |
| Edge Functions Supabase | No implementadas |
| Webhooks | No implementados |
| RPC batch | `expire_stale_quiz_attempts`, `generate_news_batch` (stub) preparados en SQL |


## Base de datos

### Resumen

| Aspecto | Valor |
|---------|-------|
| ORM | **Ninguno** — SQL directo vía Supabase JS + RPC |
| Migraciones | 7 archivos en `supabase/migrations/` |
| Tablas | 25 |
| Enums | match_status, pool_member_role, pool_member_role_new, quiz_attempt_status |
| Funciones SQL | 13 |
| Políticas RLS | 0 |
| Vistas | quiz_leaderboard, quiz_questions_public |

### Diagrama ER (simplificado)

```mermaid
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
```

### Tablas

| Tabla | Descripción funcional | Seguridad |
|-------|----------------------|-----------|
| `achievements` | Catálogo de logros | RLS habilitado |
| `activity_events` | Eventos para feed de actividad (fase 1e) | RLS habilitado |
| `admin_audit_log` | Auditoría acciones administrativas | RLS habilitado |
| `competitions` | Ver migraciones SQL | RLS habilitado |
| `host_cities` | Ver migraciones SQL | RLS habilitado |
| `invite_codes` | Códigos de invitación (solo RPC, sin SELECT directo) | RLS habilitado |
| `match_results` | Marcador oficial (1:1 con match) | RLS habilitado |
| `matchdays` | Jornadas de competición dentro de una porra | RLS habilitado |
| `matches` | Partidos con kickoff, equipos y status | RLS habilitado |
| `news_items` | Noticias/narrativa generada por pool | RLS habilitado |
| `notifications` | Notificaciones in-app por usuario | RLS habilitado |
| `pool_member_scores` | Puntos acumulados y rank por jornada | RLS habilitado |
| `pool_members` | Membresía N:M con rol owner/admin/player | RLS habilitado |
| `pools` | Porra privada con settings_json (visibilidad predicciones) | RLS habilitado |
| `predictions` | Predicción de marcador por usuario/partido/porra | RLS habilitado |
| `profile_achievements` | Logros desbloqueados por perfil | RLS habilitado |
| `profiles` | Perfil 1:1 con auth.users (username, display_name) | RLS habilitado |
| `push_subscriptions` | Suscripciones Web Push (pendiente) | RLS habilitado |
| `quiz_attempts` | Intento de quiz por usuario | RLS habilitado |
| `quiz_question_keys` | Respuestas correctas (acceso revocado) | RLS habilitado |
| `quiz_questions` | Preguntas de un quiz | RLS habilitado |
| `quiz_responses` | Respuestas individuales por intento | RLS habilitado |
| `quizzes` | Cuestionarios opcionales por porra | RLS habilitado |
| `teams` | Ver migraciones SQL | RLS habilitado |
| `tournament_stages` | Ver migraciones SQL | RLS habilitado |

### Enums

- `match_status`
- `pool_member_role`
- `pool_member_role_new`
- `quiz_attempt_status`

### Funciones SQL críticas

| Función | Propósito |
|---------|-----------|
| `compute_match_points` | Scoring 8/5/3/0 exclusivo |
| `prediction_edit_allowed` | Bloqueo T-5 min antes kickoff |
| `can_view_peer_predictions` | Visibilidad rivales según settings |
| `recalculate_match_scores` | Propaga puntos tras resultado |
| `rebuild_pool_member_scores` | Ranking por jornada + acumulado |
| `consume_invite_and_join` | Registro con código invitación |
| `start_quiz_attempt` / `submit_quiz_attempt` | Flujo quiz sin exponer respuestas |

### Todas las funciones detectadas

| Función | Tipo |
|---------|------|
| `can_view_peer_predictions` | RPC / trigger |
| `compute_match_points` | RPC / trigger |
| `consume_invite_and_join` | RPC / trigger |
| `expire_stale_quiz_attempts` | RPC / trigger |
| `generate_news_batch` | RPC / trigger |
| `is_pool_admin` | RPC / trigger |
| `is_pool_member` | RPC / trigger |
| `is_pool_owner` | RPC / trigger |
| `prediction_edit_allowed` | RPC / trigger |
| `rebuild_pool_member_scores` | RPC / trigger |
| `recalculate_match_scores` | RPC / trigger |
| `start_quiz_attempt` | RPC / trigger |
| `submit_quiz_attempt` | RPC / trigger |

### Migraciones

- `supabase/migrations/20260604220000_initial_schema.sql` (661 líneas)
- `supabase/migrations/20260604230000_schema_0b1_alignments.sql` (193 líneas)
- `supabase/migrations/20260604231000_schema_0b2_rls_defaults.sql` (25 líneas)
- `supabase/migrations/20260605000000_phase_1a_auth_rpc.sql` (61 líneas)
- `supabase/migrations/20260605120000_phase_1f_closed_access.sql` (14 líneas)
- `supabase/migrations/20260605140000_openfootball_catalog.sql` (85 líneas)
- `supabase/migrations/20260605150000_openfootball_grants.sql` (12 líneas)

Documentación RLS ampliada: `docs/RLS_NOTES.md`


## Autenticación

### Proveedor

**Supabase Auth** con emails internos: `{username}@{AUTH_INTERNAL_DOMAIN}` (default `auth.trincadores.local`). La UI nunca muestra email.

### Roles

| Rol | Permisos |
|-----|----------|
| `player` | Predicciones, ranking, perfiles |
| `admin` | + resultados oficiales, gestión miembros (RLS) |
| `owner` | Igual que admin vía `is_pool_admin` |

### Protección de rutas

```mermaid
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
```

### Flujo login/registro

1. **Login:** username → `toAuthEmail()` → `signInWithPassword` → cookie pool si una sola membresía
2. **Registro:** código invite → signUp → insert `profiles` → RPC `consume_invite_and_join` → rollback `deleteUser` si falla
3. **Logout:** signOut + borrar cookie `tm_active_pool_id`
4. **Recovery:** técnico; requiere SMTP real (no operativo en dev)


## Variables de entorno

> Sin secretos reales. Valores de ejemplo ficticios.

| Variable | Uso | Obligatoria | Ejemplo | Referenciada en |
|----------|-----|-------------|---------|-----------------|
| `ALLOW_BOOTSTRAP` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `ALLOW_IMPORT` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `AUTH_INTERNAL_DOMAIN` | Dominio email sintético | Opcional | `auth.trincadores.local` | lib/auth/credentials.ts |
| `CONFIRM_PURGE` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `CONFIRM_REIMPORT` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `CRON_SECRET` | Protección endpoints cron (sin uso aún) | Opcional | `random-secret-string` | — |
| `DATABASE_URL` | Postgres directo para seed.sql | Opcional | `postgresql://postgres:pass@host:5432/postgres` | — |
| `NEXT_PUBLIC_SITE_URL` | URL pública para redirects auth | Opcional | `http://localhost:3000` | — |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon | Sí | `eyJhbG...anon` | lib/supabase/client.ts, lib/supabase/middleware.ts, lib/supabase/server.ts |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto Supabase | Sí | `https://xxxx.supabase.co` | lib/scripts/env-guard.ts, lib/supabase/admin.ts, lib/supabase/client.ts |
| `NODE_ENV` | Entorno Node (cookies secure) | Auto | `development` | lib/auth/session.ts |
| `OPENFOOTBALL_DIR` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `POOL_SLUG` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server/seed/rollback) | Sí | `eyJhbG...service` | lib/scripts/env-guard.ts, lib/supabase/admin.ts, scripts/bootstrap-participants.ts |


## APIs e integraciones externas

| Integración | Para qué | Paquete | Archivos clave |
|-------------|----------|---------|----------------|
| **Supabase** | Auth, Postgres, RLS, RPC | @supabase/ssr, @supabase/supabase-js | lib/supabase/*, actions/* |
| **Vercel** | Deploy + crons (vacíos) | — | vercel.json |
| **Google Fonts** | Tipografía | next/font | app/layout.tsx |
| **lucide-react** | Iconos UI | ^1.17.0 | components/layout/TabBar.tsx |
| **pg** | Seed SQL directo | ^8.21.0 | supabase/seed-auth.ts |

**No integrado aún:** OpenAI/Anthropic (stub en `lib/narrative/llm-provider.stub.ts`), Stripe, Resend, Twilio, Clerk, push notifications.


## Flujos de negocio

### 1. Registro y alta en porra

1. Usuario recibe código de invitación (`invite_codes`)
2. `/register` → `signUpAndJoin`
3. Supabase crea `auth.users` + `profiles`
4. RPC `consume_invite_and_join` valida código, inserta `pool_members` como `player`
5. Cookie `tm_active_pool_id` apunta a la porra

### 2. Predicción de marcador

1. Jugador abre `/predictions` o detalle `/predictions/:matchId`
2. Sistema verifica `prediction_edit_allowed` (scheduled + T-5 min)
3. `savePrediction` upsert en `predictions`
4. Estado UI: `empty` → `draft` → `saved` → `locked`
5. Rivales visibles post-kickoff si `prediction_visibility=kickoff`

### 3. Resultado y scoring (admin)

1. Admin en `/admin` introduce marcador oficial
2. `submitMatchResult` → upsert `match_results`, match → `finished`
3. RPC `recalculate_match_points` → actualiza `points_awarded`
4. RPC `rebuild_pool_member_scores` → acumulado por jornada + rank

### 4. Ranking y home

1. Jornada de referencia = mayor `sequence` en `matchdays`
2. `pool_member_scores` alimenta `/ranking` y cards en home
3. Home muestra: posición, top 3, rival delante/detras, partidos pendientes

### 5. Perfil público

1. `/profile/:profileId` muestra standing de un rival
2. Solo datos de porra compartida (RLS `is_pool_member`)

### 6. Quiz (esquema listo, UI pendiente)

1. RPC `start_quiz_attempt` devuelve preguntas sin respuestas
2. Usuario responde → `submit_quiz_attempt`
3. Máx 3 puntos, un intento por quiz, expiración 30 min

### 7. Activity feed (pendiente fase 1e)

Tabla `activity_events` existe; UI `/activity` es placeholder.


## Convenciones del proyecto

| Área | Convención |
|------|------------|
| Carpetas | `app/` rutas · `actions/` mutaciones · `lib/{dominio}/` lógica · `components/{feature}/` UI |
| Naming TS | PascalCase tipos · camelCase funciones · snake_case DB |
| Imports | Alias `@/*` → raíz |
| Componentes | Server por defecto; `"use client"` solo en forms/nav |
| Páginas auth | `export const dynamic = "force-dynamic"` |
| Errores actions | `{ ok: false, error: string }` en español |
| Lectura numérica | ZERO-DISPLAY: 0 → `" "` en vistas (`formatAggregateStat`) |
| Cookies | Prefijo `tm_` |
| CSS | Variables `--tm-*`, Tailwind only, `rounded-xl`, min 48px táctil |
| Validación | Duplicada TS (`validation.ts`) + RLS SQL |
| Tests | `*.test.ts` junto al módulo, runner nativo Node |

### Estructura de carpetas

```
app/(app)/          → rutas autenticadas
app/(auth)/         → login, register, recover
actions/            → Server Actions
components/{feat}/  → UI por feature
lib/{dominio}/      → queries, validación, formato
types/database.ts   → tipos de dominio
supabase/migrations → esquema SQL versionado
docs/               → AUTH, RLS, SEED
```


## Dependencias críticas

| Dependencia | Motivo | Impacto |
|-------------|--------|---------|
| `next` 16.2.7 | Framework App Router, proxy, PWA | Crítico — toda la app |
| `react` 19.2.4 | UI | Crítico |
| `@supabase/ssr` ^0.10.3 | Sesión SSR con cookies | Crítico — auth y datos |
| `@supabase/supabase-js` ^2.107.0 | Cliente admin/seed | Alto — operaciones privilegiadas |
| `tailwindcss` ^4 | Estilos v4 | Alto — todo el UI |
| `lucide-react` ^1.17.0 | Iconografía | Medio — navegación |
| `tsx` ^4.22.4 | Tests y scripts seed | Medio — DX |
| `pg` ^8.21.0 | Seed SQL | Bajo — solo dev/seed |


## Riesgos técnicos detectados

### Archivos grandes

| Archivo | Líneas | Nota |
|---------|--------|------|
| `supabase/migrations/20260604220000_initial_schema.sql` | 661 | Revisar extracción |
| `lib/ranking/queries.ts` | 355 | Revisar extracción |

### Código posiblemente sin uso

- `components/home/BackgroundPlayerLayer.tsx` — posible código muerto
- `components/home/HomeStandingCard.tsx` — posible código muerto
- `components/home/HomeTopThree.tsx` — posible código muerto
- `components/match/MatchRow.tsx` — posible código muerto
- `components/predictions/MatchPredictionCard.tsx` — posible código muerto
- `lib/auth/participants.ts` — posible código muerto
- `lib/dev/seed-ids.ts` — posible código muerto
- `lib/narrative/engine.ts` — posible código muerto
- `lib/scripts/env-guard.ts` — posible código muerto
- `lib/supabase/client.ts` — posible código muerto

### Deuda técnica conocida

| Item | Detalle |
|------|---------|
| PWA icons | Manifest referencia `/icons/*.png` inexistentes en `public/` |
| Recovery password | UI sin SMTP real |
| `lib/supabase/client.ts` | Browser client sin imports |
| `lib/narrative/*` | Motor sin integrar en UI |
| `CRON_SECRET` | Definida pero sin endpoints |
| N+1 RPC | `fetchEditableByMatchIds` llama RPC por partido |
| Duplicación | Profile loading repetido en ranking y predictions |
| Timezone | `formatKickoff` usa `new Date(iso)` directo |


## Estado actual del desarrollo

### Fase

**2a datos Mundial 2026 importados (OpenFootball)**

### Funcionalidades completadas

- [x] 1a auth
- [x] 1b shell UI + 1b.1 PWA
- [x] 1c predicciones + admin minimo + 1c.1 hotfix
- [x] 1d ranking real (pool_member_scores)
- [x] 1d home: tu sitio, top 3, delante/detras
- [x] 1d predicciones rivales en detalle partido
- [x] 1d perfil publico /profile/[profileId]
- [x] 1f acceso cerrado alias + codigo (sin registro abierto)
- [x] 1f purga demo + bootstrap 11 participantes reales
- [x] 2a catalogo OpenFootball (competitions, teams, host_cities, tournament_stages)
- [x] 2a import WC2026: 104 partidos, 23 matchdays, 48 equipos, 16 sedes

### En desarrollo / pendiente

- [ ] Fase 1e activity feed real
- [ ] Entregar codigos de acceso al grupo (access-codes.local.txt)

### Placeholders detectados

- `app/(app)/quiz/page.tsx`

### TODOs / FIXMEs en código

_Sin comentarios TODO/FIXME en el código._

### Roadmap implícito

| Fase | Estado |
|------|--------|
| 0b Esquema + scoring SQL | ✅ |
| 1a Auth username + invites | ✅ |
| 1b Shell UI + PWA | ✅ |
| 1c Predicciones + admin | ✅ |
| 1d Ranking + home + rivales + perfil | ✅ |
| 1e Activity feed | 📅 |
| 2 Quiz UI + narrative/LLM | 📅 |


## Meta

- **Generador:** `npm run llm-context` → `scripts/generate-llm-context.ts`
- **Auto-actualización:** hook git pre-commit (si cambian archivos vigilados)
- **Archivos vigilados:** `app/`, `actions/`, `components/`, `lib/`, `types/`, `supabase/migrations/`, `docs/`, configs raíz
- **Límites escalabilidad:** 40 ítems por grupo; archivos >300 líneas solo en riesgos

