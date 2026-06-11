/** Canal oficial FIFA en YouTube (@fifa). */
export const FIFA_YOUTUBE_CHANNEL_ID = "UCpcTrCXblq78GZrTUTPWehg";

export function fifaChannelRssUrl(channelId = FIFA_YOUTUBE_CHANNEL_ID): string {
  return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
}

export function youtubeThumbnailUrl(videoId: string): string {
  return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
}

export function youtubeEmbedUrl(videoId: string, autoplay = false): string {
  const params = new URLSearchParams({
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
  });
  if (autoplay) params.set("autoplay", "1");
  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}
