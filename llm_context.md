# Trincadores Mundialistas — LLM Context

> Documento auto-generado. No editar manualmente; usar `npm run llm-context`.

## Resumen ejecutivo

> Fuente única de verdad para LLMs. Regenerado automáticamente. Última actualización: `2026-06-12T00:15:11.398Z`.

| Campo | Valor |
|-------|-------|
| **Nombre** | Trincadores Mundialistas |
| **Paquete npm** | `trincadores-mundialistas` v0.1.0 |
| **Objetivo** | PWA de porras privadas para el Mundial 2026: predicciones de marcador, ranking por jornada, administración de resultados |
| **Problema** | Centralizar quinielas entre amigos con reglas claras (8/5/3/0), visibilidad controlada de predicciones rivales y multi-porra |
| **Usuarios** | Jugadores (`player`), administradores de porra (`admin`), propietarios (`owner`) |
| **Fase actual** | 2b datos externos Mundiales (Fjelstul + worldcup2026 feed) |
| **Stack** | Next.js 16 App Router · React 19 · Tailwind 4 · Supabase (Auth + Postgres + RLS) |

**Completado reciente:** Resúmenes FIFA YouTube: cron RSS `@fifa`, slide hero «Último partido», reproductor in-app, modal partido finalizado · Notificaciones push+: las 4 kinds (pronóstico T-30, alineaciones confirmadas, quiz activo, recordatorio quiz diario) envían in-app + Web Push · Mundial en juego: cron `live-matches` (cada 2 min) persiste marcador/stats BSD, marca `live`/`finished`, escribe `match_results` y recalcula ranking al finalizar · MVP oficial automático: cron `live-matches` prioriza FotMob (`playerOfTheMatch` FIFA en Mundiales) → FIFA → BSD; persiste `match_results.mvp_*` sin pisar admin · Alineaciones confirmadas: FotMob como fuente prioritaria (`matchDetails.lineup`, WC2026); script `db:map-fotmob-fixtures` · Titulares BSD en highlights: columnas `matches.highlight_headline` / `highlight_headline_source`; sync social → incidentes vía cron `live-matches` y `youtube-highlights`; UI hero con titular corto

**Siguiente:** API-Football free tier: temporada 2026 no disponible; lineups confirmadas vía BSD o plan de pago API-Football


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
| `/general-predictions` | `app/(app)/general-predictions/page.tsx` | force-dynamic |
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
| `/(onboarding)/bienvenida` | `app/(onboarding)/bienvenida/page.tsx` | default |

### Layouts

| Archivo | Rol |
|---------|-----|
| `app/(app)/general-predictions/layout.tsx` | Shell visual |
| `app/(app)/layout.tsx` | Auth/pool guard |
| `app/(app)/predictions/layout.tsx` | Shell visual |
| `app/(app)/profile/layout.tsx` | Shell visual |
| `app/(app)/ranking/layout.tsx` | Shell visual |
| `app/(auth)/layout.tsx` | Shell visual |
| `app/(onboarding)/layout.tsx` | Shell visual |
| `app/layout.tsx` | Shell visual |

### Componentes por módulo

#### admin

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AdminResultForm` | `components/admin/AdminResultForm.tsx` | client | AdminResultForm |
| `AdminTournamentAwardsForm` | `components/admin/AdminTournamentAwardsForm.tsx` | client | AdminTournamentAwardsForm |

#### auth

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `LoginForm` | `components/auth/LoginForm.tsx` | client | LoginForm |
| `LoginHero` | `components/auth/LoginHero.tsx` | server | LoginHero |

#### highlights

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchHighlightBlock` | `components/highlights/MatchHighlightBlock.tsx` | client | MatchHighlightBlock |
| `MatchHighlightPlayerModal` | `components/highlights/MatchHighlightPlayerModal.tsx` | client | MatchHighlightPlayerModal |
| `MatchHighlightScoreline` | `components/highlights/MatchHighlightScoreline.tsx` | server | MatchHighlightScoreline |
| `MatchHighlightThumbnail` | `components/highlights/MatchHighlightThumbnail.tsx` | client | MatchHighlightThumbnail |

#### home

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `BackgroundPlayerLayer` | `components/home/BackgroundPlayerLayer.tsx` | server | BackgroundPlayerLayer |
| `GeneralPredictionRow` | `components/home/GeneralPredictionRow.tsx` | client | GeneralPredictionRow |
| `GeneralPredictionTeamValue` | `components/home/GeneralPredictionTeamValue.tsx` | server | HomeChampionTeamValue, HomeFinalistsTeamValue |
| `HomeAtmosphere` | `components/home/HomeAtmosphere.tsx` | server | HomeAtmosphere |
| `HomeDailyFactCard` | `components/home/HomeDailyFactCard.tsx` | server | HomeDailyFactCard |
| `HomeDailyQuizCard` | `components/home/HomeDailyQuizCard.tsx` | client | HomeDailyQuizCard |
| `HomeGeneralPredictionsCard` | `components/home/HomeGeneralPredictionsCard.tsx` | client | HomeGeneralPredictionsCard |
| `HomeHero` | `components/home/HomeHero.tsx` | server | HomeHero |
| `HomeHeroCarousel` | `components/home/HomeHeroCarousel.tsx` | client | HomeHeroCarousel |
| `HomeMatchCard` | `components/home/HomeMatchCard.tsx` | client | HomeMatchCard |
| `HomeMiniRankingTable` | `components/home/HomeMiniRankingTable.tsx` | server | HomeMiniRankingTable |
| `HomeNextMatch` | `components/home/HomeNextMatch.tsx` | client | HomeNextMatch |
| `HomeScoringRulesCard` | `components/home/HomeScoringRulesCard.tsx` | client | HomeScoringRulesCard |
| `HomeStandingCard` | `components/home/HomeStandingCard.tsx` | server | HomeStandingCard |
| `HomeTopThree` | `components/home/HomeTopThree.tsx` | server | HomeTopThree |
| `HomeViewportShell` | `components/home/HomeViewportShell.tsx` | server | HomeViewportShell |
| `ScoringRulesModal` | `components/home/ScoringRulesModal.tsx` | client | ScoringRulesModal |

#### layout

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AppBrandTitle` | `components/layout/AppBrandTitle.tsx` | server | AppBrandTitle |
| `AppHeader` | `components/layout/AppHeader.tsx` | server | AppHeader |
| `AppHeaderGate` | `components/layout/AppHeaderGate.tsx` | client | AppHeaderGate |
| `AppShell` | `components/layout/AppShell.tsx` | server | AppShell |
| `BottomChrome` | `components/layout/BottomChrome.tsx` | client | BottomChrome |
| `BrandLogo` | `components/layout/BrandLogo.tsx` | server | BrandLogo, BrandLogoFixed |
| `NavigationLoadingProvider` | `components/layout/NavigationLoadingProvider.tsx` | client | useAppNavigation, NavigationLoadingProvider |
| `PoolSwitcher` | `components/layout/PoolSwitcher.tsx` | client | PoolSwitcher |
| `PullToRefresh` | `components/layout/PullToRefresh.tsx` | client | PullToRefresh |
| `TabBar` | `components/layout/TabBar.tsx` | client | TabBar |
| `TabBarWrapper` | `components/layout/TabBarWrapper.tsx` | client | TabBarWrapper |
| `TabNavigationProvider` | `components/layout/TabNavigationProvider.tsx` | client | TabNavigationProvider, useTabNavigation, useTabIndicatorProgress |
| `TabPageIndicators` | `components/layout/TabPageIndicators.tsx` | client | TabPageIndicators |
| `TabSwipeNavigator` | `components/layout/TabSwipeNavigator.tsx` | client | TabSwipeNavigator |
| `ViewportLayoutDebug` | `components/layout/ViewportLayoutDebug.tsx` | client | ViewportLayoutDebug |
| `ViewportLayoutRoot` | `components/layout/ViewportLayoutRoot.tsx` | client | ViewportLayoutRoot |

#### lineup

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `BenchPlayersStrip` | `components/lineup/BenchPlayersStrip.tsx` | client | benchPlayerKey, BenchPlayersStrip |
| `ConfirmedLineupCheckIcon` | `components/lineup/ConfirmedLineupCheckIcon.tsx` | server | ConfirmedLineupCheckIcon |
| `EntityModalController` | `components/lineup/EntityModalController.tsx` | client | EntityModalController, buildLineupView, buildPossibleLineupsView |
| `EntityModalTitle` | `components/lineup/EntityModalTitle.tsx` | client | entityModalTitleContent, MvpModalFormations, EntityModalTitleOptions |
| `FootballPitchSurface` | `components/lineup/FootballPitchSurface.tsx` | client | FootballPitchSurface |
| `HorizontalPitchSurface` | `components/lineup/HorizontalPitchSurface.tsx` | client | HorizontalPitchSurface |
| `LineupFieldGate` | `components/lineup/LineupFieldGate.tsx` | client | LineupFieldGate |
| `LineupFormationInfo` | `components/lineup/LineupFormationInfo.tsx` | server | LineupFormationInfo |
| `LineupMetaLine` | `components/lineup/LineupMetaLine.tsx` | server | LineupMetaLine |
| `LineupModalFieldShell` | `components/lineup/LineupModalFieldShell.tsx` | client | LineupModalFieldShell |
| `LineupModalPanel` | `components/lineup/LineupModalPanel.tsx` | client | LineupModalPanel |
| `LineupPlayerChip` | `components/lineup/LineupPlayerChip.tsx` | server | LineupPlayerChip |
| `LineupSourceBadge` | `components/lineup/LineupSourceBadge.tsx` | server | LineupSourceBadge |
| `MatchContextActionButton` | `components/lineup/MatchContextActionButton.tsx` | client | MatchContextTextActionButton, HomeSquadFooterLink, MatchContextActionButton |
| `MatchContextActionsRow` | `components/lineup/MatchContextActionsRow.tsx` | client | MatchContextActionsRow |
| `MatchMvpFieldGraphic` | `components/lineup/MatchMvpFieldGraphic.tsx` | client | MatchMvpFieldGraphic |
| `MvpBenchColumn` | `components/lineup/MvpBenchColumn.tsx` | client | MvpBenchColumn |
| `MvpHorizontalFieldGraphic` | `components/lineup/MvpHorizontalFieldGraphic.tsx` | client | MvpHorizontalFieldGraphic |
| `MvpPickPanel` | `components/lineup/MvpPickPanel.tsx` | client | MvpPickPanel |
| `MvpTacticalFieldBody` | `components/lineup/MvpTacticalFieldBody.tsx` | client | MvpTacticalFieldBody |
| `PlayerDetailPanel` | `components/lineup/PlayerDetailPanel.tsx` | client | PlayerDetailPanel |
| `PossibleLineupsPanel` | `components/lineup/PossibleLineupsPanel.tsx` | client | PossibleLineupsPanel |
| `ProbableXI` | `components/lineup/ProbableXI.tsx` | server | ProbableXI |
| `TacticalLineupsPanelShell` | `components/lineup/TacticalLineupsPanelShell.tsx` | client | TacticalLineupsPanelShell |
| `TeamLineupGraphic` | `components/lineup/TeamLineupGraphic.tsx` | client | TeamLineupGraphic |

#### live

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `LiveMatchHeaderLabel` | `components/live/LiveMatchHeaderLabel.tsx` | server | LiveMatchHeaderLabel |
| `LiveMatchPanelContent` | `components/live/LiveMatchPanelContent.tsx` | client | LiveMatchPanelContent |
| `LiveMatchScorePair` | `components/live/LiveMatchScorePair.tsx` | server | LiveScoreDisplay, LiveMatchScoreOverlay |
| `LivePulseIcon` | `components/live/LivePulseIcon.tsx` | server | LivePulseIcon |
| `MatchLiveStatsPanel` | `components/live/MatchLiveStatsPanel.tsx` | server | MatchLiveStatsPanel |
| `MatchStatsModal` | `components/live/MatchStatsModal.tsx` | client | MatchStatsOpenButton, MatchStatsModal |
| `MatchStatsTable` | `components/live/MatchStatsTable.tsx` | server | MatchStatsTable |
| `SubstitutionMarkerIcon` | `components/live/SubstitutionMarkerIcon.tsx` | server | SubstitutionMarkerIcon |

#### match

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchRow` | `components/match/MatchRow.tsx` | server | MatchRow |

