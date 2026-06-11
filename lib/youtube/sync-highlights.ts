import type { SupabaseClient } from "@supabase/supabase-js";
import { fifaChannelRssUrl } from "@/lib/youtube/constants";
import { parseYoutubeChannelFeed } from "@/lib/youtube/parse-feed";
import {
  buildTeamAliasIndex,
  isFifaHighlightTitle,
  parseTeamsFromHighlightTitle,
  pickMatchForHighlightVideo,
} from "@/lib/youtube/match-video";
import type { YoutubeFeedVideo } from "@/lib/youtube/types";

export type SyncYoutubeHighlightsResult = {
  scanned: number;
  matched: number;
  skipped: number;
  errors: string[];
};

async function loadProcessedVideoIds(admin: SupabaseClient): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: mapped } = await admin
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", "youtube_fifa");

  for (const row of mapped ?? []) {
    if (row.external_key) ids.add(row.external_key);
  }

  const { data: matches } = await admin
    .from("matches")
    .select("highlight_youtube_id")
    .not("highlight_youtube_id", "is", null);

  for (const row of matches ?? []) {
    if (row.highlight_youtube_id) ids.add(row.highlight_youtube_id);
  }

  return ids;
}

async function loadMatchCandidates(admin: SupabaseClient) {
  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, kickoff_at, highlight_youtube_id, status")
    .eq("status", "finished")
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);
  return matches ?? [];
}

async function fetchChannelVideos(feedUrl: string): Promise<YoutubeFeedVideo[]> {
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/atom+xml,text/xml" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Feed YouTube FIFA HTTP ${response.status}`);
  }

  const xml = await response.text();
  return parseYoutubeChannelFeed(xml, 20);
}

async function attachHighlightToMatch(
  admin: SupabaseClient,
  video: YoutubeFeedVideo,
  matchId: string,
): Promise<boolean> {
  const { data: existing, error: readError } = await admin
    .from("matches")
    .select("id, highlight_youtube_id, highlight_published_at, status")
    .eq("id", matchId)
    .maybeSingle();

  if (readError || !existing || existing.status !== "finished") return false;

  const publishedAt = new Date(video.publishedAt).toISOString();
  const shouldReplace =
    !existing.highlight_youtube_id ||
    !existing.highlight_published_at ||
    new Date(publishedAt).getTime() >= new Date(existing.highlight_published_at).getTime();

  if (!shouldReplace) return false;

  const { error: updateError } = await admin
    .from("matches")
    .update({
      highlight_youtube_id: video.videoId,
      highlight_published_at: publishedAt,
    })
    .eq("id", matchId);

  if (updateError) return false;

  await admin.from("external_id_map").upsert(
    {
      source_code: "youtube_fifa",
      external_key: video.videoId,
      entity_type: "match",
      internal_table: "matches",
      internal_id: matchId,
      metadata: {
        title: video.title,
        published_at: publishedAt,
      },
      match_status: "mapped",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_code,external_key" },
  );

  return true;
}

export async function syncYoutubeFifaHighlights(
  admin: SupabaseClient,
  feedUrl = fifaChannelRssUrl(),
): Promise<SyncYoutubeHighlightsResult> {
  const result: SyncYoutubeHighlightsResult = {
    scanned: 0,
    matched: 0,
    skipped: 0,
    errors: [],
  };

  const [videos, candidates, processed] = await Promise.all([
    fetchChannelVideos(feedUrl),
    loadMatchCandidates(admin),
    loadProcessedVideoIds(admin),
  ]);

  const teamNames = [
    ...new Set(candidates.flatMap((match) => [match.home_team, match.away_team])),
  ];
  const aliasIndex = buildTeamAliasIndex(teamNames);

  const candidateRows = candidates.map((match) => ({
    matchId: match.id,
    homeTeam: match.home_team,
    awayTeam: match.away_team,
    kickoffAt: match.kickoff_at,
  }));

  for (const video of videos) {
    result.scanned += 1;

    if (processed.has(video.videoId)) {
      result.skipped += 1;
      continue;
    }

    if (!isFifaHighlightTitle(video.title)) {
      result.skipped += 1;
      continue;
    }

    const teams = parseTeamsFromHighlightTitle(video.title);
    if (!teams) {
      result.skipped += 1;
      continue;
    }

    const hit = pickMatchForHighlightVideo(
      teams.home,
      teams.away,
      video.publishedAt,
      candidateRows,
      aliasIndex,
    );

    if (!hit) {
      result.skipped += 1;
      continue;
    }

    try {
      const attached = await attachHighlightToMatch(admin, video, hit.matchId);
      if (attached) {
        result.matched += 1;
        processed.add(video.videoId);
      } else {
        result.skipped += 1;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      result.errors.push(`${video.videoId}: ${message}`);
    }
  }

  return result;
}
