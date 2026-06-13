import type { HighlightSourceCode } from "@/lib/youtube/highlight-priority";

/** Canal oficial FIFA en YouTube (@fifa). */
export const FIFA_YOUTUBE_CHANNEL_ID = "UCpcTrCXblq78GZrTUTLWeBw";

/** Canal Teledeporte RTVE (@TeledeporteRTVE). */
export const TELEDEPORTE_RTVE_YOUTUBE_CHANNEL_ID = "UC4SBVYTpqOh-exr7BShLAPw";

/** Canal DAZN España (@DAZNES). */
export const DAZN_ES_YOUTUBE_CHANNEL_ID = "UCz9FiMLz6SOgR_4VEFvjeIA";

/** Canal Replay FIFA (@Replay). */
export const REPLAY_YOUTUBE_CHANNEL_ID = "UCM2DAYhfMPkGi7o6erYXiHg";

export function youtubeChannelRssUrl(channelId: string): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function fifaChannelRssUrl(channelId = FIFA_YOUTUBE_CHANNEL_ID): string {
  return youtubeChannelRssUrl(channelId);
}

export function teledeporteRssUrl(channelId = TELEDEPORTE_RTVE_YOUTUBE_CHANNEL_ID): string {
  return youtubeChannelRssUrl(channelId);
}

export function daznEsRssUrl(channelId = DAZN_ES_YOUTUBE_CHANNEL_ID): string {
  return youtubeChannelRssUrl(channelId);
}

export function replayRssUrl(channelId = REPLAY_YOUTUBE_CHANNEL_ID): string {
  return youtubeChannelRssUrl(channelId);
}

export const HIGHLIGHT_SOURCE_CODES = {
  dazn: "youtube_dazn_es",
  fifa: "youtube_fifa",
  replay: "youtube_replay",
  teledeporte: "youtube_rtve_teledeporte",
} as const satisfies Record<string, HighlightSourceCode>;

export type YoutubeThumbnailQuality = "mqdefault" | "hqdefault" | "maxresdefault";

export function youtubeThumbnailUrl(
  videoId: string,
  quality: YoutubeThumbnailQuality = "hqdefault",
): string {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (autoplay) {
    params.set("autoplay", "1");
    params.set("mute", "0");
  }
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
