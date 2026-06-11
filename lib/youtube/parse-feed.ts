import type { YoutubeFeedVideo } from "@/lib/youtube/types";

function readTag(block: string, tag: string): string | null {
  const local = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  if (local?.[1]) return local[1].trim();

  const namespaced = block.match(new RegExp(`<yt:${tag}>([\\s\\S]*?)</yt:${tag}>`));
  return namespaced?.[1]?.trim() ?? null;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

/** Parsea el feed Atom RSS de subidas de un canal de YouTube. */
export function parseYoutubeChannelFeed(xml: string, limit = 15): YoutubeFeedVideo[] {
  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  const videos: YoutubeFeedVideo[] = [];

  for (const entry of entries) {
    const block = entry[1] ?? "";
    const videoId = readTag(block, "videoId");
    const title = readTag(block, "title");
    const publishedAt = readTag(block, "published");
    if (!videoId || !title || !publishedAt) continue;

    videos.push({
      videoId,
      title: decodeXmlEntities(title),
      publishedAt,
    });
    if (videos.length >= limit) break;
  }

  return videos;
}
