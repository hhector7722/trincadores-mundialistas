import type { SupabaseClient } from "@supabase/supabase-js";
import {
  daznEsRssUrl,
  fifaChannelRssUrl,
  HIGHLIGHT_SOURCE_CODES,
  replayRssUrl,
  teledeporteRssUrl,
} from "@/lib/youtube/constants";
import {
  hasLowerHighlightPriority,
  shouldReplaceMatchHighlight,
  type HighlightSourceCode,
} from "@/lib/youtube/highlight-priority";
import { syncBsdHeadlineForMatch } from "@/lib/highlights/sync-bsd-headline";
import { maybeNotifyMatchHighlight } from "@/lib/notifications/match-highlight-notifications";
import { parseYoutubeChannelFeed } from "@/lib/youtube/parse-feed";
import {
  buildTeamAliasIndex,
  isDaznHighlightTitle,
  isFifaHighlightTitle,
  isReplayHighlightTitle,
  isTeledeporteHighlightTitle,
  parseTeamsFromDaznTitle,
  parseTeamsFromHighlightTitle,
  parseTeamsFromReplayTitle,
  parseTeamsFromTeledeporteTitle,
  pickMatchForHighlightVideo,
} from "@/lib/youtube/match-video";
import type { YoutubeFeedVideo } from "@/lib/youtube/types";

export type SyncYoutubeHighlightsResult = {
  scanned: number;
  matched: number;
  skipped: number;
  errors: string[];
};

export type SyncAllMatchHighlightsResult = {
  dazn: SyncYoutubeHighlightsResult;
  fifa: SyncYoutubeHighlightsResult;
  replay: SyncYoutubeHighlightsResult;
  teledeporte: SyncYoutubeHighlightsResult;
};

type MatchHighlightRow = {
  id: string;
  home_team: string;
  away_team: string;
  kickoff_at: string;
  highlight_youtube_id: string | null;
  highlight_published_at: string | null;
  highlight_source: HighlightSourceCode | null;
  status: string;
};

type ChannelSyncConfig = {
  sourceCode: HighlightSourceCode;
  feedUrl: string;
  channelLabel: string;
  isHighlightTitle: (title: string) => boolean;
  parseTeams: (title: string) => { home: string; away: string } | null;
};

const CHANNEL_CONFIGS: ChannelSyncConfig[] = [
  {
    sourceCode: HIGHLIGHT_SOURCE_CODES.dazn,
    feedUrl: daznEsRssUrl(),
    channelLabel: "DAZN ES",
    isHighlightTitle: isDaznHighlightTitle,
    parseTeams: parseTeamsFromDaznTitle,
  },
  {
    sourceCode: HIGHLIGHT_SOURCE_CODES.fifa,
    feedUrl: fifaChannelRssUrl(),
    channelLabel: "FIFA",
    isHighlightTitle: isFifaHighlightTitle,
    parseTeams: parseTeamsFromHighlightTitle,
  },
  {
    sourceCode: HIGHLIGHT_SOURCE_CODES.replay,
    feedUrl: replayRssUrl(),
    channelLabel: "Replay",
    isHighlightTitle: isReplayHighlightTitle,
    parseTeams: parseTeamsFromReplayTitle,
  },
  {
    sourceCode: HIGHLIGHT_SOURCE_CODES.teledeporte,
    feedUrl: teledeporteRssUrl(),
    channelLabel: "Teledeporte",
    isHighlightTitle: isTeledeporteHighlightTitle,
    parseTeams: parseTeamsFromTeledeporteTitle,
  },
];

async function loadProcessedVideoIds(
  admin: SupabaseClient,
  sourceCode: HighlightSourceCode,
): Promise<Set<string>> {
  const ids = new Set<string>();

  const { data: mapped } = await admin
    .from("external_id_map")
    .select("external_key")
    .eq("source_code", sourceCode);

  for (const row of mapped ?? []) {
    if (row.external_key) ids.add(row.external_key);
  }

  return ids;
}