#### matches

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `MatchTeamsDisplay` | `components/matches/MatchTeamsDisplay.tsx` | server | MatchTeamsDisplay, PREDICTION_MODAL_NAMES_BOTTOM_CLASS, PREDICTION_MODAL_ACTIONS_ROW_CLASS |

#### notifications

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `LineupsNotificationOpener` | `components/notifications/LineupsNotificationOpener.tsx` | client | LineupsNotificationOpener |
| `NotificationCountBadge` | `components/notifications/NotificationCountBadge.tsx` | server | NotificationCountBadge |
| `NotificationsBell` | `components/notifications/NotificationsBell.tsx` | client | NotificationsBell |
| `QuizActiveNotificationModal` | `components/notifications/QuizActiveNotificationModal.tsx` | client | QuizActiveNotificationModal |
| `QuizActiveNotificationProvider` | `components/notifications/QuizActiveNotificationProvider.tsx` | client | useQuizActiveNotificationModal, QuizActiveNotificationProvider |
| `UnreadNotificationsContext` | `components/notifications/UnreadNotificationsContext.tsx` | client | UnreadNotificationsProvider, useUnreadNotifications |
| `UnreadNotificationsShell` | `components/notifications/UnreadNotificationsShell.tsx` | client | UnreadNotificationsShell |

#### players

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `PlayerSearchBar` | `components/players/PlayerSearchBar.tsx` | client | PlayerSearchBar |

#### predictions

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AllGroupsStandingsModal` | `components/predictions/AllGroupsStandingsModal.tsx` | client | AllGroupsStandingsModal |
| `AllTeamsLineupModal` | `components/predictions/AllTeamsLineupModal.tsx` | client | AllTeamsLineupModal |
| `CalendarDataAccessModal` | `components/predictions/CalendarDataAccessModal.tsx` | client | CalendarDataAccessModal |
| `CalendarFinishedMatchCardVisual` | `components/predictions/CalendarFinishedMatchCardVisual.tsx` | server | CalendarFinishedMatchCardVisual |
| `CalendarGroupRowBadge` | `components/predictions/CalendarGroupRowBadge.tsx` | server | CalendarGroupRowBadge |
| `CalendarGroupsPanel` | `components/predictions/CalendarGroupsPanel.tsx` | server | CalendarGroupsPanel |
| `CalendarGuideModal` | `components/predictions/CalendarGuideModal.tsx` | client | CalendarGuideModal |
| `CalendarGuidePreviewCell` | `components/predictions/CalendarGuidePreviewCell.tsx` | client | CalendarGuidePreviewCell |
| `CalendarSidebarAccessDock` | `components/predictions/CalendarSidebarAccessDock.tsx` | client | CalendarSidebarAccessDock |
| `CalendarSidebarSlot` | `components/predictions/CalendarSidebarSlot.tsx` | server | CalendarSidebarSlot |
| `FinishedMatchScoreRow` | `components/predictions/FinishedMatchScoreRow.tsx` | server | FinishedMatchScoreRow |
| `group-standings-table` | `components/predictions/group-standings-table.tsx` | server | formatGroupDg, GroupStandingsTable, GROUP_STANDINGS_STAT_COLUMNS |
| `GroupStandingsModal` | `components/predictions/GroupStandingsModal.tsx` | client | GroupStandingsModal |
| `KnockoutBracket` | `components/predictions/KnockoutBracket.tsx` | client | KnockoutBracket |
| `MatchPredictionCard` | `components/predictions/MatchPredictionCard.tsx` | server | MatchPredictionCard |
| `MatchPredictionsBoardModal` | `components/predictions/MatchPredictionsBoardModal.tsx` | client | MatchPredictionsBoardModal |
| `MatchPredictionsBoardRow` | `components/predictions/MatchPredictionsBoardRow.tsx` | client | MatchPredictionsBoardRow |
| `MatchPredictionsBoardTable` | `components/predictions/MatchPredictionsBoardTable.tsx` | server | MatchPredictionsBoardTable |
| `MvpPredictionButton` | `components/predictions/MvpPredictionButton.tsx` | client | MvpPredictionButton |
| `PeerPredictionsList` | `components/predictions/PeerPredictionsList.tsx` | server | PeerPredictionsList |
| `PlayerAwardPickerModal` | `components/predictions/PlayerAwardPickerModal.tsx` | client | PlayerAwardPickerModal |
| `PredictionDeadlineCountdown` | `components/predictions/PredictionDeadlineCountdown.tsx` | client | PredictionDeadlineCountdown |
| `PredictionForm` | `components/predictions/PredictionForm.tsx` | client | PredictionForm |
| `PredictionOutcomeIcon` | `components/predictions/PredictionOutcomeIcon.tsx` | server | PredictionOutcomeIcon |
| `PredictionsCalendar` | `components/predictions/PredictionsCalendar.tsx` | client | PredictionsCalendar |
| `PredictionStatusBadge` | `components/predictions/PredictionStatusBadge.tsx` | server | PredictionStatusBadge |
| `QuickPredictionModal` | `components/predictions/QuickPredictionModal.tsx` | client | QuickPredictionModal |
| `ScoreStepper` | `components/predictions/ScoreStepper.tsx` | client | ScoreStepper |
| `TeamFlagBadge` | `components/predictions/TeamFlagBadge.tsx` | server | TeamFlagBadge |
| `TeamPickerGridItem` | `components/predictions/TeamPickerGridItem.tsx` | server | TeamPickerGridItem, TEAM_PICKER_GRID_CLASS |
| `TeamsPickerModal` | `components/predictions/TeamsPickerModal.tsx` | client | TeamsPickerModal, TeamsPickerMode |
| `TournamentStatsModal` | `components/predictions/TournamentStatsModal.tsx` | client | TournamentStatsModal |

#### profile

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AvatarDisplay` | `components/profile/AvatarDisplay.tsx` | server | AvatarDisplay, AvatarDisplaySize |
| `AvatarPreviewModal` | `components/profile/AvatarPreviewModal.tsx` | client | AvatarPreviewModal |
| `MemberStandingCard` | `components/profile/MemberStandingCard.tsx` | server | MemberStandingCard |
| `ProfileAvatar` | `components/profile/ProfileAvatar.tsx` | server | ProfileAvatar, ProfileAvatarVariant |
| `ProfileAvatarButton` | `components/profile/ProfileAvatarButton.tsx` | client | ProfileAvatarButton |
| `ProfilePushNotificationsCard` | `components/profile/ProfilePushNotificationsCard.tsx` | client | ProfilePushNotificationsCard |

#### push

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `PushNotificationProvider` | `components/push/PushNotificationProvider.tsx` | client | usePushNotifications, PushNotificationProvider |

#### pwa

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `AppUpdateNotifier` | `components/pwa/AppUpdateNotifier.tsx` | client | AppUpdateNotifier |
| `AvatarGenerationStep` | `components/pwa/AvatarGenerationStep.tsx` | client | AvatarGenerationStep |
| `PwaOnboardingFlow` | `components/pwa/PwaOnboardingFlow.tsx` | client | PwaOnboardingFlow |

#### quiz

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `QuizDailyIntro` | `components/quiz/QuizDailyIntro.tsx` | client | QuizDailyIntro |
| `QuizHub` | `components/quiz/QuizHub.tsx` | client | QuizHub |
| `QuizImage` | `components/quiz/QuizImage.tsx` | server | QuizImage |
| `QuizLeaderboardRow` | `components/quiz/QuizLeaderboardRow.tsx` | server | QuizLeaderboardRow |
| `QuizLeaderboardTable` | `components/quiz/QuizLeaderboardTable.tsx` | server | QuizLeaderboardTable |
| `QuizModeBadge` | `components/quiz/QuizModeBadge.tsx` | server | QuizModeBadge |
| `QuizOptionButton` | `components/quiz/QuizOptionButton.tsx` | client | QuizOptionButton |
| `QuizPageShell` | `components/quiz/QuizPageShell.tsx` | client | QuizPageShell |
| `QuizPlaySession` | `components/quiz/QuizPlaySession.tsx` | client | QuizPlaySession |
| `QuizProgressDots` | `components/quiz/QuizProgressDots.tsx` | server | QuizProgressDots |
| `QuizQuestionStage` | `components/quiz/QuizQuestionStage.tsx` | client | QuizQuestionStage |
| `QuizResultSummary` | `components/quiz/QuizResultSummary.tsx` | server | QuizResultSummary |
| `QuizSlotCard` | `components/quiz/QuizSlotCard.tsx` | server | QuizSlotCard |
| `QuizWaitModal` | `components/quiz/QuizWaitModal.tsx` | client | QuizWaitModal |

#### ranking

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `PositionTrendIndicator` | `components/ranking/PositionTrendIndicator.tsx` | server | PositionTrendIndicator |
| `RankingMemberCells` | `components/ranking/RankingMemberCells.tsx` | client | RankingMemberCells |
| `RankingRow` | `components/ranking/RankingRow.tsx` | server | RankingRow |
| `RankingTable` | `components/ranking/RankingTable.tsx` | server | RankingTable |

#### tournament-predictions

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `GeneralPredictionsCells` | `components/tournament-predictions/GeneralPredictionsCells.tsx` | server | ChampionPredictionCell, FinalistsPredictionCell, PlayerPredictionCell |
| `GeneralPredictionsRow` | `components/tournament-predictions/GeneralPredictionsRow.tsx` | server | GeneralPredictionsRow |
| `GeneralPredictionsTable` | `components/tournament-predictions/GeneralPredictionsTable.tsx` | client | GeneralPredictionsTable |

#### ui

