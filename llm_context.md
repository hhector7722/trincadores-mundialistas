# Trincadores Mundialistas — LLM Context

> Documento auto-generado. No editar manualmente; usar `npm run llm-context`.

## Resumen ejecutivo

> Fuente única de verdad para LLMs. Regenerado automáticamente. Última actualización: `2026-06-07T11:53:18.675Z`.

| Campo | Valor |
|-------|-------|
| **Nombre** | Trincadores Mundialistas |
| **Paquete npm** | `trincadores-mundialistas` v0.1.0 |
| **Objetivo** | PWA de porras privadas para el Mundial 2026: predicciones de marcador, ranking por jornada, administración de resultados |
| **Problema** | Centralizar quinielas entre amigos con reglas claras (8/5/3/0), visibilidad controlada de predicciones rivales y multi-porra |
| **Usuarios** | Jugadores (`player`), administradores de porra (`admin`), propietarios (`owner`) |
| **Fase actual** | 2b datos externos Mundiales (Fjelstul + worldcup2026 feed) |
| **Stack** | Next.js 16 App Router · React 19 · Tailwind 4 · Supabase (Auth + Postgres + RLS) |

**Completado reciente:** Slide home quiz en hero carousel · Quiz auto-generacion: banco hechos + plantillas + generate-day + seed integrado · Quiz training rejugable (migracion RPC/índice) · Bonus deprecado en UI/seed · Quiz gameplay rapido: timer 10s, feedback inmediato, auto-submit, resultado minimo · Quiz generador: distractores semanticos + owner replay ilimitado

**Siguiente:** Mejorar match-mapper cuando se resuelvan placeholders UEFA en worldcup2026


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
| `/predictions/knockout` | `app/(app)/predictions/knockout/page.tsx` | force-dynamic |
| `/predictions` | `app/(app)/predictions/page.tsx` | force-dynamic |
| `/profile/:profileId` | `app/(app)/profile/[profileId]/page.tsx` | force-dynamic |
| `/profile` | `app/(app)/profile/page.tsx` | force-dynamic |
| `/quiz/leaderboard` | `app/(app)/quiz/leaderboard/page.tsx` | force-dynamic |
| `/quiz` | `app/(app)/quiz/page.tsx` | force-dynamic |
| `/quiz/play` | `app/(app)/quiz/play/page.tsx` | force-dynamic |
| `/quiz/result` | `app/(app)/quiz/result/page.tsx` | force-dynamic |
| `/ranking` | `app/(app)/ranking/page.tsx` | force-dynamic |
| `/teams/:teamSlug/lineup` | `app/(app)/teams/[teamSlug]/lineup/page.tsx` | force-dynamic |
| `/login` | `app/(auth)/login/page.tsx` | default |

### Layouts

| Archivo | Rol |
|---------|-----|
| `app/(app)/layout.tsx` | Auth/pool guard |
| `app/(app)/predictions/layout.tsx` | Shell visual |
| `app/(app)/ranking/layout.tsx` | Shell visual |
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
| `AppHeaderGate` | `components/layout/AppHeaderGate.tsx` | client | AppHeaderGate |
| `AppShell` | `components/layout/AppShell.tsx` | server | AppShell |
| `BrandLogo` | `components/layout/BrandLogo.tsx` | server | BrandLogo, BrandLogoFixed |
| `PoolSwitcher` | `components/layout/PoolSwitcher.tsx` | client | PoolSwitcher |
| `TabBar` | `components/layout/TabBar.tsx` | client | TabBar |
| `ViewportMetricsSync` | `components/layout/ViewportMetricsSync.tsx` | client | ViewportMetricsSync |