async function loadMatchCandidates(admin: SupabaseClient): Promise<MatchHighlightRow[]> {
  const { data: matches, error } = await admin
    .from("matches")
    .select(
      "id, home_team, away_team, kickoff_at, highlight_youtube_id, highlight_published_at, highlight_source, status",
    )
    .eq("status", "finished")
    .order("kickoff_at", { ascending: true });

  if (error) throw new Error(error.message);
  return (matches ?? []) as MatchHighlightRow[];
}

async function fetchChannelVideos(
  feedUrl: string,
  channelLabel: string,
): Promise<YoutubeFeedVideo[]> {
  const response = await fetch(feedUrl, {
    headers: { Accept: "application/atom+xml,text/xml" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`Feed YouTube ${channelLabel} HTTP ${response.status}`);
  }

  const xml = await response.text();
  return parseYoutubeChannelFeed(xml, 30);
}

async function recordMappedVideo(
  admin: SupabaseClient,
  video: YoutubeFeedVideo,
  sourceCode: HighlightSourceCode,
  matchId: string | null,
  matchStatus: "mapped" | "skipped",
  extraMetadata?: Record<string, unknown>,
): Promise<void> {
  const publishedAt = new Date(video.publishedAt).toISOString();

  await admin.from("external_id_map").upsert(
    {
      source_code: sourceCode,
      external_key: video.videoId,
      entity_type: "match",
      internal_table: matchId ? "matches" : null,
      internal_id: matchId,
      metadata: {
        title: video.title,
        published_at: publishedAt,
        ...extraMetadata,
      },
      match_status: matchStatus,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "source_code,external_key" },
  );
}

async function attachHighlightToMatch(
  admin: SupabaseClient,
  video: YoutubeFeedVideo,
  matchId: string,
  sourceCode: HighlightSourceCode,
  siteOrigin?: string,
): Promise<"attached" | "skipped" | "skipped_priority"> {
  const { data: existing, error: readError } = await admin
    .from("matches")
    .select("id, highlight_youtube_id, highlight_published_at, highlight_source, status")
    .eq("id", matchId)
    .maybeSingle();

  if (readError || !existing || existing.status !== "finished") return "skipped";

  const publishedAt = new Date(video.publishedAt).toISOString();
  const existingSource = (existing.highlight_source as HighlightSourceCode | null) ?? null;

  if (
    !shouldReplaceMatchHighlight(
      existingSource,
      existing.highlight_published_at,
      sourceCode,
      publishedAt,
    )
  ) {
    if (existingSource && hasLowerHighlightPriority(sourceCode, existingSource)) {
      await recordMappedVideo(admin, video, sourceCode, matchId, "skipped", {
        reason: "lower_priority",
        existing_source: existingSource,
      });
      return "skipped_priority";
    }
    return "skipped";
  }

  const { data: matchMeta, error: metaError } = await admin
    .from("matches")
    .select("home_team, away_team")
    .eq("id", matchId)
    .maybeSingle();

  if (metaError || !matchMeta) return "skipped";

  const { error: updateError } = await admin
    .from("matches")
    .update({
      highlight_youtube_id: video.videoId,
      highlight_published_at: publishedAt,
      highlight_source: sourceCode,
    })
    .eq("id", matchId);

  if (updateError) return "skipped";

  await recordMappedVideo(admin, video, sourceCode, matchId, "mapped");
  await syncBsdHeadlineForMatch(admin, matchId);
  await maybeNotifyMatchHighlight(
    admin,
    {
      id: matchId,
      home_team: matchMeta.home_team,
      away_team: matchMeta.away_team,
    },
    siteOrigin,
  );
  return "attached";
}

async function syncChannelHighlights(
  admin: SupabaseClient,
  config: ChannelSyncConfig,
  candidates: MatchHighlightRow[],
  aliasIndex: ReturnType<typeof buildTeamAliasIndex>,
  siteOrigin?: string,
): Promise<SyncYoutubeHighlightsResult> {
  const result: SyncYoutubeHighlightsResult = {
    scanned: 0,
    matched: 0,
    skipped: 0,
    errors: [],
  };

  const [videos, processed] = await Promise.all([
    fetchChannelVideos(config.feedUrl, config.channelLabel),
    loadProcessedVideoIds(admin, config.sourceCode),
  ]);

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

    if (!config.isHighlightTitle(video.title)) {
      result.skipped += 1;
      continue;
    }

    const teams = config.parseTeams(video.title);
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
      const outcome = await attachHighlightToMatch(
        admin,
        video,
        hit.matchId,
        config.sourceCode,
        siteOrigin,
      );
      if (outcome === "attached") {
        result.matched += 1;
        processed.add(video.videoId);

        const candidate = candidates.find((row) => row.id === hit.matchId);
        if (candidate) {
          candidate.highlight_youtube_id = video.videoId;
          candidate.highlight_published_at = new Date(video.publishedAt).toISOString();
          candidate.highlight_source = config.sourceCode;
        }
      } else {
        result.skipped += 1;
        if (outcome === "skipped_priority") {
          processed.add(video.videoId);
        }
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      result.errors.push(`${video.videoId}: ${message}`);
    }
  }

  return result;
}