| Componente | Ruta | Tipo | Exports |
|------------|------|------|--------|
| `badge` | `components/ui/badge.tsx` | server | Badge |
| `button` | `components/ui/button.tsx` | server | Button |
| `card` | `components/ui/card.tsx` | server | Card |
| `hero-cta` | `components/ui/hero-cta.tsx` | server | HeroCtaLink, HeroCtaButton, heroCtaClassName |
| `image-lightbox-modal` | `components/ui/image-lightbox-modal.tsx` | client | ImageLightboxModal |
| `input` | `components/ui/input.tsx` | server | Input |
| `modal-plain-back-button` | `components/ui/modal-plain-back-button.tsx` | server | ModalPlainBackButton |
| `modal` | `components/ui/modal.tsx` | client | Modal, ModalPanelSlide |
| `spinner` | `components/ui/spinner.tsx` | server | TmSpinner, LoadingCenter, LoadingOverlay |


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
| `submitTournamentOfficialAwards` | `actions/admin.ts` | `export async function submitTournamentOfficialAwards( poolId: string, awards: To` |
| `regenerateAccessCode` | `actions/admin.ts` | `export async function regenerateAccessCode( poolId: string, targetUsername: stri` |
| `AdminActionResult` | `actions/admin.ts` | `AdminActionResult` |
| `TournamentOfficialAwardsPayload` | `actions/admin.ts` | `TournamentOfficialAwardsPayload` |
| `signIn` | `actions/auth.ts` | `export async function signIn( usernameRaw: string, accessCodeRaw: string ): Prom` |
| `signInWithPhone` | `actions/auth.ts` | `export async function signInWithPhone(phoneRaw: string): Promise<AuthActionResul` |
| `signOut` | `actions/auth.ts` | `export async function signOut(): Promise<void> ` |
| `setActivePool` | `actions/auth.ts` | `export async function setActivePool(poolId: string): Promise<AuthActionResult> ` |
| `AuthActionResult` | `actions/auth.ts` | `AuthActionResult` |
| `fetchAllTournamentPlayersAction` | `actions/lineup.ts` | `export async function fetchAllTournamentPlayersAction(): Promise< LineupActionRe` |
| `fetchTeamSquadAction` | `actions/lineup.ts` | `export async function fetchTeamSquadAction( teamName: string ): Promise<LineupAc` |
| `fetchPlayerDetailAction` | `actions/lineup.ts` | `export async function fetchPlayerDetailAction( teamName: string, playerName: str` |
| `fetchTeamKitHexMapAction` | `actions/lineup.ts` | `export async function fetchTeamKitHexMapAction(): Promise< LineupActionResult<Re` |
| `fetchTeamLineupBundleAction` | `actions/lineup.ts` | `export async function fetchTeamLineupBundleAction( teamName: string, options?: {` |
| `fetchMatchLineupBundleAction` | `actions/lineup.ts` | `export async function fetchMatchLineupBundleAction( matchId: string, homeTeam: s` |
| `fetchMatchSquadsAction` | `actions/lineup.ts` | `export async function fetchMatchSquadsAction( homeTeam: string, awayTeam: string` |
| `fetchResolvedTeamLineupAction` | `actions/lineup.ts` | `export async function fetchResolvedTeamLineupAction( teamName: string, options?:` |
| `fetchMatchLineupsStatusAction` | `actions/lineup.ts` | `export async function fetchMatchLineupsStatusAction( matchId: string, homeTeam: ` |
| `fetchResolvedMatchLineupsAction` | `actions/lineup.ts` | `export async function fetchResolvedMatchLineupsAction( matchId: string, homeTeam` |
| `LineupActionResult` | `actions/lineup.ts` | `LineupActionResult` |
| `fetchMatchLiveSnapshotAction` | `actions/live-match.ts` | `export async function fetchMatchLiveSnapshotAction( matchId: string, ): Promise<` |
| `LiveMatchActionResult` | `actions/live-match.ts` | `LiveMatchActionResult` |
| `fetchSavedMvpPrediction` | `actions/mvp-predictions.ts` | `export async function fetchSavedMvpPrediction(poolId: string, matchId: string) ` |
| `fetchSavedMvpPlayerName` | `actions/mvp-predictions.ts` | `export async function fetchSavedMvpPlayerName( poolId: string, matchId: string )` |
| `saveMvpPrediction` | `actions/mvp-predictions.ts` | `export async function saveMvpPrediction( poolId: string, matchId: string, player` |
| `MvpPredictionActionResult` | `actions/mvp-predictions.ts` | `MvpPredictionActionResult` |
| `fetchMatchLineupsModalContextAction` | `actions/notifications.ts` | `export async function fetchMatchLineupsModalContextAction( matchId: string, ): P` |
| `NotificationActionResult` | `actions/notifications.ts` | `NotificationActionResult` |
| `fetchMatchPredictionsBoardAction` | `actions/predictions.ts` | `export async function fetchMatchPredictionsBoardAction( poolId: string, matchId:` |
| `savePrediction` | `actions/predictions.ts` | `export async function savePrediction( poolId: string, matchId: string, homeGoals` |
| `PredictionActionResult` | `actions/predictions.ts` | `PredictionActionResult` |
| `MatchPredictionsBoardActionResult` | `actions/predictions.ts` | `MatchPredictionsBoardActionResult` |
| `savePushSubscriptionAction` | `actions/push.ts` | `export async function savePushSubscriptionAction( payload: PushSubscriptionPaylo` |
| `PushActionResult` | `actions/push.ts` | `PushActionResult` |
| `resolvePwaEntryRoute` | `actions/pwa-onboarding.ts` | `export async function resolvePwaEntryRoute(): Promise<PwaEntryRoute> ` |
| `hasCompletedPwaOnboarding` | `actions/pwa-onboarding.ts` | `export async function hasCompletedPwaOnboarding(): Promise<boolean> ` |
| `confirmStandaloneInstallation` | `actions/pwa-onboarding.ts` | `export async function confirmStandaloneInstallation(): Promise<ActionResult<null` |
| `identifyParticipantByUsername` | `actions/pwa-onboarding.ts` | `export async function identifyParticipantByUsername( usernameRaw: string ): Prom` |
| `identifyParticipantByPhone` | `actions/pwa-onboarding.ts` | `export async function identifyParticipantByPhone( phoneRaw: string ): Promise<Ac` |
| `assignParticipantAvatar` | `actions/pwa-onboarding.ts` | `export async function assignParticipantAvatar( usernameRaw: string ): Promise<Ac` |
| `completePwaOnboarding` | `actions/pwa-onboarding.ts` | `export async function completePwaOnboarding( usernameRaw: string ): Promise<Acti` |
| `PwaEntryRoute` | `actions/pwa-onboarding.ts` | `PwaEntryRoute` |
| `startQuiz` | `actions/quiz.ts` | `export async function startQuiz( poolId: string, quizId: string ): Promise<QuizA` |
| `submitQuiz` | `actions/quiz.ts` | `export async function submitQuiz( poolId: string, attemptId: string, answers: Re` |
| `QuizActionResult` | `actions/quiz.ts` | `QuizActionResult` |
| `saveTournamentChampion` | `actions/tournament-general-predictions.ts` | `export async function saveTournamentChampion( poolId: string, teamName: string )` |
| `saveTournamentFinalists` | `actions/tournament-general-predictions.ts` | `export async function saveTournamentFinalists( poolId: string, teamA: string, te` |
| `saveTournamentTopScorer` | `actions/tournament-general-predictions.ts` | `export async function saveTournamentTopScorer( poolId: string, playerName: strin` |
| `saveTournamentMvp` | `actions/tournament-general-predictions.ts` | `export async function saveTournamentMvp( poolId: string, playerName: string, tea` |
| `saveTournamentGoldenGlove` | `actions/tournament-general-predictions.ts` | `export async function saveTournamentGoldenGlove( poolId: string, playerName: str` |
| `TournamentGeneralActionResult` | `actions/tournament-general-predictions.ts` | `TournamentGeneralActionResult` |

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

