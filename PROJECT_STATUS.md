# Trincadores Mundialistas

## Fase actual: 2b datos externos Mundiales (Fjelstul + worldcup2026 feed)

## Visual
- Dark mode morado intermedio (#2a1058) + difuminado glass + acento neón lima (#D4FF00), estilo porra deportiva

## Completado
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

## Siguiente
- [x] Migracion `worldcup_external_data` aplicada en remoto (MCP)
- [x] Migracion `match_mvp_predictions` aplicada en remoto (MCP)
- [x] Import Fjelstul historico + plantillas (625 squads, ~13k jugadores)
- [x] Import feed worldcup2026 (32 partidos mapeados; 40 pending por TBD/plantilla CSV parcial 72 juegos)
- [ ] Mejorar match-mapper cuando se resuelvan placeholders UEFA en worldcup2026
- [ ] Probar flujo E2E con login real (official + bonus)
- [ ] Fase 1e activity feed real
- [ ] Entregar codigos de acceso al grupo (access-codes.local.txt)
- [x] TabBar: Quiz sustituye Actividad (`/quiz`, icono Brain)
- [x] Quiz safe-area: `QuizPageShell` + CSS `tm-quiz-page` (play con scroll interno)
- [x] Slide home quiz en hero carousel
- [x] Quiz auto-generacion: banco hechos + plantillas + generate-day + seed integrado
- [x] Quiz training rejugable (migracion RPC/índice)
- [x] Bonus deprecado en UI/seed
- [x] Quiz gameplay rapido: timer 10s, feedback inmediato, auto-submit, resultado minimo
- [x] Quiz generador: distractores semanticos + owner replay ilimitado