/** Sincroniza DAZN ES, FIFA, Replay (@Replay) y Teledeporte RTVE (fallback). */
export async function syncAllMatchHighlights(
  admin: SupabaseClient,
  siteOrigin?: string,
): Promise<SyncAllMatchHighlightsResult> {
  const candidates = await loadMatchCandidates(admin);
  const teamNames = [
    ...new Set(candidates.flatMap((match) => [match.home_team, match.away_team])),
  ];
  const aliasIndex = buildTeamAliasIndex(teamNames);

  const dazn = await syncChannelHighlights(
    admin,
    CHANNEL_CONFIGS[0]!,
    candidates,
    aliasIndex,
    siteOrigin,
  );
  const fifa = await syncChannelHighlights(
    admin,
    CHANNEL_CONFIGS[1]!,
    candidates,
    aliasIndex,
    siteOrigin,
  );
  const replay = await syncChannelHighlights(
    admin,
    CHANNEL_CONFIGS[2]!,
    candidates,
    aliasIndex,
    siteOrigin,
  );
  const teledeporte = await syncChannelHighlights(
    admin,
    CHANNEL_CONFIGS[3]!,
    candidates,
    aliasIndex,
    siteOrigin,
  );

  const { data: missingHeadlines } = await admin
    .from("matches")
    .select("id")
    .eq("status", "finished")
    .not("highlight_youtube_id", "is", null)
    .is("highlight_headline", null);

  for (const row of missingHeadlines ?? []) {
    await syncBsdHeadlineForMatch(admin, row.id as string);
  }

  const { data: highlightMatches } = await admin
    .from("matches")
    .select("id, home_team, away_team")
    .eq("status", "finished")
    .not("highlight_youtube_id", "is", null);

  for (const row of highlightMatches ?? []) {
    await maybeNotifyMatchHighlight(
      admin,
      {
        id: row.id as string,
        home_team: row.home_team as string,
        away_team: row.away_team as string,
      },
      siteOrigin,
    );
  }

  return { dazn, fifa, replay, teledeporte };
}

/** @deprecated Usar syncAllMatchHighlights. Mantiene compatibilidad con scripts existentes. */
export async function syncYoutubeFifaHighlights(
  admin: SupabaseClient,
  feedUrl = fifaChannelRssUrl(),
): Promise<SyncYoutubeHighlightsResult> {
  const result = await syncAllMatchHighlights(admin);
  void feedUrl;
  return {
    scanned:
      result.dazn.scanned +
      result.fifa.scanned +
      result.replay.scanned +
      result.teledeporte.scanned,
    matched:
      result.dazn.matched +
      result.fifa.matched +
      result.replay.matched +
      result.teledeporte.matched,
    skipped:
      result.dazn.skipped +
      result.fifa.skipped +
      result.replay.skipped +
      result.teledeporte.skipped,
    errors: [
      ...result.dazn.errors,
      ...result.fifa.errors,
      ...result.replay.errors,
      ...result.teledeporte.errors,
    ],
  };
}