**auth/** — 12 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/auth/access-code.ts` | 24 líneas | generateAccessCode, normalizeAccessCode, validateAccessCode, ACCESS_CODE_LENGTH |
| `lib/auth/clear-device-cookies.ts` | 17 líneas | clearDeviceCookiesOnResponse |
| `lib/auth/credentials.ts` | 21 líneas | getAuthInternalDomain, toAuthEmail, fromAuthEmail |
| `lib/auth/onboarding-device.ts` | 73 líneas | getOnboardedDeviceUsername, clearOnboardedDeviceCookie, setOnboardedDeviceCookie, readOnboardedUsernameFromCookieValue, isProfileOnboardingComplete, ONBOARDED_USER_COOKIE, ONBOARDED_USER_MAX_AGE_SECONDS, OnboardingProfileRow |
| `lib/auth/participants.ts` | 26 líneas | REAL_POOL_SLUG, REAL_POOL_NAME, ParticipantSeed |
| `lib/auth/phone-sign-in.ts` | 161 líneas | signInUserByPhoneWithClient, signInUserByPhone, signInUserByUsernameWithClient, signInUserByUsername, PhoneSignInResult |
| `lib/auth/profile-phone.ts` | 94 líneas | lookupProfileByPhone, lookupPhoneByUsername, ProfilePhoneRow |
| `lib/auth/restore-session.ts` | 52 líneas | restoreSessionForUsername, RestoreSessionResult |
| `lib/auth/session.ts` | 41 líneas | getActivePoolIdFromCookie, setActivePoolCookie, clearActivePoolCookie, resolvePoolMemberships, ACTIVE_POOL_COOKIE, PoolMembershipResolution |
| `lib/auth/stamp-onboarding-completed.ts` | 28 líneas | stampOnboardingCompletedIfNeeded |
| `lib/auth/trusted-sign-in.ts` | 26 líneas | signInTrustedUserByUsername |
| `lib/auth/validation.ts` | 15 líneas | normalizeUsername, validateUsername, USERNAME_REGEX |

**avatars/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/avatars/display-classes.ts` | 9 líneas | AVATAR_DISPLAY_PROFILE, AVATAR_DISPLAY_RANKING, AVATAR_DISPLAY_HOME_MINI |
| `lib/avatars/presets.ts` | 27 líneas | getPresetAvatarUrl, getAvatarBadgeObjectPosition |

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

**highlights/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/highlights/queries.ts` | 89 líneas | getLatestMatchHighlightForPool |
| `lib/highlights/sync-bsd-headline.ts` | 112 líneas | syncBsdHeadlineForMatch |
| `lib/highlights/types.ts` | 12 líneas | MatchHighlightView |

**home/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/home/daily-fact.ts` | 88 líneas | todayDateKey, validateDailyFact, parseDailyFactsFile, loadDailyFacts, pickDailyFactForDate, getDailyFactForDate, getDailyFactForToday, DEFAULT_DAILY_FACTS_PATH, DailyFact |
| `lib/home/scoring-rules-content.ts` | 80 líneas | ScoringRulesCardLine, ScoringRulesSection |

**layout/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/layout/bottom-chrome.ts` | 2 líneas | BOTTOM_CHROME_PLACEHOLDER_ID |
| `lib/layout/layout-debug-metrics.ts` | 136 líneas | collectExtendedLayoutMetrics, emitLayoutDebugLog, ExtendedLayoutMetrics |
| `lib/layout/main-tabs.ts` | 54 líneas | isMainTabActive, getMainTabSectionIndex, getMainTabIndex, isMainTabRoot, isPredictionsTabPath, shouldShowTabPageIndicators, MAIN_TABS, MAIN_TAB_HREFS, MainTabHref |
| `lib/layout/pull-to-refresh.ts` | 75 líneas | isPullRefreshBlocked, findPullScrollRoot, findNearestScrollable, isScrollAtTop, applyPullResistance, pullProgress, PULL_SCROLL_SELECTORS, PULL_THRESHOLD_PX, PULL_MAX_PX, PULL_RESISTANCE |
| `lib/layout/tab-indicators-position.ts` | 50 líneas | measureTabIndicatorsBottom, applyTabIndicatorsBottom, resetTabIndicatorsBottom, TAB_INDICATOR_DOT_SIZE, TAB_INDICATORS_SYNC_EVENT |
| `lib/layout/tab-swipe.ts` | 72 líneas | getTabNeighborForSwipe, pointerOffsetToSwipeDirection, shouldApplyEdgeResistance, resolveTabSwipeCommit, getTabSwipeProgress, getMainTabBarNeighbors, TabSwipeDirection |
| `lib/layout/viewport-chrome.ts` | 74 líneas | readTabBarTop, readLayoutBottomAboveIndicators, syncLayoutAboveTabBar, syncLayoutAboveIndicators, resetLayoutAboveTabBar, VIEWPORT_CHROME_SYNC_EVENT |

**lineup/** — 62 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/lineup/bench-dedupe.ts` | 38 líneas | starterIdentitySet, isStarterPlayer, dedupeBenchAgainstStarters |
| `lib/lineup/bench-from-lineup.ts` | 65 líneas | resolveBenchPlayers |
| `lib/lineup/bench-grid-layout.ts` | 108 líneas | pickBenchGrid, BenchLayoutConfig, BenchSizePrefs, PickBenchGridOptions |
| `lib/lineup/bench-players.ts` | 47 líneas | getBenchPlayers, BenchPlayer |
| `lib/lineup/build-fallback-lineup.ts` | 22 líneas | buildFallbackLineup, BuildFallbackLineupOptions |
| `lib/lineup/build-probable-xi.ts` | 133 líneas | buildProbableXI |
| `lib/lineup/confirmed-lineup-window.ts` | 18 líneas | shouldFetchConfirmedLineup, CONFIRMED_LINEUP_WINDOW_MS |
| `lib/lineup/ensure-eleven-starter-slots.ts` | 11 líneas | ensureElevenStarterSlots |
| `lib/lineup/field-asset.ts` | 50 líneas | GOYA_FIELD_ASSET_VERSION, GOYA_FIELD_SRC, LINEUP_MODAL_FIELD_WIDTH_CLASS, LINEUP_MODAL_FIELD_WIDTH_PX, LINEUP_MODAL_WRAPPER_CLASS, LINEUP_MODAL_PANEL_CLASS, LINEUP_MODAL_PANEL_HOST_CLASS, PLAYER_MODAL_WRAPPER_CLASS, PLAYER_MODAL_PANEL_CLASS, PLAYER_MODAL_PANEL_HOST_CLASS, MVP_MODAL_WRAPPER_CLASS, MVP_MODAL_FIELD_HEIGHT_REM, MVP_MODAL_SAVE_FOOTER_REM, MVP_MODAL_FOOTER_HEIGHT_REM, MVP_MODAL_PICK_PANEL_CLASS, POSSIBLE_LINEUPS_MODAL_PANEL_CLASS, MVP_MODAL_PANEL_CLASS, MVP_MODAL_FIELD_BODY_HEIGHT_REM |
| `lib/lineup/field-layout.ts` | 102 líneas | clampToPlayable, clampToBounds, separateOverlappingSlots, PITCH_ASPECT_CLASS, MVP_PITCH_ASPECT_CLASS, PLAYABLE_X_MIN, PLAYABLE_X_MAX, PLAYABLE_Y_MIN, PLAYABLE_Y_MAX, PlayableBounds |
| `lib/lineup/fill-unmatched-starter-slots.ts` | 92 líneas | fillUnmatchedStarterSlotsFromSquad, StarterSlotDraft |
| `lib/lineup/fit-field-modal-layout.ts` | 107 líneas | computeFitFieldModalLayout, PITCH_ASPECT, BenchLayoutConfig, FitFieldModalLayout, ComputeFitFieldModalLayoutOptions |
| `lib/lineup/fit-mvp-horizontal-layout.ts` | 113 líneas | estimateMvpInlineBenchLayout, computeFitMvpHorizontalLayout, HORIZONTAL_PITCH_ASPECT, FitMvpHorizontalLayout, ComputeFitMvpHorizontalLayoutOptions |
| `lib/lineup/formation-coordinates.ts` | 179 líneas | isFormationId, isFormationTemplateId, getFormationSlotAnchors, getFormationCoordinates, TACTICAL_X, TACTICAL_Y, TACTICAL_LINE_Y, FORMATIONS, FormationSlotAnchor |
| `lib/lineup/formation-templates.ts` | 223 líneas | normalizeFormationTemplate, normalizeSlotKey, getFormationTemplate, getFormationTemplateCoordinates, getRoleCoordinatesFromTemplate, fallbackSlotKeyForRole, starterMatchesAnchor, assignFormationTemplateCoordinates, normalizeFormationId |
| `lib/lineup/lineup-cache-stale.ts` | 43 líneas | hasDuplicateStarterShirts, isPredictedLineupCacheStale |
| `lib/lineup/lineup-queries.ts` | 230 líneas | loadOfficialSquadFromClient, loadOfficialSquad, loadCachedTeamLineup, loadLastKnownFormation, findPrimaryMatchIdForTeam, upsertTeamLineup, isBetterLineupSource |
| `lib/lineup/lineups-modal-copy.ts` | 56 líneas | areMatchLineupsFullyConfirmed, possibleLineupsModalTitle, possibleLineupsActionCaption, possibleLineupsActionCaptionFromConfirmed, lineupsActionCaption, lineupsModalTitle, CONFIRMED_LINEUPS_MODAL_TITLE, POSSIBLE_LINEUPS_MODAL_TITLE, CONFIRMED_LINEUPS_ACTION_CAPTION, POSSIBLE_LINEUPS_ACTION_CAPTION, LIVE_LINEUPS_MODAL_TITLE, LIVE_LINEUPS_ACTION_CAPTION |
| `lib/lineup/match-field-geometry.ts` | 84 líneas | compressCoordToAwayHalf, compressCoordToHomeHalf, mirrorCoordVertical, applyGoyaPerspective, mapSlotsToHomeHalf, mapSlotsToAwayHalf, goyaScaleFactor, goyaWidthFactor, AWAY_HALF_Y, HOME_HALF_Y, MatchFieldSlot |
| `lib/lineup/modal-field-scale.ts` | 17 líneas | modalFieldScaleBottomTrim, MODAL_FIELD_WRAPPER_SCALE, MODAL_PITCH_DECOR_SCALE |
| `lib/lineup/mvp-field-chip-scale.ts` | 82 líneas | computeMvpFieldChipScale, MVP_STARTER_CHIP_SCALE_MULTIPLIER, MVP_CHIP_VISUAL_SIZE_FACTOR |
| `lib/lineup/mvp-horizontal-geometry.ts` | 103 líneas | mapLateralToPlayableY, compressCoordToHomeLeft, compressCoordToAwayRight, mapSlotsToHomeLeft, mapSlotsToAwayRight, HOME_HALF_X, AWAY_HALF_X, PLAYABLE_Y_MIN, PLAYABLE_Y_MAX, MvpHorizontalSlot |
| `lib/lineup/mvp-selection-key.ts` | 222 líneas | mvpSelectionKey, mvpPlayersMatch, findMvpOptionByKey, resolveMvpSelection, findMvpOptionBySaved, MvpSelectablePlayer, MvpResolvedSelection |
| `lib/lineup/player-dedupe.ts` | 36 líneas | normalizePlayerName, playerIdentityKey, dedupePlayersByIdentity, PlayerIdentity |
| `lib/lineup/player-detail.ts` | 54 líneas | getPlayerDetail, PlayerDetail |
| `lib/lineup/position-map.ts` | 57 líneas | normalizePositionRole, isGoalkeeperPosition, positionLabelEs, formationRoleCounts, pickFormation, coordinatesForFormation |
| `lib/lineup/predicted-slot-layout.ts` | 19 líneas | layoutPredictedStarters |
| `lib/lineup/prewarm-lineups.ts` | 182 líneas | prewarmUpcomingLineups |
| `lib/lineup/prewarm-types.ts` | 39 líneas | isPrewarmCacheFresh, PREWARM_HORIZON_MS, PREWARM_CRON_INTERVAL_MS, PREWARM_PREDICTED_TTL_MS, PrewarmTeamOutcome, PrewarmLineupsResult |
| `lib/lineup/relayout-lineup.ts` | 59 líneas | relayoutLineupSlots |
| `lib/lineup/resolve-formation-slots.ts` | 124 líneas | resolveFormationSlotsFromStarters, resolveFormationSlots, resolveFormationSlotsFromLineup, FormationSlotMatchInput, FormationStarterInput |
| `lib/lineup/resolve-lineup.ts` | 306 líneas | fetchConfirmedLineup, fetchPredictedLineup, getLineupSource, resolveTeamLineup, resolveMatchLineups, benchPlayersExcludingStarters, LineupSourceResolution |
| `lib/lineup/short-player-name.ts` | 119 líneas | shirtPlayerName, squadDisplayNames, displayNameInSquad, abbreviateMvpFieldLabel, mvpFieldDisplayName, shortPlayerName |
| `lib/lineup/source-labels.ts` | 33 líneas | lineupSourceHeadline, lineupSourceDetail, lineupSourceBadgeClass |
| `lib/lineup/sources/api-football-client.ts` | 90 líneas | fetchWorldCupFixturesFromApiFootball, getApiFootballKey, isApiFootballConfigured |
| `lib/lineup/sources/api-football-constants.ts` | 6 líneas | API_FOOTBALL_SOURCE_CODE, API_FOOTBALL_BASE_URL, API_FOOTBALL_WC_LEAGUE_ID, API_FOOTBALL_WC_SEASON |
| `lib/lineup/sources/api-football-grid.ts` | 30 líneas | apiFootballGridToCoordinate |
| `lib/lineup/sources/api-football-match-mapper.ts` | 86 líneas | kickoffToMs, kickoffDeltaMinutes, mapFixturesToInternalMatches, InternalMatchRef, ApiFootballFixtureRef, FixtureMapResult |
| `lib/lineup/sources/api-football-names.ts` | 44 líneas | normalizeTeamName, teamNamesMatch |
| `lib/lineup/sources/api-football.ts` | 250 líneas | fetchConfirmedLineupFromApiFootball, parseApiFootballTeamLineup |
| `lib/lineup/sources/bsd-client.ts` | 227 líneas | fetchWorldCupEventsFromBsd, fetchBsdEventsForMatchLookup, fetchBsdConfirmedLineups, fetchBsdPredictedLineup, getBsdApiKey, isBsdConfigured, buildBsdEventsLookupPath, BSD_FETCH_TIMEOUT_MS, BsdEventRef, BsdConfirmedLineupsPayload, BsdConfirmedPlayer, BsdConfirmedTeamLineup, BsdPredictedPlayer, BsdPredictedTeamLineup, BsdPredictedLineupsPayload |
| `lib/lineup/sources/bsd-confirmed.ts` | 59 líneas | fetchConfirmedLineupFromBsd |
| `lib/lineup/sources/bsd-constants.ts` | 8 líneas | BSD_SOURCE_CODE, BSD_PREDICTED_SOURCE_CODE, BSD_API_BASE_URL, BSD_WC_LEAGUE_ID, BSD_WC_SEASON_ID |
| `lib/lineup/sources/bsd-event-lookup.ts` | 76 líneas | resolveBsdEventId, pickBsdTeamSide |
| `lib/lineup/sources/bsd-lineup-parse.ts` | 324 líneas | parseBsdPredictedTeamLineup, parseBsdPredictedTeamLineupWithOfficialSquad, parseBsdConfirmedTeamLineup |
| `lib/lineup/sources/bsd-predicted.ts` | 58 líneas | fetchPredictedLineupFromBsd |
| `lib/lineup/sources/bsd-slot-coords.ts` | 68 líneas | coordinateForPredictedSlot, coordinateForConfirmedIndex |
| `lib/lineup/sources/bsd-squad-match.ts` | 508 líneas | namesReferToSamePlayer, officialToLineupInput, findOfficialSquadMatch, findSquadPlayer, assignStarterShirtNumbers, reserveSquadPlayerIdentity, FindSquadPlayerOptions, StarterShirtInput |
| `lib/lineup/sources/fotmob-client.ts` | 120 líneas | fetchFotmobMatchDetails, resolveFotmobMatchIdForInternalMatch, FotMobLayoutCoord, FotMobLineupPlayer, FotMobLineupTeam, FotMobPlayerOfTheMatch, FotMobMatchDetailsPayload |
| `lib/lineup/sources/fotmob-confirmed.ts` | 73 líneas | fetchConfirmedLineupFromFotmob, isFotmobLineupConfigured |
| `lib/lineup/sources/fotmob-lineup-parse.ts` | 133 líneas | parseFotmobConfirmedTeamLineup |
| `lib/lineup/sources/fotmob-match-mapper.ts` | 85 líneas | fotMobListItemToFixture, mapFotmobFixturesToInternalMatches, FotMobFixtureRef, FotMobFixtureMapResult |
| `lib/lineup/sources/predicted-provider.ts` | 17 líneas | fetchPredictedLineup |
| `lib/lineup/sources/types.ts` | 20 líneas | LineupFetchParams, ConfirmedLineupProvider, PredictedLineupProvider |
| `lib/lineup/squad-name.ts` | 35 líneas | squadTeamNameFromSlug, squadSlugFromTeamName |
| `lib/lineup/tactical-modal-layout.ts` | 75 líneas | buildTacticalModalLayout, computeTacticalBodyMinHeightPx, TACTICAL_MODAL_LAYOUT_WIDTH_PX, TACTICAL_SHELL_BENCH_PLACEHOLDER, TACTICAL_FIELD_WIDTH_PX, TACTICAL_FIELD_HEIGHT_PX, TACTICAL_FIELD_CHIP_SCALE, TACTICAL_SHELL_BODY_MIN_HEIGHT_PX |
| `lib/lineup/tactical-profile.ts` | 254 líneas | tacticalProfileKey, normalizeTacticalSlot, lookupTacticalProfile, resolveTacticalProfile, refinePredictedSlotKey, swapMirroredDefenderSlots, swapMirroredForwardSlots, tacticalSlotLabelEs, TacticalSlot, PredictedStarterSlotInput |
| `lib/lineup/team-kit-colors.ts` | 157 líneas | setTeamKitHexFromDb, getTeamKitHex, teamKitColorsClash, getTeamKitColors, TeamKitColors |
| `lib/lineup/team-kit-queries.ts` | 21 líneas | loadTeamKitHexBySlug |
| `lib/lineup/types.ts` | 71 líneas | PositionRole, FormationId, LineupPlayerInput, LineupPlayer, FieldCoordinate, LineupSlot, ProbableXIResult, LineupSourceKind, ResolvedLineup, StoredLineupRow, LineupBenchPlayer, LineupResolveContext |
| `lib/lineup/use-goya-field-ready.ts` | 20 líneas | useGoyaFieldReady |
| `lib/lineup/use-match-tactical-lineup-data.ts` | 141 líneas | useMatchTacticalLineupData |

**live/** — 12 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/live/match-stats-rows.ts` | 44 líneas | buildMatchStatRows, MatchStatRow |
| `lib/live/queries.ts` | 73 líneas | loadMatchLiveSnapshot, loadLiveSnapshotsForMatches, rowToMatchLiveSnapshot |
| `lib/live/sources/bsd-headline.ts` | 177 líneas | fetchBsdHeadline, truncateHeadline, pickHeadlineFromBsdSocial, composeHeadlineFromBsdIncidents, BsdHeadlineSource, BsdHeadline, BsdHeadlineContext |
| `lib/live/sources/bsd-live.ts` | 209 líneas | fetchBsdLiveLeagueEvents, fetchBsdEventDetail, fetchBsdEventStats, fetchBsdEventIncidents, fetchBsdLiveBundle, parseBsdStats, parseBsdSubstitutions, formatBsdMinuteLabel, isBsdEventLive, isBsdEventFinished, BsdLiveEventRow |
| `lib/live/sources/bsd-official-mvp.ts` | 134 líneas | fetchOfficialMvpFromBsd, parseOfficialMvpFromBsdIncidents, parseOfficialMvpFromBsdEventDetail, OfficialMvpFromBsd |
| `lib/live/sources/fifa-official-mvp.ts` | 338 líneas | loadFifaCalendarLookup, fetchOfficialMvpFromFifa, buildFifaCalendarLookup, resolveFifaMatchFromCalendar, findFifaTimelineMvpPlayerId, parseOfficialMvpFromFifaLive, FIFA_WC_SOURCE_CODE, FifaResolvedMatch, OfficialMvpFromFifa |
| `lib/live/sources/fotmob-official-mvp.ts` | 159 líneas | loadFotmobMatchesForDate, fetchOfficialMvpFromFotmob, fetchOfficialMvpFromFotmobByTeams, canonicalStoredPlayerName, resolveFotmobMatchId, parseOfficialMvpFromFotmobDetails, FOTMOB_SOURCE_CODE, FotMobMatchListItem, OfficialMvpFromFotmob |
| `lib/live/substitution-markers.ts` | 41 líneas | buildSubstitutionMarkers, substitutionMarkerForPlayer |
| `lib/live/sync-live-matches.ts` | 300 líneas | syncLiveMatches, SyncLiveMatchesResult |
| `lib/live/sync-official-mvp.ts` | 247 líneas | loadMatchesMissingOfficialMvp, syncOfficialMvps |
| `lib/live/types.ts` | 45 líneas | MatchSubstitution, MatchLiveStats, MatchLivePayload, MatchLiveSnapshot, SubstitutionMarkers |
| `lib/live/use-match-live-snapshot.ts` | 43 líneas | useMatchLiveSnapshot |

**media/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/media/save-image-to-gallery.ts` | 117 líneas | saveImageToGallery, isShareSaveCancellation, canSaveImageToGallery |

**narrative/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/narrative/engine.ts` | 25 líneas | NarrativeEngineOptions |
| `lib/narrative/llm-provider.stub.ts` | 10 líneas | — |
| `lib/narrative/template-provider.ts` | 16 líneas | — |
| `lib/narrative/types.ts` | 22 líneas | NarrativeTone, NarrativeContext, NarrativeItem |

**notifications/** — 10 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/notifications/confirmed-lineup-notifications.ts` | 247 líneas | areBothLineupsConfirmedInCache, maybeNotifyConfirmedLineup, syncConfirmedLineupNotifications, buildConfirmedLineupNotificationCopy, NotifyConfirmedLineupResult, SyncConfirmedLineupNotificationsResult |
| `lib/notifications/format.ts` | 23 líneas | formatNotificationDateTimeLine |
| `lib/notifications/kinds.ts` | 5 líneas | NOTIFICATION_KIND_PREDICTION_REMINDER, NOTIFICATION_KIND_CONFIRMED_LINEUP, NOTIFICATION_KIND_QUIZ_ACTIVE, NOTIFICATION_KIND_QUIZ_DAILY_REMINDER |
| `lib/notifications/notification-action.ts` | 25 líneas | resolveNotificationAction, NotificationAction |
| `lib/notifications/notification-navigation.ts` | 15 líneas | notificationNavigationPath, LINEUPS_NOTIFICATION_QUERY |
| `lib/notifications/prediction-reminders.ts` | 192 líneas | sendPredictionReminders, isPredictionReminderDue, buildPredictionReminderCopy, PREDICTION_REMINDER_KIND, PREDICTION_REMINDER_MINUTES, PREDICTION_REMINDER_CRON_INTERVAL_MS, PredictionReminderMissing, SendPredictionRemindersResult |
| `lib/notifications/quiz-active-announcement.ts` | 79 líneas | broadcastQuizActiveAnnouncement, BroadcastQuizActiveAnnouncementResult |
| `lib/notifications/quiz-active-copy.ts` | 17 líneas | buildQuizActiveAnnouncementCopy, buildQuizActiveModalCopy |
| `lib/notifications/quiz-daily-reminder.ts` | 143 líneas | sendQuizDailyReminders, buildQuizDailyReminderCopy, SendQuizDailyRemindersResult |
| `lib/notifications/types.ts` | 13 líneas | NotificationRow |

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

**players/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/players/search-players.ts` | 95 líneas | searchPlayers, goalkeeperFilter, SearchablePlayer, ScoredPlayer, PlayerSearchOptions |

**pool/** — 9 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/pool/active-pool.ts` | 67 líneas | loadAppShellContext, assertPoolMembership, UserPool, AppShellContext |
| `lib/pool/admin.ts` | 31 líneas | isPoolAdmin, isPoolOwner |
| `lib/pool/calendar-layout.ts` | 677 líneas | getMaxMatchesInMonthGrid, resetPredictionLabelMetrics, fitPredictionLabel, syncCalendarGridHeight, resetCalendarGridHeight, fitCalendarLayout, syncCalendarGuidePreview, resetCalendarLayout, CALENDAR_SIDEBAR_CARD_ANCHOR, SIDEBAR_CARD_ANCHOR_ATTR, CalendarLayoutResult |
| `lib/pool/format-kickoff.ts` | 11 líneas | formatKickoff |
| `lib/pool/group-standings.ts` | 278 líneas | toGroupMatchRows, buildGroupStandingsDetail, buildGroupStandings, findGroupStandingDetail, isCalendarGroupsPanelDay, isCalendarSidebarDay, isCalendarGroupsCompanionDay, CALENDAR_GROUPS_PANEL_DAYS, CALENDAR_SIDEBAR_DAYS, CALENDAR_GROUPS_COMPANION_DAY, GroupTeamStanding, GroupStandingRow, GroupStandingDetail, GroupStandingsSource, GroupMatchLike |
| `lib/pool/match-calendar.ts` | 258 líneas | kickoffDateKey, toMonthKey, parseMonthKey, formatCalendarDayLabel, formatCalendarMonthLabel, formatMonthYearLabel, formatMonthLabel, formatKickoffTime, formatCalendarKickoffHour, indexMatchesByDate, getMonthRangeFromMatches, getInitialMonthYear, shiftMonth, compareMonth, buildMonthGrid, trimEmptyMatchWeeks, groupMatchesByDay, WEEKDAY_LABELS, CalendarMatchLike, MatchDayGroup, CalendarCell, CalendarWeek, MonthYear |
| `lib/pool/queries.ts` | 44 líneas | getPoolMatches, PoolMatchRow |
| `lib/pool/require-context.ts` | 29 líneas | requireActivePoolContext, getCachedAppShellContext |
| `lib/pool/tournament-stats.ts` | 70 líneas | tournamentHasGoals, getTournamentTopScorers, getTournamentStatRows, TournamentScorerRow, TournamentStatRow, TournamentStatKind |

**predictions/** — 16 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/predictions/calendar-data-access.ts` | 8 líneas | CalendarModalOpenOptions, CalendarModalOpener |
| `lib/predictions/calendar-finished-card.ts` | 96 líneas | resolveCalendarFinishedCard, CalendarFinishedCardVariant, CalendarFinishedCardState |
| `lib/predictions/calendar-guide-demos.ts` | 127 líneas | CalendarGuideEntry |
| `lib/predictions/deadline.ts` | 27 líneas | predictionLockDeadlineMs, formatPredictionCountdown, PREDICTION_LOCK_MINUTES |
| `lib/predictions/edit-state.ts` | 54 líneas | resolvePredictionUiState, displayGoals, formatListScore, NO_PREDICTION_LABEL, PredictionUiState, PredictionUiInput |
| `lib/predictions/knockout-bracket-geometry.ts` | 424 líneas | bracketGridRowCenter, gridRowToPercentY, buildColumnCenters, mapColumnX, gutterX, cardEdgeX, connectorEdgeX, buildBracketGeometry, finalCenterYFromGeometry, buildPairCentersInBand, buildBracketConnectorPaths, matchPosition, finalHitSpanPercent, BRACKET_GRID_COLS, BRACKET_GRID_ROWS, COL_R32_LEFT, COL_FINAL_HOME, COL_FINAL_AWAY, COL_R32_RIGHT, BRACKET_HEADER_BAND_Y, BRACKET_FOOTER_BAND_Y, R32_BOTTOM_ANCHOR_Y, R32_TOP_ANCHOR_Y, KO_CARD_SIZE_SCALE, ORB_PAIR_INNER_HALF_Y, R32_PAIR_INNER_HALF_Y, FINAL_CUP_OFFSET_ABOVE_FINAL, CARD_HALF_WIDTH_BASE, ORB_HALF_WIDTH_X, BRACKET_COLUMN_INSET, FINAL_CENTER_X, FINAL_ANCHOR_LEFT_X, FINAL_ANCHOR_RIGHT_X, BracketGridRoundIndex, BracketMatchGeometry, BracketConnectorSegment |
| `lib/predictions/knockout-bracket-layout.ts` | 98 líneas | buildKnockoutMatchMap, resolveBracketMatch, placeholderPairForMatchNumber, BracketRoundKey |
| `lib/predictions/knockout-layout.ts` | 27 líneas | syncKnockoutViewportHeight, resetKnockoutViewportHeight |
| `lib/predictions/mvp-match-state.ts` | 92 líneas | mvpPlayerNameFromMatch, mvpShirtNumberFromMatch, mvpSnapshotFromMatch, mergeMvpIntoMatch, mvpOverridesFromMatches, preferMatchMvpData, patchMatchMvpPrediction, mvpOverridesFromMatchListAndActive, MvpSnapshot |
| `lib/predictions/mvp-queries.ts` | 58 líneas | fetchMvpPredictionsForMatches, getMvpPredictionForMatch, MvpPrediction |
| `lib/predictions/prediction-outcome.ts` | 29 líneas | resolveScoreOutcome, isMvpPredictionCorrect, ScoreOutcome |
| `lib/predictions/queries.ts` | 496 líneas | assertMatchInPool, fetchMatchEditableFromDb, getPoolMatchesWithPredictions, getPoolGroupStageMatchesWithPredictions, getPoolKnockoutMatchesWithPredictions, getMatchPredictionDetail, countPendingPredictions, getAdminOpenMatches, getMatchPredictionsBoard, getPeerPredictionsForMatch, computePredictionEditableLocally, arePeerPredictionsLikelyVisible, MatchWithPrediction, MatchDetail, AdminOpenMatch, PeerPredictionRow, MatchPredictionsBoardRow, MatchPredictionsBoard |
| `lib/predictions/scoring.ts` | 14 líneas | formatMvpPointsLabel, MATCH_SCORE_POINTS, MVP_PREDICTION_POINTS |
| `lib/predictions/stage-filter.ts` | 34 líneas | isGroupStageMatchdayKey, isKnockoutMatchdayKey, GROUP_STAGE_CALENDAR_MONTH, KNOCKOUT_ROUND_ORDER |
| `lib/predictions/teams-picker-data.ts` | 15 líneas | getAllWorldCupTeamsAlphabetically |
| `lib/predictions/validation.ts` | 24 líneas | parseGoalValue, validatePredictionGoals, MAX_GOALS |

**push/** — 5 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/push/client.ts` | 86 líneas | registerPushServiceWorker, getServiceWorkerRegistration, getExistingPushSubscription, subscribeToPush, isPushSupported, serializePushSubscription, getPushClientStatus, PushClientStatus |
| `lib/push/prompt-storage.ts` | 15 líneas | isPushPromptDismissed, dismissPushPrompt, clearPushPromptDismissed |
| `lib/push/send.ts` | 83 líneas | sendPushToProfile, PushPayload, SendPushResult |
| `lib/push/urls.ts` | 49 líneas | quizActiveNotificationUrl, confirmedLineupNotificationUrl, predictionReminderNotificationUrl, quizDailyReminderNotificationUrl, pushUrlForNotificationKind, QUIZ_ACTIVE_NOTIFICATION_QUERY, LINEUPS_NOTIFICATION_QUERY |
| `lib/push/vapid.ts` | 27 líneas | getVapidPublicKey, assertVapidConfigured, isVapidConfigured |

**pwa/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/pwa/deployment-version.ts` | 11 líneas | getDeploymentVersion, APP_VERSION_STORAGE_KEY |
| `lib/pwa/onboarding-access-codes-built-in.ts` | 25 líneas | — |
| `lib/pwa/onboarding-access-codes.ts` | 45 líneas | getOnboardingAccessCodeMap, getOnboardingAccessCode, hasOnboardingAccessCode |
| `lib/pwa/onboarding-cookie.ts` | 6 líneas | PWA_ONBOARDING_COOKIE, PWA_STANDALONE_GATE_COOKIE, PWA_ONBOARDING_MAX_AGE_SECONDS, PWA_STANDALONE_GATE_MAX_AGE_SECONDS |
| `lib/pwa/onboarding-participants.ts` | 79 líneas | getOnboardingParticipants, isKnownOnboardingParticipant, OnboardingParticipant |
| `lib/pwa/onboarding-phones.ts` | 51 líneas | normalizePhone, isOnboardingEligibleUsername, resolveParticipantByAlias, resolveParticipantByPhone, ONBOARDING_ELIGIBLE_USERNAMES, PhoneParticipant |
| `lib/pwa/standalone.ts` | 30 líneas | isStandalonePWA, detectMobileOs, MobileOs |

**quiz/** — 35 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/quiz/close-day.ts` | 66 líneas | closeQuizDay, CloseQuizDayResult, CloseQuizDayOptions |
| `lib/quiz/cron.ts` | 58 líneas | madridHour, madridMinute, isQuizOpenWindow, isQuizCloseWindow, isQuizDailyReminderWindow, quizCronAction, quizDateForCron, assertCronAuthorized, formatMadridClock, QuizCronAction |
| `lib/quiz/date.ts` | 151 líneas | isQuizCompetitiveDay, todayQuizDate, madridLocalParts, quizDayOpensAt, quizDayClosesAt, quizDayWindow, resolveQuizWindow, isQuizWindowOpen, QUIZ_COMPETITIVE_START_DATE, MadridLocalParts, QuizWindowLike |
| `lib/quiz/distractors.ts` | 153 líneas | getOptionSemanticType, buildDistractorLabels, buildMcqOptions, McqOption, OptionSemanticType |
| `lib/quiz/facts.ts` | 141 líneas | validateQuizFact, parseFactsFile, loadFacts, DEFAULT_FACTS_PATH, QuizFactCategory, QuizFactType, QuizFactDifficulty, QuizFact |
| `lib/quiz/final-ranking.ts` | 41 líneas | computeQuizFinalRankingBonuses, QuizFinalRankingInput, QuizFinalRankingBonus |
| `lib/quiz/format.ts` | 13 líneas | formatQuizScore, formatQuizReliabilityPct |
| `lib/quiz/generate-day.ts` | 201 líneas | generateQuizDayFromSources, loadRecentFactIds, selectFactsForDay, generateQuizDay, attachFactsSourceMeta, listGeneratedDates |
| `lib/quiz/generate-question.ts` | 58 líneas | generateQuestionFromFact, GeneratedQuizQuestion |
| `lib/quiz/generate-worldcup-facts.ts` | 217 líneas | buildWorldcupFactsFromHistoric |
| `lib/quiz/generated-day.ts` | 69 líneas | toSeedQuestion, generatedDayToSeedFile, parseGeneratedOrSeedDay, questionsMetaFromDay, GeneratedQuizDayFile |
| `lib/quiz/home-teaser.ts` | 71 líneas | homeQuizSlideFromHub, HomeQuizSlide |
| `lib/quiz/intro-countdown.ts` | 29 líneas | introCountdownFromRemaining, IntroCountdownView |
| `lib/quiz/intro.ts` | 18 líneas | QUIZ_INTRO_VIDEO_SRC, QUIZ_INTRO_TITLE_MS, QUIZ_INTRO_CROSSFADE_MS, QUIZ_INTRO_OUTRO_MS, QUIZ_INTRO_OUTRO_LEAD_S, QUIZ_PLAY_ENTER_MS |
| `lib/quiz/mode.ts` | 45 líneas | isPoolCompetitive |
| `lib/quiz/module.contract.ts` | 3 líneas | QuizModuleContract |
| `lib/quiz/options.ts` | 35 líneas | parseQuizOptions, validateQuizAnswers |
| `lib/quiz/parse-session.ts` | 101 líneas | parseQuizStartSession |
| `lib/quiz/play-flow.ts` | 44 líneas | pickWrongOptionId, resolveOptionVisualState, shouldAutoSubmit, nextStepAfterFeedback, QUESTION_TIME_SEC, FEEDBACK_DELAY_MS, QuestionPhase, OptionVisualState |
| `lib/quiz/play-routes.ts` | 10 líneas | isQuizPlayResume, QUIZ_PLAY_HREF, QUIZ_PLAY_RESUME_HREF |
| `lib/quiz/publish-day.ts` | 109 líneas | publishQuizDay, PublishQuizDayResult, PublishQuizDayOptions |
| `lib/quiz/quality.ts` | 151 líneas | validateSemanticCoherence, validateGeneratedQuestion, assertGeneratedQuestions, QualityResult |
| `lib/quiz/queries.ts` | 386 líneas | getQuizzesForDate, getQuizAttemptsForProfile, getQuizDayHub, startQuizSession, getQuizResult, getQuizLeaderboard, isQuizPlayable |
| `lib/quiz/question-templates.ts` | 59 líneas | renderQuestionFromFact, QuestionTemplateResult |
| `lib/quiz/quiz-facts-repository.ts` | 118 líneas | upsertWorldcupFacts, shouldPersistFacts, validateWorldcupFactRow, prepareFactsForUpsert, toUpsertPayload, QUIZ_FACTS_WORLDCUP_TABLE, PrepareFactsResult, UpsertFactsResult, UpsertWorldcupFactsDeps |
| `lib/quiz/recent-fact-ids.ts` | 66 líneas | loadRecentFactIdsFromDb, factIdsFromSettings |
| `lib/quiz/reliability.ts` | 10 líneas | computeQuizReliabilityPct |
| `lib/quiz/rng.ts` | 33 líneas | mulberry32, hashString, seedFromQuizDate, shuffleWithRng |
| `lib/quiz/score-queries.ts` | 68 líneas | loadQuizFinalRankingBonusesByProfile, getQuizFinalRankingScoreForProfile, QuizFinalRankingScoreRow |
| `lib/quiz/scoring.ts` | 10 líneas | quizFinalRankingBonusForPosition, QUIZ_FINAL_RANKING_BONUS_BY_POSITION, QUIZ_FINAL_RANKING_TOP_N |
| `lib/quiz/seed-day.ts` | 154 líneas | parseSeedQuizDayFile, scoringFieldsForMode, QUIZ_OFFICIAL_TITLE, SeedQuizOption, SeedQuizQuestion, SeedBonusBlock, SeedQuizDayFile |
| `lib/quiz/seed-db.ts` | 234 líneas | ensureQuizPool, isPoolCompetitiveAdmin, findQuizForDate, upsertQuizBundle, seedQuizDayToDb, QuizAdminClient |
| `lib/quiz/slot-status.ts` | 158 líneas | getQuizSlotStatus, getLatestSubmittedAttemptId, canOpenQuizPlay, canReplayQuiz, getQuizPlayCta, shouldShowQuizAlreadyPlayedModal, formatQuizSlotStatusLabel, QuizSlotStatus, QuizPlayAccessOptions, QuizPlayCta |
| `lib/quiz/types.ts` | 103 líneas | QuizKind, QuizScoringMode, QuizAttemptStatus, QuizOption, QuizQuestionPublic, QuizQuestionPlay, QuizSummary, QuizStartSession, QuizRow, QuizAttemptRow, QuizDaySlot, QuizDayHub, QuizLeaderboardRow, QuizResultResponse |
| `lib/quiz/worldcup-facts-source.ts` | 189 líneas | fetchWorldcupFactsFromDb, loadQuizFactsWithFallback, isMenQuizFact, mapWorldcupRowToQuizFact, parseWorldcupFactsRows, mergeFactPools, MIN_FACTS_FOR_DAY, MIN_FACTS_POOL, QuizFactsSourceKind, QuizFactsLoadResult, LoadQuizFactsDeps |

**ranking/** — 4 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/ranking/context-rows.ts` | 30 líneas | getContextualLeaderboardStartIndex, pickContextualLeaderboardRows, VISIBLE_ROW_COUNT |
| `lib/ranking/format.ts` | 4 líneas | formatAggregateStat |
| `lib/ranking/queries.ts` | 464 líneas | getReferenceMatchday, getReferenceMatchdayId, getPoolLeaderboard, getMemberStanding, memberStandingFromLeaderboard, ReferenceMatchday, PositionTrend, LeaderboardRow, MemberStanding |
| `lib/ranking/reliability.ts` | 17 líneas | computeReliabilityPct, formatReliabilityPct, MAX_POINTS_PER_MATCH |

**scoring/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/scoring/compute.ts` | 31 líneas | matchOutcome, computeMatchPoints, ScoreInput |

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

**supabase/** — 5 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/supabase/admin.ts` | 16 líneas | createAdminClient |
| `lib/supabase/client.ts` | 11 líneas | createClient |
| `lib/supabase/middleware.ts` | 159 líneas | updateSession |
| `lib/supabase/route.ts` | 27 líneas | createClientFromRoute |
| `lib/supabase/server.ts` | 30 líneas | createClient |

**teams/** — 2 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/teams/display.ts` | 130 líneas | teamNameEs, teamAbbr, formatMatchCalendarAbbr, knockoutBracketDisplayName, knockoutBracketSlotLabel, knockoutTeamLabel |
| `lib/teams/flags.ts` | 89 líneas | teamFlagCode, nearestFlagcdnWidth, teamFlagUrl, teamFlagEmoji |

**text/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/text/normalize-alias.ts` | 26 líneas | normalizeText, normalizeAlias |

**tournament-predictions/** — 6 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/tournament-predictions/display.ts` | 47 líneas | formatChampionDisplay, formatChampionDisplayCompact, formatFinalistsDisplay, formatFinalistsDisplayFull, formatPlayerDisplay, formatPlayerDisplayFull, hasFinalists |
| `lib/tournament-predictions/official-awards-queries.ts` | 59 líneas | getTournamentOfficialAwards, TournamentOfficialAwards |
| `lib/tournament-predictions/queries.ts` | 166 líneas | fetchTournamentGeneralPredictionsEditable, getTournamentGeneralPredictions, getPoolTournamentGeneralPredictionsBoard |
| `lib/tournament-predictions/score-queries.ts` | 76 líneas | loadTournamentGeneralScoresByProfile, getTournamentGeneralScoreForProfile, TournamentGeneralPredictionScoreRow |
| `lib/tournament-predictions/scoring.ts` | 159 líneas | computeTournamentChampionPoints, computeTournamentFinalistsPoints, computeTournamentPlayerAwardPoints, computeTournamentGeneralScoreBreakdown, TOURNAMENT_GENERAL_SCORE_POINTS, TournamentGeneralScoreBreakdown, TournamentOfficialAwardsInput, TournamentGeneralPredictionsInput |
| `lib/tournament-predictions/types.ts` | 48 líneas | TournamentGeneralPredictions, TournamentGeneralPredictionField, TournamentGeneralPredictionsBoardRow |

**ui/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/ui/use-panel-slide-stack.ts` | 146 líneas | usePanelSlideStack |

**utils.ts/** — 1 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/utils.ts` | 4 líneas | cn |

**worldcup-data/** — 3 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/worldcup-data/all-squad-players-queries.ts` | 44 líneas | getAllTournamentPlayers |
| `lib/worldcup-data/squad-queries.ts` | 100 líneas | getTeamSquadByName, TeamSquadWithPlayers |
| `lib/worldcup-data/types.ts` | 195 líneas | FJELSTUL_SOURCE, FJELSTUL_SOURCE_URL, FJELSTUL_SOURCE_LABEL, WC2026_FEED_SOURCE, OPENFOOTBALL_SOURCE, WcHistoricGender, WcHistoricTournamentRow, WcHistoricTeamRow, WcHistoricStadiumRow, WcHistoricMatchRow, WcHistoricGoalRow, WcHistoricAwardWinnerRow, WcHistoricStandingRow, TeamSquadRow, TeamSquadPlayerRow, QuizFactWorldcupRow, Wc2026TeamRow, Wc2026StadiumRow, Wc2026GameRow, ExternalIdMapRow, MatchLiveStateRow, OpenFootballMatchRef, OpenFootballTeamRef, OpenFootballHostCityRef |

**worldcup2026/** — 7 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/worldcup2026/api-client.ts` | 41 líneas | fetchWc2026Games, fetchWc2026Teams, Wc2026ApiGame |
| `lib/worldcup2026/fifa-squads.ts` | 127 líneas | fetchFifaCalendarTeams, fetchFifaTeamSquad, titleCasePlayerName, FifaCalendarTeamRef, FifaSquadPlayerRaw |
| `lib/worldcup2026/match-mapper.ts` | 132 líneas | buildTeamLookup, mapGamesToOpenFootball, mapStadiumsToHostCities, MatchMappingResult |
| `lib/worldcup2026/normalize-squads.ts` | 112 líneas | normalizePositionForStorage, squadExternalKey, normalizeFifaSquadsToRows, normalizeCsvSquadsToRows, WC2026_SQUAD_YEAR, WC2026_SQUAD_COMPETITION, Wc2026SquadCsvRow |
| `lib/worldcup2026/parse-csv.ts` | 83 líneas | parseWc2026TeamsCsv, parseWc2026StadiaCsv, parseWc2026GamesCsv, parseWc2026GroupsCsv, wc2026ExternalKey |
| `lib/worldcup2026/parse-squads-csv.ts` | 48 líneas | parseWc2026SquadsCsv, serializeWc2026SquadsCsv |
| `lib/worldcup2026/squad-team-names.ts` | 121 líneas | openFootballTeamName, squadLookupNames, openFootballNameFromFifaCode, fifaCodeFromOpenFootball |

**youtube/** — 6 archivos

| Archivo | Tamaño | Exports |
|---------|--------|--------|
| `lib/youtube/constants.ts` | 47 líneas | youtubeChannelRssUrl, fifaChannelRssUrl, teledeporteRssUrl, youtubeThumbnailUrl, youtubeEmbedUrl, FIFA_YOUTUBE_CHANNEL_ID, TELEDEPORTE_RTVE_YOUTUBE_CHANNEL_ID, HIGHLIGHT_SOURCE_CODES, YoutubeThumbnailQuality |
| `lib/youtube/highlight-priority.ts` | 32 líneas | shouldReplaceMatchHighlight, highlightSourceLabel, HighlightSourceCode |
| `lib/youtube/match-video.ts` | 160 líneas | isFifaHighlightTitle, isTeledeporteHighlightTitle, parseTeamsFromHighlightTitle, parseTeamsFromTeledeporteTitle, buildTeamAliasIndex, resolveTeamLabel, pickMatchForHighlightVideo, TeamAliasIndex |
| `lib/youtube/parse-feed.ts` | 42 líneas | parseYoutubeChannelFeed |
| `lib/youtube/sync-highlights.ts` | 331 líneas | syncAllMatchHighlights, syncYoutubeFifaHighlights, SyncYoutubeHighlightsResult, SyncAllMatchHighlightsResult |
| `lib/youtube/types.ts` | 13 líneas | YoutubeFeedVideo, YoutubeHighlightMatchCandidate |


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
| Migraciones | 37 archivos en `supabase/migrations/` |
| Tablas | 44 |
| Enums | match_status, pool_member_role, pool_member_role_new, quiz_attempt_status, quiz_kind, quiz_scoring_mode |
| Funciones SQL | 35 |
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
| `match_team_lineups` | Ver migraciones SQL | RLS habilitado |
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
| `quiz_final_ranking_scores` | Ver migraciones SQL | RLS habilitado |
| `quiz_question_keys` | Respuestas correctas (acceso revocado) | RLS habilitado |
| `quiz_questions` | Preguntas de un quiz | RLS habilitado |
| `quiz_responses` | Respuestas individuales por intento | RLS habilitado |
| `quizzes` | Cuestionarios opcionales por porra | RLS habilitado |
| `team_squad_players` | Ver migraciones SQL | RLS habilitado |
| `team_squads` | Ver migraciones SQL | RLS habilitado |
| `teams` | Ver migraciones SQL | RLS habilitado |
| `tournament_general_prediction_scores` | Ver migraciones SQL | RLS habilitado |
| `tournament_general_predictions` | Ver migraciones SQL | RLS habilitado |
| `tournament_official_awards` | Ver migraciones SQL | RLS habilitado |
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
| `compute_tournament_champion_points` | RPC / trigger |
| `compute_tournament_finalists_points` | RPC / trigger |
| `compute_tournament_player_award_points` | RPC / trigger |
| `consume_invite_and_join` | RPC / trigger |
| `expire_stale_quiz_attempts` | RPC / trigger |
| `generate_news_batch` | RPC / trigger |
| `get_match_predictions_board` | RPC / trigger |
| `is_pool_admin` | RPC / trigger |
| `is_pool_member` | RPC / trigger |
| `is_pool_owner` | RPC / trigger |
| `is_pool_tournament_finished` | RPC / trigger |
| `match_exact_points` | RPC / trigger |
| `match_sign_points` | RPC / trigger |
| `mvp_prediction_points` | RPC / trigger |
| `prediction_edit_allowed` | RPC / trigger |
| `quiz_final_ranking_bonus_for_position` | RPC / trigger |
| `rebuild_pool_member_scores` | RPC / trigger |
| `recalculate_match_mvp_scores` | RPC / trigger |
| `recalculate_match_scores` | RPC / trigger |
| `recalculate_quiz_final_ranking_scores` | RPC / trigger |
| `recalculate_tournament_general_scores` | RPC / trigger |
| `start_quiz_attempt` | RPC / trigger |
| `submit_quiz_attempt` | RPC / trigger |
| `tournament_champion_points` | RPC / trigger |
| `tournament_finalist_single_points` | RPC / trigger |
| `tournament_finalists_points` | RPC / trigger |
| `tournament_general_predictions_edit_allowed` | RPC / trigger |
| `tournament_golden_glove_points` | RPC / trigger |
| `tournament_mvp_award_points` | RPC / trigger |
| `tournament_player_prediction_match` | RPC / trigger |
| `tournament_top_scorer_points` | RPC / trigger |
| `upsert_tournament_official_awards` | RPC / trigger |

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
- `supabase/migrations/20260609120000_tournament_general_predictions.sql` (67 líneas)
- `supabase/migrations/20260609140000_profile_phones.sql` (39 líneas)
- `supabase/migrations/20260609150000_profile_phone_aitor.sql` (15 líneas)
- `supabase/migrations/20260610120000_tournament_general_scoring.sql` (297 líneas)
- `supabase/migrations/20260610140000_match_team_lineups_upsert_rls.sql` (11 líneas)
- `supabase/migrations/20260610140000_tournament_finalists_partial_scoring.sql` (41 líneas)
- `supabase/migrations/20260610150000_remove_solskjaer_participant.sql` (7 líneas)
- `supabase/migrations/20260611063855_quiz_daily_window.sql` (267 líneas)
- `supabase/migrations/20260611120000_prediction_reminder_notifications.sql` (14 líneas)
- `supabase/migrations/20260611120000_scoring_scale_v2.sql` (103 líneas)
- `supabase/migrations/20260611150000_match_mvp_predictions_shirt_number.sql` (8 líneas)
- `supabase/migrations/20260611180000_match_live_state_payload.sql` (8 líneas)
- `supabase/migrations/20260611180000_quiz_final_ranking_bonus.sql` (122 líneas)
- `supabase/migrations/20260611190000_quiz_final_ranking_bonus_v2.sql` (82 líneas)
- `supabase/migrations/20260611190000_tournament_general_predictions_peers_select.sql` (7 líneas)
- `supabase/migrations/20260611193000_quiz_active_notification_kind.sql` (6 líneas)
- `supabase/migrations/20260611200000_push_subscriptions_endpoint_unique.sql` (5 líneas)
- `supabase/migrations/20260611200000_quiz_daily_reminder_notifications.sql` (19 líneas)
- `supabase/migrations/20260611220000_match_predictions_board_rpc.sql` (76 líneas)
- `supabase/migrations/20260612120000_profile_onboarding_completed.sql` (8 líneas)
- `supabase/migrations/20260613120000_teams_primary_kit_hex.sql` (71 líneas)
- `supabase/migrations/20260614120000_match_team_lineups.sql` (31 líneas)
- `supabase/migrations/20260615120000_match_highlights.sql` (14 líneas)
- `supabase/migrations/20260616200000_match_highlight_source.sql` (24 líneas)
- `supabase/migrations/20260617120000_match_highlight_headline.sql` (12 líneas)

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
| `API_FOOTBALL_KEY` | Ver código | Opcional | `` | lib/lineup/sources/api-football-client.ts, lib/lineup/sources/api-football.ts, scripts/probe-match-mvp-sources.ts |
| `AUTH_INTERNAL_DOMAIN` | Dominio email sintético | Opcional | `auth.trincadores.local` | lib/auth/credentials.ts |
| `BSD_API_KEY` | Ver código | Opcional | `` | lib/lineup/sources/bsd-client.ts, lib/live/sources/bsd-headline.ts, scripts/emit-bsd-map-sql.ts |
| `CONFIRM_PURGE` | Ver código | Opcional | `` | lib/scripts/env-guard.ts |
| `CONFIRM_REIMPORT` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `CONFIRM_RESEED` | Ver código | Opcional | `` | scripts/publish-quiz-day.ts, scripts/seed-quiz-day.ts |
| `CRON_SECRET` | Protección endpoints cron (sin uso aún) | Opcional | `random-secret-string` | app/api/cron/live-matches/route.ts, lib/quiz/cron.ts |
| `DATABASE_URL` | Postgres directo para seed.sql | Opcional | `postgresql://postgres:pass@host:5432/postgres` | — |
| `EXCLUDE_FACT_IDS` | Ver código | Opcional | `` | scripts/publish-quiz-day.ts |
| `FIFA_API_BASE_URL` | Ver código | Opcional | `` | lib/live/sources/fifa-official-mvp.ts, lib/worldcup2026/fifa-squads.ts |
| `FIFA_SEASON_ID` | Ver código | Opcional | `` | lib/live/sources/fifa-official-mvp.ts, lib/worldcup2026/fifa-squads.ts |
| `NEXT_PUBLIC_SITE_URL` | URL pública para redirects auth | Opcional | `http://localhost:3000` | lib/site-url.ts, scripts/bootstrap-participants.ts |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clave pública anon | Sí | `eyJhbG...anon` | lib/supabase/client.ts, lib/supabase/middleware.ts, lib/supabase/route.ts |
| `NEXT_PUBLIC_SUPABASE_URL` | URL proyecto Supabase | Sí | `https://xxxx.supabase.co` | lib/scripts/env-guard.ts, lib/scripts/supabase-admin.ts, lib/supabase/admin.ts |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Ver código | Opcional | `` | lib/push/vapid.ts |
| `NODE_ENV` | Entorno Node (cookies secure) | Auto | `development` | actions/pwa-onboarding.ts, lib/auth/clear-device-cookies.ts, lib/auth/onboarding-device.ts |
| `ONBOARDING_ACCESS_CODES_JSON` | Ver código | Opcional | `` | lib/pwa/onboarding-access-codes.test.ts, lib/pwa/onboarding-access-codes.ts |
| `OPENFOOTBALL_DIR` | Ver código | Opcional | `` | scripts/import-openfootball-wc2026.ts |
| `POOL_SLUG` | Ver código | Opcional | `` | lib/quiz/seed-db.ts, scripts/import-openfootball-wc2026.ts, scripts/seed-quiz-day.ts |
| `QUIZ_DATE` | Ver código | Opcional | `` | scripts/generate-quiz-day.ts, scripts/publish-quiz-day.ts, scripts/seed-quiz-day.ts |
| `QUIZ_DAY_FILE` | Ver código | Opcional | `` | scripts/seed-quiz-day.ts |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role (server/seed/rollback) | Sí | `eyJhbG...service` | lib/scripts/env-guard.ts, lib/scripts/supabase-admin.ts, lib/supabase/admin.ts |
| `VAPID_PRIVATE_KEY` | Ver código | Opcional | `` | lib/push/vapid.ts |
| `VAPID_SUBJECT` | Ver código | Opcional | `` | lib/push/vapid.ts |
| `VERCEL_DEPLOYMENT_ID` | Ver código | Opcional | `` | lib/pwa/app-update.test.ts, lib/pwa/deployment-version.ts |
| `VERCEL_GIT_COMMIT_SHA` | Ver código | Opcional | `` | lib/pwa/app-update.test.ts, lib/pwa/deployment-version.ts |
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
| `components/predictions/QuickPredictionModal.tsx` | 957 | Revisar extracción |
| `lib/pool/calendar-layout.ts` | 677 | Revisar extracción |
| `supabase/migrations/20260604220000_initial_schema.sql` | 661 | Revisar extracción |
| `components/predictions/PredictionsCalendar.tsx` | 589 | Revisar extracción |
| `components/ui/modal.tsx` | 555 | Revisar extracción |
| `lib/lineup/sources/bsd-squad-match.ts` | 508 | Revisar extracción |
| `lib/predictions/queries.ts` | 496 | Revisar extracción |
| `lib/ranking/queries.ts` | 464 | Revisar extracción |
| `components/layout/TabSwipeNavigator.tsx` | 436 | Revisar extracción |
| `components/pwa/PwaOnboardingFlow.tsx` | 428 | Revisar extracción |
| `lib/predictions/knockout-bracket-geometry.ts` | 424 | Revisar extracción |
| `components/matches/MatchTeamsDisplay.tsx` | 390 | Revisar extracción |
| `lib/quiz/queries.ts` | 386 | Revisar extracción |
| `components/lineup/EntityModalController.tsx` | 361 | Revisar extracción |
| `components/quiz/QuizPlaySession.tsx` | 351 | Revisar extracción |

### Código posiblemente sin uso

- `components/highlights/MatchHighlightScoreline.tsx` — posible código muerto
- `components/home/BackgroundPlayerLayer.tsx` — posible código muerto
- `components/home/HomeTopThree.tsx` — posible código muerto
- `components/lineup/LineupSourceBadge.tsx` — posible código muerto
- `components/lineup/MatchMvpFieldGraphic.tsx` — posible código muerto
- `components/match/MatchRow.tsx` — posible código muerto
- `components/predictions/MatchPredictionCard.tsx` — posible código muerto
- `components/quiz/QuizModeBadge.tsx` — posible código muerto
- `components/quiz/QuizProgressDots.tsx` — posible código muerto
- `components/quiz/QuizSlotCard.tsx` — posible código muerto
- `components/ui/hero-cta.tsx` — posible código muerto
- `lib/auth/trusted-sign-in.ts` — posible código muerto
- `lib/dev/seed-ids.ts` — posible código muerto
- `lib/fjelstul-worldcup/download.ts` — posible código muerto
- `lib/layout/bottom-chrome.ts` — posible código muerto
- `lib/lineup/sources/bsd-slot-coords.ts` — posible código muerto
- `lib/lineup/sources/fotmob-match-mapper.ts` — posible código muerto
- `lib/lineup/sources/predicted-provider.ts` — posible código muerto
- `lib/narrative/engine.ts` — posible código muerto
- `lib/notifications/quiz-active-announcement.ts` — posible código muerto

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
- [x] Alineaciones con capa de fuentes: confirmed (FotMob → BSD → API-Football) > predicted (BSD) > fallback dorsal; BD `match_team_lineups` + badge UI
- [x] Integración BSD (Bzzoiro): predicted lineups WC 2026 + confirmed ~1h antes del pitido
- [x] Migracion `worldcup_external_data` aplicada en remoto (MCP)
- [x] Migracion `match_mvp_predictions` aplicada en remoto (MCP)
- [x] Import Fjelstul historico + plantillas (625 squads, ~13k jugadores)
- [x] Import plantillas oficiales WC 2026 (48 squads, 1248 jugadores, source worldcup2026/FIFA)
- [x] Import feed worldcup2026 (32 partidos mapeados; 40 pending por TBD/plantilla CSV parcial 72 juegos)
- [x] Migracion `match_team_lineups` aplicada en remoto (MCP)
- [x] Script `db:map-api-football-fixtures` (matches → fixture IDs API-Football)
- [x] Mapeo BSD remoto: 93/104 partidos en `external_id_map` (72 grupos + 21 eliminatorias; 11 sin match por placeholders `3A/B/C/D/F` vs BSD)
- [x] TabBar: Quiz sustituye Actividad (`/quiz`, icono Brain)
- [x] Quiz safe-area: `QuizPageShell` + CSS `tm-quiz-page` (play con scroll interno)
- [x] Slide home quiz en hero carousel
- [x] Quiz auto-generacion: banco hechos + plantillas + generate-day + seed integrado
- [x] Quiz training rejugable (migracion RPC/índice)
- [x] Bonus deprecado en UI/seed
- [x] Quiz gameplay rapido: timer 10s, feedback inmediato, auto-submit, resultado minimo
- [x] Quiz generador: distractores semanticos + owner replay ilimitado
- [x] Quiz cron diario 00:00 abrir / 23:59 cerrar Madrid (`/api/cron/quiz-daily` + `publishQuizDay` + `closeQuizDay`)
- [x] Quiz competitivo oficial desde 2026-06-11 (fecha civil Madrid)
- [x] Quiz entradilla TV: animacion + video gabri + barra de carga antes del play
- [x] Alineaciones: optimización carga (bundle actions, ventana confirmada, BSD lookup acotado)
- [x] Alineaciones: plantilla visual fija por formación + relayout al leer caché (coords consistentes entre equipos)
- [x] MVP partido: proyección por bandas tácticas, claves por dorsal y targets táctiles 48px
- [x] Sistema táctico unificado: `formation-coordinates` (6 formaciones incl. 4-1-4-1) + espejo vertical MVP + UI compacta (reservas arriba, meta abajo, sin pastilla de formación)
- [x] Cron precalentamiento alineaciones (`/api/cron/lineup-prewarm`, cada 5 min, XI confirmado T-90, horizonte 48h)
- [x] Resúmenes FIFA YouTube: cron RSS `@fifa`, slide hero «Último partido», reproductor in-app, modal partido finalizado
- [x] Notificaciones push+: las 4 kinds (pronóstico T-30, alineaciones confirmadas, quiz activo, recordatorio quiz diario) envían in-app + Web Push
- [x] Mundial en juego: cron `live-matches` (cada 2 min) persiste marcador/stats BSD, marca `live`/`finished`, escribe `match_results` y recalcula ranking al finalizar
- [x] MVP oficial automático: cron `live-matches` prioriza FotMob (`playerOfTheMatch` FIFA en Mundiales) → FIFA → BSD; persiste `match_results.mvp_*` sin pisar admin
- [x] Alineaciones confirmadas: FotMob como fuente prioritaria (`matchDetails.lineup`, WC2026); script `db:map-fotmob-fixtures`
- [x] Titulares BSD en highlights: columnas `matches.highlight_headline` / `highlight_headline_source`; sync social → incidentes vía cron `live-matches` y `youtube-highlights`; UI hero con titular corto

### En desarrollo / pendiente

- [ ] API-Football free tier: temporada 2026 no disponible; lineups confirmadas vía BSD o plan de pago API-Football
- [ ] Enchufar proveedor predicted lineups gratuito cuando exista fuente fiable
- [ ] Mejorar match-mapper cuando se resuelvan placeholders UEFA en worldcup2026
- [ ] Probar flujo E2E con login real (official + bonus)
- [ ] Fase 1e activity feed real
- [ ] Entregar codigos de acceso al grupo (access-codes.local.txt)

### Placeholders detectados

_Ninguno._

### TODOs / FIXMEs en código

- `components/notifications/NotificationsBell.tsx:32` — <p className="text-[15px] font-semibold tracking-tight text-[#2F5D6A]">Todo al día</p>
- `components/notifications/NotificationsBell.tsx:258` — {clearingAll ? "…" : "Borrar todo"}
- `lib/lineup/fit-field-modal-layout.test.ts:21` — it("encaja todo en viewports bajos sin depender de scroll", () => {
- `lib/lineup/fit-mvp-horizontal-layout.test.ts:39` — it("encaja todo en viewports bajos sin scroll", () => {

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
- **Auto-actualización:** manual (`npm run llm-context`). Hook git desactivado.
- **Archivos vigilados:** `app/`, `actions/`, `components/`, `lib/`, `types/`, `supabase/migrations/`, `docs/`, configs raíz
- **Límites escalabilidad:** 40 ítems por grupo; archivos >300 líneas solo en riesgos

