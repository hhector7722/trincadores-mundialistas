import type { ResolvedLineup } from "@/lib/lineup/types";
import type { SupabaseClient } from "@supabase/supabase-js";

export type LineupFetchParams = {
  supabase: SupabaseClient;
  matchId: string;
  teamName: string;
  players: import("@/lib/lineup/types").LineupPlayerInput[];
};

export type ConfirmedLineupProvider = {
  code: string;
  fetchConfirmedLineup: (params: LineupFetchParams) => Promise<ResolvedLineup | null>;
};

export type PredictedLineupProvider = {
  code: string;
  fetchPredictedLineup: (params: LineupFetchParams) => Promise<ResolvedLineup | null>;
};