#### lineup

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `EntityModalController` | `components/lineup/EntityModalController.tsx` | client | EntityModalController, buildLineupView, buildMvpView |
| `LineupModalPanel` | `components/lineup/LineupModalPanel.tsx` | client | LineupModalPanel |
| `LineupPlayerChip` | `components/lineup/LineupPlayerChip.tsx` | server | LineupPlayerChip |
| `MatchContextActionButton` | `components/lineup/MatchContextActionButton.tsx` | client | MatchContextActionButton |
| `MatchContextActionsRow` | `components/lineup/MatchContextActionsRow.tsx` | client | MatchContextActionsRow |
| `MvpPredictionPanel` | `components/lineup/MvpPredictionPanel.tsx` | client | MvpPredictionPanel |
| `PlayerDetailPanel` | `components/lineup/PlayerDetailPanel.tsx` | client | PlayerDetailPanel |
| `ProbableXI` | `components/lineup/ProbableXI.tsx` | server | ProbableXI |
| `TeamLineupGraphic` | `components/lineup/TeamLineupGraphic.tsx` | server | TeamLineupGraphic |

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
| `AllGroupsStandingsModal` | `components/predictions/AllGroupsStandingsModal.tsx` | client | AllGroupsStandingsModal |
| `CalendarGroupsPanel` | `components/predictions/CalendarGroupsPanel.tsx` | server | CalendarGroupsPanel |
| `CalendarSidebarCard` | `components/predictions/CalendarSidebarCard.tsx` | server | CalendarSidebarCard |
| `CalendarSidebarFooter` | `components/predictions/CalendarSidebarFooter.tsx` | client | CalendarSidebarFooter |
| `group-standings-table` | `components/predictions/group-standings-table.tsx` | server | formatGroupDg, GroupStandingsTable, GROUP_STANDINGS_STAT_COLUMNS |
| `GroupStandingsModal` | `components/predictions/GroupStandingsModal.tsx` | client | GroupStandingsModal |
| `KnockoutBracket` | `components/predictions/KnockoutBracket.tsx` | client | KnockoutBracket |
| `MatchPredictionCard` | `components/predictions/MatchPredictionCard.tsx` | server | MatchPredictionCard |
| `MvpPredictionButton` | `components/predictions/MvpPredictionButton.tsx` | client | MvpPredictionButton |
| `PeerPredictionsList` | `components/predictions/PeerPredictionsList.tsx` | server | PeerPredictionsList |
| `PredictionDeadlineCountdown` | `components/predictions/PredictionDeadlineCountdown.tsx` | client | PredictionDeadlineCountdown |
| `PredictionForm` | `components/predictions/PredictionForm.tsx` | client | PredictionForm |
| `PredictionsCalendar` | `components/predictions/PredictionsCalendar.tsx` | client | PredictionsCalendar |
| `PredictionStatusBadge` | `components/predictions/PredictionStatusBadge.tsx` | server | PredictionStatusBadge |
| `QuickPredictionModal` | `components/predictions/QuickPredictionModal.tsx` | client | QuickPredictionModal |
| `ScoreStepper` | `components/predictions/ScoreStepper.tsx` | client | ScoreStepper |
| `TeamFlagBadge` | `components/predictions/TeamFlagBadge.tsx` | server | TeamFlagBadge |
| `TournamentStatsModal` | `components/predictions/TournamentStatsModal.tsx` | client | TournamentStatsModal |

