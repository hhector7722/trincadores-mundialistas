# Notas RLS (0b.2)

## Visibilidad predicciones (default kickoff)
- `pools.settings_json.prediction_visibility = "kickoff"`.
- Ajenas visibles si partido `live`/`finished` o `now() >= kickoff_at`.
- Propias siempre via `predictions_select_own`.

## Edicion predicciones (T-5)
- `prediction_edit_allowed(match_id)`: `scheduled` y `now() < kickoff_at - interval '5 minutes'`.
- Politicas insert/update/delete de `predictions` usan ese helper.

## Roles homogeneos
- `pool_members.role`: `owner` | `admin` | `player`.
- DEFAULT SQL: `player`.
- Sin `pools.owner_id`. Admin/owner via `is_pool_admin` / `is_pool_owner`.

## pool_members INSERT
- Solo `is_pool_admin(pool_id)` puede insertar miembros.
- No hay rama de "primer owner" por cliente. Alta inicial pool+owner: RPC en Fase 1a.

## notifications INSERT
- REVOKE INSERT a `authenticated`. Solo service role / RPC (futuro).

## Quiz
- `quiz_questions`: revocado; solo vista `quiz_questions_public`.
- `quiz_question_keys`: sin acceso authenticated.
- `start_quiz_attempt` devuelve JSONB con preguntas publicas.
- `submit_quiz_attempt` valida `expires_at`.
- `UNIQUE(quiz_id, profile_id)` en `quiz_attempts`.

## Tablas solo RPC (escritura)
- `quiz_attempts`, `quiz_responses`: sin INSERT/UPDATE directo authenticated.

## invite_codes
- Sin politicas para authenticated: denegado.

## Politicas por accion (criticas)
- `predictions`, `pool_members`, `notifications`, `quiz_attempts`, `quiz_responses`: SELECT/UPDATE/DELETE separados donde aplica.
- Calendario (`matchdays`, `matches`, `match_results`): SELECT + write admin (FOR ALL justificado).
## invite_codes
- Sin politicas para authenticated: denegado.
- Alta en pool: RPC `consume_invite_and_join` (Fase 1a, SECURITY DEFINER).

## Bootstrap pool + primer owner
- Fuera del cliente. Seed + service_role.
- `create_pool_with_owner`: previsto futuro, no en 1a.
