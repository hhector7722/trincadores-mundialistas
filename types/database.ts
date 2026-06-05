export type MatchStatus = 'scheduled' | 'live' | 'finished' | 'postponed' | 'cancelled';
export type PoolMemberRole = 'owner' | 'admin' | 'player';
export type PredictionVisibility = 'kickoff' | 'always' | 'never';
export type PoolSettings = { prediction_visibility?: PredictionVisibility; lock_minutes?: number; [key: string]: unknown };
export type Profile = {
  id: string;
  username: string;
  display_name: string | null;
  recovery_email: string | null;
  avatar_url: string | null;
  is_active: boolean;
  access_code_rotated_at: string | null;
  created_at: string;
};
export type Pool = { id: string; slug: string; name: string; settings_json: PoolSettings; created_at: string };
export type PoolMember = { pool_id: string; profile_id: string; role: PoolMemberRole; joined_at: string };
export type Prediction = { id: string; pool_id: string; match_id: string; profile_id: string; home_goals: number; away_goals: number; points_awarded: number | null; created_at: string; updated_at: string };
export type PoolMemberScore = { pool_id: string; profile_id: string; matchday_id: string; match_points: number; exact_hits: number; sign_hits: number; cumulative_points: number; rank: number | null; updated_at: string };
export type QuizStartPayload = { attempt_id: string; expires_at: string; questions: Array<{ id: string; sort_order: number; prompt: string; options: unknown; points: number }> };

