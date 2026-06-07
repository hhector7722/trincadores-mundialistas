/** Tipos compartidos: histórico Fjelstul, feed worldcup2026, plantillas y quiz facts. */

export const FJELSTUL_SOURCE = "fjelstul";
export const FJELSTUL_SOURCE_URL = "https://github.com/jfjelstul/worldcup";
export const FJELSTUL_SOURCE_LABEL =
  "Fjelstul World Cup Database v1.2.0 (CC-BY-SA 4.0)";

export const WC2026_FEED_SOURCE = "worldcup2026";
export const OPENFOOTBALL_SOURCE = "openfootball";

export type WcHistoricGender = "men" | "women";

export type WcHistoricTournamentRow = {
  external_id: string;
  year: number;
  name: string;
  host_country: string | null;
  winner: string | null;
  start_date: string | null;
  end_date: string | null;
  gender: WcHistoricGender;
};

export type WcHistoricTeamRow = {
  external_id: string;
  name: string;
  code: string | null;
  confederation: string | null;
};

export type WcHistoricStadiumRow = {
  external_id: string;
  name: string;
  city: string | null;
  country: string | null;
  capacity: number | null;
};

export type WcHistoricMatchRow = {
  external_id: string;
  tournament_external_id: string;
  home_team_external_id: string | null;
  away_team_external_id: string | null;
  stadium_external_id: string | null;
  match_date: string | null;
  match_time: string | null;
  stage_name: string | null;
  group_name: string | null;
  home_score: number | null;
  away_score: number | null;
  extra_time: boolean;
  penalty_shootout: boolean;
};

export type WcHistoricGoalRow = {
  external_id: string;
  match_external_id: string;
  tournament_external_id: string;
  team_external_id: string | null;
  player_name: string;
  minute_label: string | null;
  own_goal: boolean;
  penalty: boolean;
};

export type WcHistoricAwardWinnerRow = {
  external_key: string;
  tournament_external_id: string;
  award_name: string;
  player_name: string;
  team_name: string | null;
  shared: boolean;
};

export type WcHistoricStandingRow = {
  external_key: string;
  tournament_external_id: string;
  team_name: string;
  position: number;
};

export type TeamSquadRow = {
  source_code: string;
  external_key: string;
  team_name: string;
  team_code: string | null;
  year: number | null;
  tournament_external_id: string | null;
  competition_code: string | null;
  label: string | null;
};

export type TeamSquadPlayerRow = {
  squad_external_key: string;
  external_player_key: string | null;
  player_name: string;
  position: string | null;
  shirt_number: number | null;
  club: string | null;
  status: string;
  metadata?: Record<string, unknown>;
};

export type QuizFactWorldcupRow = {
  id: string;
  category: string;
  fact_type: string;
  subject: string;
  value: string;
  year: number | null;
  difficulty: "easy" | "medium" | "hard";
  option_semantic_type: string;
  distractor_pool: string[];
  metadata: Record<string, unknown>;
  source_url: string;
  source_label: string;
  enabled: boolean;
};

export type Wc2026TeamRow = {
  sourceId: string;
  nameEn: string;
  fifaCode: string | null;
  iso2: string | null;
  groupCode: string | null;
};

export type Wc2026StadiumRow = {
  sourceId: string;
  nameEn: string;
  fifaName: string | null;
  cityEn: string | null;
  countryEn: string | null;
  capacity: number | null;
};

export type Wc2026GameRow = {
  sourceId: string;
  homeTeamSourceId: string;
  awayTeamSourceId: string;
  homeScore: number;
  awayScore: number;
  groupCode: string | null;
  matchday: number | null;
  kickoffIso: string | null;
  stadiumSourceId: string | null;
  finished: boolean;
  timeElapsed: string;
  type: string;
};

export type ExternalIdMapRow = {
  source_code: string;
  external_key: string;
  entity_type: "match" | "team" | "stadium" | "group";
  internal_table: string;
  internal_id?: string;
  metadata?: Record<string, unknown>;
  match_status?: "mapped" | "pending" | "rejected";
};

export type MatchLiveStateRow = {
  match_id: string;
  source_code: string;
  source_external_key: string;
  home_score: number;
  away_score: number;
  time_elapsed: string;
  finished: boolean;
};

export type OpenFootballMatchRef = {
  id: string;
  external_match_id: string | null;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  group_code: string | null;
  match_number: number | null;
};

export type OpenFootballTeamRef = {
  id: string;
  external_key: string;
  name: string;
  fifa_name: string | null;
};

export type OpenFootballHostCityRef = {
  id: string;
  external_key: string;
  city: string;
  stadium_name: string;
};
