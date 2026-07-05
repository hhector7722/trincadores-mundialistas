-- Índices para optimizar las uniones (JOINs) y filtros en matches
CREATE INDEX IF NOT EXISTS matches_matchday_id_idx ON public.matches USING btree (matchday_id);
CREATE INDEX IF NOT EXISTS matches_kickoff_at_status_idx ON public.matches USING btree (kickoff_at, status);

-- Índices para optimizar filtros en predictions y match_mvp_predictions
CREATE INDEX IF NOT EXISTS predictions_pool_match_idx ON public.predictions USING btree (pool_id, match_id);
CREATE INDEX IF NOT EXISTS predictions_match_idx ON public.predictions USING btree (match_id);

CREATE INDEX IF NOT EXISTS match_mvp_predictions_pool_match_idx ON public.match_mvp_predictions USING btree (pool_id, match_id);
CREATE INDEX IF NOT EXISTS match_mvp_predictions_match_idx ON public.match_mvp_predictions USING btree (match_id);

-- Índices para resultados y estados en vivo
CREATE INDEX IF NOT EXISTS match_results_match_idx ON public.match_results USING btree (match_id);
CREATE INDEX IF NOT EXISTS match_live_state_match_idx ON public.match_live_state USING btree (match_id);

-- Índice para pool_members
CREATE INDEX IF NOT EXISTS pool_members_pool_idx ON public.pool_members USING btree (pool_id);
CREATE INDEX IF NOT EXISTS matchdays_pool_idx ON public.matchdays USING btree (pool_id);