#### profile

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MemberStandingCard` | `components/profile/MemberStandingCard.tsx` | server | MemberStandingCard |
| `ProfileAvatar` | `components/profile/ProfileAvatar.tsx` | server | ProfileAvatar |

#### quiz

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `QuizHub` | `components/quiz/QuizHub.tsx` | server | QuizHub |
| `QuizImage` | `components/quiz/QuizImage.tsx` | server | QuizImage |
| `QuizLeaderboardTable` | `components/quiz/QuizLeaderboardTable.tsx` | server | QuizLeaderboardTable |
| `QuizModeBadge` | `components/quiz/QuizModeBadge.tsx` | server | QuizModeBadge |
| `QuizOptionButton` | `components/quiz/QuizOptionButton.tsx` | client | QuizOptionButton |
| `QuizPageShell` | `components/quiz/QuizPageShell.tsx` | server | QuizPageShell |
| `QuizPlaySession` | `components/quiz/QuizPlaySession.tsx` | client | QuizPlaySession |
| `QuizProgressDots` | `components/quiz/QuizProgressDots.tsx` | server | QuizProgressDots |
| `QuizQuestionStage` | `components/quiz/QuizQuestionStage.tsx` | client | QuizQuestionStage |
| `QuizResultSummary` | `components/quiz/QuizResultSummary.tsx` | server | QuizResultSummary |
| `QuizSlotCard` | `components/quiz/QuizSlotCard.tsx` | server | QuizSlotCard |

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
| `hero-cta` | `components/ui/hero-cta.tsx` | server | HeroCtaLink, HeroCtaButton, heroCtaClassName |
| `input` | `components/ui/input.tsx` | server | Input |
| `modal` | `components/ui/modal.tsx` | client | Modal, ModalPanelSlide |


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
| `fetchTeamSquadAction` | `actions/lineup.ts` | `export async function fetchTeamSquadAction( teamName: string ): Promise<LineupAc` |
| `fetchPlayerDetailAction` | `actions/lineup.ts` | `export async function fetchPlayerDetailAction( teamName: string, playerName: str` |
| `fetchMatchSquadsAction` | `actions/lineup.ts` | `export async function fetchMatchSquadsAction( homeTeam: string, awayTeam: string` |
| `LineupActionResult` | `actions/lineup.ts` | `LineupActionResult` |
| `saveMvpPrediction` | `actions/mvp-predictions.ts` | `export async function saveMvpPrediction( poolId: string, matchId: string, player` |
| `MvpPredictionActionResult` | `actions/mvp-predictions.ts` | `MvpPredictionActionResult` |
| `savePrediction` | `actions/predictions.ts` | `export async function savePrediction( poolId: string, matchId: string, homeGoals` |
| `PredictionActionResult` | `actions/predictions.ts` | `PredictionActionResult` |
| `startQuiz` | `actions/quiz.ts` | `export async function startQuiz( poolId: string, quizId: string ): Promise<QuizA` |
| `submitQuiz` | `actions/quiz.ts` | `export async function submitQuiz( poolId: string, attemptId: string, answers: Re` |
| `QuizActionResult` | `actions/quiz.ts` | `QuizActionResult` |

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

**fjelstul-worldcup/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/fjelstul-worldcup/download.ts` | 43 líneas | downloadFjelstulCsv, FJELSTUL_CSV_FILES, FjelstulCsvFile |
| `lib/fjelstul-worldcup/normalize.ts` | 274 líneas | isWomenTournament, isMenTournament, inferGender, onlyMenTournaments, menTournamentExternalIds, filterByMenTournaments, playerDisplayName, normalizeTournaments, normalizeTeams, normalizeStadiums, normalizeMatches, normalizeGoals, normalizeAwardWinners, normalizeStandings, normalizeSquads, assertErrorRate, WOMENS_WC_TOURNAMENT_IDS, NormalizeStats |
| `lib/fjelstul-worldcup/parse-csv.ts` | 79 líneas | parseCsvContent, readBool, readInt, readOptionalText, CsvRow |

**lineup/** — 6 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/lineup/bench-players.ts` | 30 líneas | getBenchPlayers, BenchPlayer |
| `lib/lineup/build-probable-xi.ts` | 126 líneas | buildProbableXI |
| `lib/lineup/player-detail.ts` | 54 líneas | getPlayerDetail, PlayerDetail |
| `lib/lineup/position-map.ts` | 86 líneas | normalizePositionRole, positionLabelEs, formationRoleCounts, pickFormation, coordinatesForFormation |
| `lib/lineup/squad-name.ts` | 32 líneas | squadTeamNameFromSlug, squadSlugFromTeamName |
| `lib/lineup/types.ts` | 30 líneas | PositionRole, FormationId, LineupPlayerInput, LineupPlayer, FieldCoordinate, LineupSlot, ProbableXIResult |

**narrative/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/narrative/engine.ts` | 25 líneas | NarrativeEngineOptions |
| `lib/narrative/llm-provider.stub.ts` | 10 líneas | — |
| `lib/narrative/template-provider.ts` | 16 líneas | — |
| `lib/narrative/types.ts` | 22 líneas | NarrativeTone, NarrativeContext, NarrativeItem |

**openfootball/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/openfootball/kickoff.ts` | 65 líneas | parseDateKey, parseUtcOffset, buildKickoffIso |
| `lib/openfootball/parse-cup-finals.ts` | 107 líneas | parseCupFinalsTxt |
| `lib/openfootball/parse-football-txt.ts` | 193 líneas | parseCupTxt |
| `lib/openfootball/parse-stadiums-csv.ts` | 59 líneas | parseStadiumsCsv |
| `lib/openfootball/slug.ts` | 52 líneas | toSlug, teamExternalKey, cityExternalKey, groupStageKey, calendarMatchdayKey, poolMatchdayKey, knockoutRoundKey, groupMatchId, knockoutMatchId, isPlaceholderTeam |
| `lib/openfootball/types.ts` | 70 líneas | COMPETITION_CODE, COMPETITION_YEAR, SOURCE_PATH, ParsedStadium, ParsedTeam, StageType, ParsedStage, ParsedMatch, ParsedCalendarMatchday, ParseFootballTxtResult, ParseCupFinalsResult |
| `lib/openfootball/wc2026-groups.ts` | 20 líneas | WC2026_GROUP_CODES |

**pool/** — 9 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/pool/active-pool.ts` | 67 líneas | loadAppShellContext, assertPoolMembership, UserPool, AppShellContext |
| `lib/pool/admin.ts` | 31 líneas | isPoolAdmin, isPoolOwner |
| `lib/pool/calendar-layout.ts` | 297 líneas | getMaxMatchesInMonthGrid, fitCalendarLayout, resetCalendarLayout, CalendarLayoutResult |
| `lib/pool/format-kickoff.ts` | 11 líneas | formatKickoff |
| `lib/pool/group-standings.ts` | 228 líneas | buildGroupStandingsDetail, buildGroupStandings, findGroupStandingDetail, isCalendarGroupsPanelDay, isCalendarSidebarDay, isCalendarGroupsCompanionDay, CALENDAR_GROUPS_PANEL_DAYS, CALENDAR_SIDEBAR_DAYS, CALENDAR_GROUPS_COMPANION_DAY, GroupTeamStanding, GroupStandingRow, GroupStandingDetail |
| `lib/pool/match-calendar.ts` | 258 líneas | kickoffDateKey, toMonthKey, parseMonthKey, formatCalendarDayLabel, formatCalendarMonthLabel, formatMonthYearLabel, formatMonthLabel, formatKickoffTime, formatCalendarKickoffHour, indexMatchesByDate, getMonthRangeFromMatches, getInitialMonthYear, shiftMonth, compareMonth, buildMonthGrid, trimEmptyMatchWeeks, groupMatchesByDay, WEEKDAY_LABELS, CalendarMatchLike, MatchDayGroup, CalendarCell, CalendarWeek, MonthYear |
| `lib/pool/queries.ts` | 44 líneas | getPoolMatches, PoolMatchRow |
| `lib/pool/require-context.ts` | 29 líneas | requireActivePoolContext, getCachedAppShellContext |
| `lib/pool/tournament-stats.ts` | 70 líneas | tournamentHasGoals, getTournamentTopScorers, getTournamentStatRows, TournamentScorerRow, TournamentStatRow, TournamentStatKind |

**predictions/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/predictions/deadline.ts` | 27 líneas | predictionLockDeadlineMs, formatPredictionCountdown, PREDICTION_LOCK_MINUTES |
| `lib/predictions/edit-state.ts` | 54 líneas | resolvePredictionUiState, displayGoals, formatListScore, NO_PREDICTION_LABEL, PredictionUiState, PredictionUiInput |
| `lib/predictions/mvp-queries.ts` | 50 líneas | fetchMvpPredictionsForMatches, getMvpPredictionForMatch, MvpPrediction |
| `lib/predictions/queries.ts` | 346 líneas | assertMatchInPool, fetchMatchEditableFromDb, getPoolMatchesWithPredictions, getPoolGroupStageMatchesWithPredictions, getPoolKnockoutMatchesWithPredictions, getMatchPredictionDetail, countPendingPredictions, getAdminOpenMatches, getPeerPredictionsForMatch, computePredictionEditableLocally, arePeerPredictionsLikelyVisible, MatchWithPrediction, MatchDetail, AdminOpenMatch, PeerPredictionRow |
| `lib/predictions/scoring.ts` | 14 líneas | formatMvpPointsLabel, MVP_PREDICTION_POINTS, MATCH_SCORE_POINTS |
| `lib/predictions/stage-filter.ts` | 34 líneas | isGroupStageMatchdayKey, isKnockoutMatchdayKey, GROUP_STAGE_CALENDAR_MONTH, KNOCKOUT_ROUND_ORDER |
| `lib/predictions/validation.ts` | 24 líneas | parseGoalValue, validatePredictionGoals, MAX_GOALS |

**quiz/** — 22 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/quiz/date.ts` | 12 líneas | todayQuizDate |
| `lib/quiz/distractors.ts` | 153 líneas | getOptionSemanticType, buildDistractorLabels, buildMcqOptions, McqOption, OptionSemanticType |
| `lib/quiz/facts.ts` | 141 líneas | validateQuizFact, parseFactsFile, loadFacts, DEFAULT_FACTS_PATH, QuizFactCategory, QuizFactType, QuizFactDifficulty, QuizFact |
| `lib/quiz/generate-day.ts` | 201 líneas | generateQuizDayFromSources, loadRecentFactIds, selectFactsForDay, generateQuizDay, attachFactsSourceMeta, listGeneratedDates |
| `lib/quiz/generate-question.ts` | 58 líneas | generateQuestionFromFact, GeneratedQuizQuestion |
| `lib/quiz/generate-worldcup-facts.ts` | 217 líneas | buildWorldcupFactsFromHistoric |
| `lib/quiz/generated-day.ts` | 69 líneas | toSeedQuestion, generatedDayToSeedFile, parseGeneratedOrSeedDay, questionsMetaFromDay, GeneratedQuizDayFile |
| `lib/quiz/home-teaser.ts` | 87 líneas | homeQuizSlideFromHub, HomeQuizSlide |
| `lib/quiz/mode.ts` | 42 líneas | isPoolCompetitive |
| `lib/quiz/module.contract.ts` | 3 líneas | QuizModuleContract |
| `lib/quiz/options.ts` | 35 líneas | parseQuizOptions, validateQuizAnswers |
| `lib/quiz/parse-session.ts` | 101 líneas | parseQuizStartSession |
| `lib/quiz/play-flow.ts` | 44 líneas | pickWrongOptionId, resolveOptionVisualState, shouldAutoSubmit, nextStepAfterFeedback, QUESTION_TIME_SEC, FEEDBACK_DELAY_MS, QuestionPhase, OptionVisualState |
| `lib/quiz/quality.ts` | 144 líneas | validateSemanticCoherence, validateGeneratedQuestion, assertGeneratedQuestions, QualityResult |
| `lib/quiz/queries.ts` | 342 líneas | getQuizzesForDate, getQuizAttemptsForProfile, getQuizDayHub, startQuizSession, getQuizResult, getQuizLeaderboard, getLatestSubmittedAttemptId, isQuizPlayable |
| `lib/quiz/question-templates.ts` | 57 líneas | renderQuestionFromFact, QuestionTemplateResult |
| `lib/quiz/quiz-facts-repository.ts` | 118 líneas | upsertWorldcupFacts, shouldPersistFacts, validateWorldcupFactRow, prepareFactsForUpsert, toUpsertPayload, QUIZ_FACTS_WORLDCUP_TABLE, PrepareFactsResult, UpsertFactsResult, UpsertWorldcupFactsDeps |
| `lib/quiz/rng.ts` | 33 líneas | mulberry32, hashString, seedFromQuizDate, shuffleWithRng |
| `lib/quiz/seed-day.ts` | 154 líneas | parseSeedQuizDayFile, scoringFieldsForMode, QUIZ_OFFICIAL_TITLE, SeedQuizOption, SeedQuizQuestion, SeedBonusBlock, SeedQuizDayFile |
| `lib/quiz/slot-status.ts` | 78 líneas | getQuizSlotStatus, canOpenQuizPlay, canReplayQuiz, formatQuizSlotStatusLabel, QuizSlotStatus, QuizPlayAccessOptions |
| `lib/quiz/types.ts` | 100 líneas | QuizKind, QuizScoringMode, QuizAttemptStatus, QuizOption, QuizQuestionPublic, QuizQuestionPlay, QuizSummary, QuizStartSession, QuizRow, QuizAttemptRow, QuizDaySlot, QuizDayHub, QuizLeaderboardRow, QuizResultResponse |
| `lib/quiz/worldcup-facts-source.ts` | 189 líneas | fetchWorldcupFactsFromDb, loadQuizFactsWithFallback, isMenQuizFact, mapWorldcupRowToQuizFact, parseWorldcupFactsRows, mergeFactPools, MIN_FACTS_FOR_DAY, MIN_FACTS_POOL, QuizFactsSourceKind, QuizFactsLoadResult, LoadQuizFactsDeps |

**ranking/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/ranking/format.ts` | 4 líneas | formatAggregateStat |
| `lib/ranking/queries.ts` | 388 líneas | getReferenceMatchday, getReferenceMatchdayId, getPoolLeaderboard, getMemberStanding, memberStandingFromLeaderboard, ReferenceMatchday, PositionTrend, LeaderboardRow, MemberStanding |
| `lib/ranking/reliability.ts` | 17 líneas | computeReliabilityPct, formatReliabilityPct, MAX_POINTS_PER_MATCH |

**scoring/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/scoring/compute.ts` | 36 líneas | matchOutcome, computeMatchPoints, ScoreInput |

**scripts/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/scripts/cli.ts` | 63 líneas | parseScriptCli, logCliOptions, ScriptCliOptions |
| `lib/scripts/env-guard.ts` | 50 líneas | getProjectRef, assertProjectRef, assertServiceEnv, assertPurgeConfirmed, assertBootstrapAllowed, assertImportAllowed, assertQuizSeedAllowed |
| `lib/scripts/supabase-admin.ts` | 34 líneas | upsertChunks, createAdminClient, AdminClient |

**site-url.ts/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/site-url.ts` | 19 líneas | getSiteUrl |

**supabase/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/supabase/admin.ts` | 16 líneas | createAdminClient |
| `lib/supabase/client.ts` | 11 líneas | createClient |
| `lib/supabase/middleware.ts` | 72 líneas | updateSession |
| `lib/supabase/server.ts` | 30 líneas | createClient |

**teams/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/teams/display.ts` | 82 líneas | teamNameEs, teamAbbr, formatMatchCalendarAbbr |
| `lib/teams/flags.ts` | 62 líneas | teamFlagCode, teamFlagUrl |

**ui/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/ui/use-panel-slide-stack.ts` | 132 líneas | usePanelSlideStack |

**utils.ts/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/utils.ts` | 4 líneas | cn |

**worldcup-data/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/worldcup-data/squad-queries.ts` | 53 líneas | getTeamSquadByName, TeamSquadWithPlayers |
| `lib/worldcup-data/types.ts` | 195 líneas | FJELSTUL_SOURCE, FJELSTUL_SOURCE_URL, FJELSTUL_SOURCE_LABEL, WC2026_FEED_SOURCE, OPENFOOTBALL_SOURCE, WcHistoricGender, WcHistoricTournamentRow, WcHistoricTeamRow, WcHistoricStadiumRow, WcHistoricMatchRow, WcHistoricGoalRow, WcHistoricAwardWinnerRow, WcHistoricStandingRow, TeamSquadRow, TeamSquadPlayerRow, QuizFactWorldcupRow, Wc2026TeamRow, Wc2026StadiumRow, Wc2026GameRow, ExternalIdMapRow, MatchLiveStateRow, OpenFootballMatchRef, OpenFootballTeamRef, OpenFootballHostCityRef |

**worldcup2026/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/worldcup2026/api-client.ts` | 41 líneas | fetchWc2026Games, fetchWc2026Teams, Wc2026ApiGame |
| `lib/worldcup2026/match-mapper.ts` | 132 líneas | buildTeamLookup, mapGamesToOpenFootball, mapStadiumsToHostCities, MatchMappingResult |
| `lib/worldcup2026/parse-csv.ts` | 83 líneas | parseWc2026TeamsCsv, parseWc2026StadiaCsv, parseWc2026GamesCsv, parseWc2026GroupsCsv, wc2026ExternalKey |


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
| Migraciones | 12 archivos en `supabase/migrations/` |
| Tablas | 39 |
| Enums | match_status, pool_member_role, pool_member_role_new, quiz_attempt_status, quiz_kind, quiz_scoring_mode |
| Funciones SQL | 16 |
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
| `data_source_registry` | Ver migraciones SQL | RLS habilitado |
| `external_id_map` | Ver migraciones SQL | RLS habilitado |
| `host_cities` | Ver migraciones SQL | RLS habilitado |
| `invite_codes` | Códigos de invitación (solo RPC, sin SELECT directo) | RLS habilitado |
| `match_live_state` | Ver migraciones SQL | RLS habilitado |
| `match_mvp_predictions` | Ver migraciones SQL | RLS habilitado |
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
| `quiz_facts_worldcup` | Ver migraciones SQL | RLS habilitado |
| `quiz_question_keys` | Respuestas correctas (acceso revocado) | RLS habilitado |
| `quiz_questions` | Preguntas de un quiz | RLS habilitado |
| `quiz_responses` | Respuestas individuales por intento | RLS habilitado |
| `quizzes` | Cuestionarios opcionales por porra | RLS habilitado |
| `team_squad_players` | Ver migraciones SQL | RLS habilitado |
| `team_squads` | Ver migraciones SQL | RLS habilitado |
| `teams` | Ver migraciones SQL | RLS habilitado |
| `tournament_stages` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_award_winners` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_goals` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_matches` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_stadiums` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_teams` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_tournament_standings` | Ver migraciones SQL | RLS habilitado |
| `wc_historic_tournaments` | Ver migraciones SQL | RLS habilitado |

### Enums

- `match_status`
- `pool_member_role`
- `pool_member_role_new`
- `quiz_attempt_status`
- `quiz_kind`
- `quiz_scoring_mode`

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
| `compute_mvp_points` | RPC / trigger |
| `consume_invite_and_join` | RPC / trigger |
| `expire_stale_quiz_attempts` | RPC / trigger |
| `generate_news_batch` | RPC / trigger |
| `is_pool_admin` | RPC / trigger |
| `is_pool_member` | RPC / trigger |
| `is_pool_owner` | RPC / trigger |
| `mvp_prediction_points` | RPC / trigger |
| `prediction_edit_allowed` | RPC / trigger |
| `rebuild_pool_member_scores` | RPC / trigger |
| `recalculate_match_mvp_scores` | RPC / trigger |
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
- `supabase/migrations/20260606053311_quiz_mvp_fields.sql` (319 líneas)
- `supabase/migrations/20260607120000_quiz_training_replay.sql` (128 líneas)
- `supabase/migrations/20260607140000_quiz_play_keys_owner.sql` (129 líneas)
- `supabase/migrations/20260608000000_worldcup_external_data.sql` (285 líneas)
- `supabase/migrations/20260608120000_match_mvp_predictions.sql` (186 líneas)

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
| `ALLOW_QUIZ_SEED` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `AUTH_INTERNAL_DOMAIN` | Dominio email sintético | Opcional | `auth.trincadores.local` | lib/auth/credentials.ts |
| `CONFIRM_PURGE` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `CONFIRM_REIMPORT` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `CONFIRM_RESEED` | Ver código | Opcional | `` | scripts/seed-quiz-day.ts |
| `CRON_SECRET` | Protección endpoints cron (sin uso aún) | Opcional | `random-secret-string` | — |
| `DATABASE_URL` | Postgres directo para seed.sql | Opcional | `postgresql://postgres:pass@host:5432/postgres` | — |
| `NEXT_PUBLIC_SITE_URL` | URL pública para redirects auth | Opcional | `http://localhost:3000` | lib/site-url.ts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon | Sí | `eyJhbG...anon` | lib/supabase/client.ts, lib/supabase/middleware.ts, lib/supabase/server.ts |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto Supabase | Sí | `https://xxxx.supabase.co` | lib/scripts/env-guard.ts, lib/scripts/supabase-admin.ts, lib/supabase/admin.ts |
| `NODE_ENV` | Entorno Node (cookies secure) | Auto | `development` | lib/auth/session.ts |
| `OPENFOOTBALL_DIR` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `POOL_SLUG` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts, scripts/seed-quiz-day.ts |
| `QUIZ_DATE` | Ver código | Opcional | `` | scripts/generate-quiz-day.ts, scripts/seed-quiz-day.ts |
| `QUIZ_DAY_FILE` | Ver código | Opcional | `` | scripts/seed-quiz-day.ts |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server/seed/rollback) | Sí | `eyJhbG...service` | lib/scripts/env-guard.ts, lib/scripts/supabase-admin.ts, lib/supabase/admin.ts |
| `VERCEL_PROJECT_PRODUCTION_URL` | Ver código | Opcional | `` | lib/site-url.ts |
| `VERCEL_URL` | Ver código | Opcional | `` | lib/site-url.ts |
| `WC2026_API_BASE` | Ver código | Opcional | `` | lib/worldcup2026/api-client.ts |
| `WC2026_API_TOKEN` | Ver código | Opcional | `` | lib/worldcup2026/api-client.ts |


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
| `components/predictions/PredictionsCalendar.tsx` | 389 | Revisar extracción |
| `lib/ranking/queries.ts` | 388 | Revisar extracción |
| `components/predictions/QuickPredictionModal.tsx` | 383 | Revisar extracción |
| `lib/predictions/queries.ts` | 346 | Revisar extracción |
| `lib/quiz/queries.ts` | 342 | Revisar extracción |
| `components/ui/modal.tsx` | 337 | Revisar extracción |
| `supabase/migrations/20260606053311_quiz_mvp_fields.sql` | 319 | Revisar extracción |

### Código posiblemente sin uso

- `components/home/BackgroundPlayerLayer.tsx` — posible código muerto
- `components/match/MatchRow.tsx` — posible código muerto
- `components/predictions/MatchPredictionCard.tsx` — posible código muerto
- `components/quiz/QuizProgressDots.tsx` — posible código muerto
- `components/ui/hero-cta.tsx` — posible código muerto
- `lib/auth/participants.ts` — posible código muerto
- `lib/dev/seed-ids.ts` — posible código muerto
- `lib/fjelstul-worldcup/download.ts` — posible código muerto
- `lib/narrative/engine.ts` — posible código muerto
- `lib/quiz/generate-worldcup-facts.ts` — posible código muerto
- `lib/scripts/cli.ts` — posible código muerto
- `lib/supabase/client.ts` — posible código muerto
- `lib/worldcup2026/api-client.ts` — posible código muerto

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

**2b datos externos Mundiales (Fjelstul + worldcup2026 feed)**

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
- [x] 2b migracion wc_historic_* + external_id_map + match_live_state + team_squads + quiz_facts_worldcup
- [x] 2b scripts: import-worldcup-historic, import-worldcup-2026 (feed), generate-quiz-facts (preview)
- [x] 2b lib: fjelstul-worldcup parsers, worldcup2026 match-mapper, squad-queries
- [x] Quiz MVP Fase 1 SQL (migracion + RPC start/submit)
- [x] Quiz MVP Fase 2 TypeScript (queries, actions, types)
- [x] Quiz MVP Fase 3 seed dia (`2026-06-06` official+bonus, training)
- [x] Quiz MVP Fase 4 hub `/quiz`
- [x] Quiz MVP Fase 5 play `/quiz/play`
- [x] Quiz MVP Fase 5.5 result `/quiz/result` + leaderboard `/quiz/leaderboard`
- [x] MVP partido: prediccion por partido, scoring +5 pts, modal reutilizable (home/calendario/pronostico)
- [x] Migracion `worldcup_external_data` aplicada en remoto (MCP)
- [x] Migracion `match_mvp_predictions` aplicada en remoto (MCP)
- [x] Import Fjelstul historico + plantillas (625 squads, ~13k jugadores)
- [x] Import feed worldcup2026 (32 partidos mapeados; 40 pending por TBD/plantilla CSV parcial 72 juegos)
- [x] TabBar: Quiz sustituye Actividad (`/quiz`, icono Brain)
- [x] Quiz safe-area: `QuizPageShell` + CSS `tm-quiz-page` (play con scroll interno)
- [x] Slide home quiz en hero carousel
- [x] Quiz auto-generacion: banco hechos + plantillas + generate-day + seed integrado
- [x] Quiz training rejugable (migracion RPC/índice)
- [x] Bonus deprecado en UI/seed
- [x] Quiz gameplay rapido: timer 10s, feedback inmediato, auto-submit, resultado minimo
- [x] Quiz generador: distractores semanticos + owner replay ilimitado

### En desarrollo / pendiente

- [ ] Mejorar match-mapper cuando se resuelvan placeholders UEFA en worldcup2026
- [ ] Probar flujo E2E con login real (official + bonus)
- [ ] Fase 1e activity feed real
- [ ] Entregar codigos de acceso al grupo (access-codes.local.txt)

### Placeholders detectados

_Ninguno._

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

