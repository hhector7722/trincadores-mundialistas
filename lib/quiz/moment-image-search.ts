import type { WorldCupMoment } from "@/lib/quiz/world-cup-moments";

const USER_AGENT = "TrincadoresMundialistas/1.0 (moment image discover; private pool)";

const BLOCKED_KEYWORDS = [
  "fan",
  "fans",
  "supporter",
  "supporters",
  "aficion",
  "tribune",
  "tribuna",
  "stadium",
  "estadio",
  "estadio",
  "crowd",
  "grada",
  "logo",
  "wordmark",
  "kit",
  "jersey",
  "camiseta",
  "map",
  "qualification",
  "wallpaper",
  "black and white",
  "black-and-white",
  "bnw",
  "monochrome",
  "plaque",
  "placa",
  "trophy only",
  "ball only",
  "balon",
];

const PREFERRED_DOMAINS = [
  "marca.com",
  "as.com",
  "sport.es",
  "fifa.com",
  "uefa.com",
  "goal.com",
  "reuters.com",
  "gettyimages.com",
  "efe.com",
  "eurosport.com",
  "mundodeportivo.com",
  "soccer.ru",
  "upload.wikimedia.org",
];

export type ImageSearchCandidate = {
  imageUrl: string;
  pageUrl: string | null;
  title: string;
  width: number | null;
  height: number | null;
  source: "duckduckgo" | "commons" | "google_cse";
  query: string;
  score: number;
};

type DuckDuckGoImageResult = {
  image?: string;
  thumbnail?: string;
  title?: string;
  url?: string;
  width?: number;
  height?: number;
};

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase();
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const query of queries) {
    const trimmed = query.trim().replace(/\s+/g, " ");
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    out.push(trimmed);
  }
  return out;
}

export function buildMomentSearchQueries(moment: WorldCupMoment): string[] {
  const player = moment.players[0] ?? "";
  const opponent = moment.teams.find((team) => team !== moment.teams[0]) ?? moment.teams[1] ?? "";
  const year = String(moment.year);

  const base = uniqueQueries([
    moment.search_hint ?? "",
    `${player} FIFA World Cup ${year} ${moment.competition} photo player action`,
    `${player} Mundial ${year} foto jugador partido`,
    `${moment.teams[0]} ${opponent} World Cup ${year} ${moment.competition} match photo players`,
    `${moment.label} World Cup ${year} football player photo`,
  ]);

  return base;
}

function hostFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function isLikelyImageUrl(url: string): boolean {
  if (!url.startsWith("https://")) return false;
  const lower = url.toLowerCase();
  if (lower.endsWith(".svg") || lower.endsWith(".gif") || lower.endsWith(".pdf")) return false;
  return (
    /\.(jpe?g|png|webp)(\?|$)/i.test(lower) ||
    lower.includes("upload.wikimedia.org") ||
    lower.includes("/image/") ||
    lower.includes("/photo/")
  );
}

export function scoreImageCandidate(
  candidate: Omit<ImageSearchCandidate, "score">,
  moment: WorldCupMoment
): number {
  const haystack = normalizeText(
    [candidate.title, candidate.imageUrl, candidate.pageUrl ?? "", candidate.query].join(" ")
  );
  let score = 0;

  if (!isLikelyImageUrl(candidate.imageUrl)) return -100;

  for (const keyword of BLOCKED_KEYWORDS) {
    if (haystack.includes(normalizeText(keyword))) score -= 12;
  }

  for (const player of moment.players) {
    const parts = normalizeText(player).split(/\s+/).filter(Boolean);
    if (parts.some((part) => part.length > 3 && haystack.includes(part))) score += 18;
  }

  if (haystack.includes(String(moment.year))) score += 10;
  if (haystack.includes("world cup") || haystack.includes("mundial") || haystack.includes("fifa")) {
    score += 8;
  }
  if (haystack.includes("player") || haystack.includes("jugador") || haystack.includes("goal")) {
    score += 4;
  }

  const host = hostFromUrl(candidate.pageUrl ?? candidate.imageUrl);
  const domainIndex = PREFERRED_DOMAINS.findIndex((domain) => host.endsWith(domain));
  if (domainIndex >= 0) score += 14 - Math.min(domainIndex, 8);

  if (candidate.width && candidate.height) {
    const minSide = Math.min(candidate.width, candidate.height);
    if (minSide >= 500) score += 8;
    if (minSide >= 900) score += 4;
    if (candidate.width < candidate.height * 0.5) score -= 4;
  }

  if (candidate.source === "commons") score -= 2;

  return score;
}

async function fetchDuckDuckGoVqd(query: string): Promise<string> {
  const response = await fetch(`https://duckduckgo.com/?q=${encodeURIComponent(query)}`, {
    headers: { "User-Agent": USER_AGENT, Accept: "text/html" },
  });
  if (!response.ok) {
    throw new Error(`DuckDuckGo HTML ${response.status}`);
  }
  const html = await response.text();
  const patterns = [/vqd=["']?([\d-]+)/i, /vqd%3D([\d-]+)/i];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return match[1];
  }
  throw new Error("No se pudo extraer VQD de DuckDuckGo");
}

export async function searchDuckDuckGoImages(
  query: string,
  limit = 20
): Promise<ImageSearchCandidate[]> {
  const vqd = await fetchDuckDuckGoVqd(query);
  const params = new URLSearchParams({
    l: "es-es",
    o: "json",
    q: query,
    vqd,
    f: ",,,",
    p: "1",
  });

  const response = await fetch(`https://duckduckgo.com/i.js?${params.toString()}`, {
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      Referer: "https://duckduckgo.com/",
    },
  });

  if (!response.ok) {
    throw new Error(`DuckDuckGo i.js ${response.status}`);
  }

  const payload = (await response.json()) as { results?: DuckDuckGoImageResult[] };
  const results = payload.results ?? [];

  return results
    .filter((item) => typeof item.image === "string" && item.image.startsWith("https://"))
    .slice(0, limit)
    .map((item) => ({
      imageUrl: item.image as string,
      pageUrl: typeof item.url === "string" ? item.url : null,
      title: typeof item.title === "string" ? item.title : query,
      width: typeof item.width === "number" ? item.width : null,
      height: typeof item.height === "number" ? item.height : null,
      source: "duckduckgo" as const,
      query,
      score: 0,
    }));
}

type CommonsSearchResponse = {
  query?: {
    pages?: Record<
      string,
      {
        title?: string;
        imageinfo?: Array<{
          url?: string;
          width?: number;
          height?: number;
          extmetadata?: { ImageDescription?: { value?: string } };
        }>;
      }
    >;
  };
};

export async function searchCommonsImages(
  query: string,
  limit = 12
): Promise<ImageSearchCandidate[]> {
  const params = new URLSearchParams({
    action: "query",
    format: "json",
    origin: "*",
    generator: "search",
    gsrsearch: `filetype:bitmap ${query}`,
    gsrnamespace: "6",
    gsrlimit: String(limit),
    prop: "imageinfo",
    iiprop: "url|size|extmetadata",
    iiurlwidth: "1200",
  });

  const response = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Commons API ${response.status}`);
  }

  const payload = (await response.json()) as CommonsSearchResponse;
  const pages = payload.query?.pages ?? {};

  return Object.values(pages).flatMap((page) => {
      const info = page.imageinfo?.[0];
      const imageUrl = info?.url;
      if (!info || !imageUrl?.startsWith("https://")) return [];
      const title = page.title?.replace(/^File:/, "") ?? query;
      const description = info?.extmetadata?.ImageDescription?.value ?? title;
      return [
        {
          imageUrl,
          pageUrl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title ?? "")}`,
          title: description.replace(/<[^>]+>/g, " ").trim(),
          width: typeof info.width === "number" ? info.width : null,
          height: typeof info.height === "number" ? info.height : null,
          source: "commons" as const,
          query,
          score: 0,
        },
      ];
    });
}

async function searchGoogleCseImages(
  query: string,
  limit: number
): Promise<ImageSearchCandidate[]> {
  const apiKey = process.env.GOOGLE_CSE_API_KEY?.trim();
  const cx = process.env.GOOGLE_CSE_CX?.trim();
  if (!apiKey || !cx) return [];

  const params = new URLSearchParams({
    key: apiKey,
    cx,
    q: query,
    searchType: "image",
    num: String(Math.min(limit, 10)),
    safe: "active",
  });

  const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Google CSE ${response.status}`);
  }

  const payload = (await response.json()) as {
    items?: Array<{
      title?: string;
      link?: string;
      image?: { contextLink?: string; width?: number; height?: number };
    }>;
  };

  return (payload.items ?? [])
    .filter((item) => typeof item.link === "string" && item.link.startsWith("https://"))
    .map((item) => ({
      imageUrl: item.link as string,
      pageUrl: item.image?.contextLink ?? null,
      title: item.title ?? query,
      width: item.image?.width ?? null,
      height: item.image?.height ?? null,
      source: "google_cse" as const,
      query,
      score: 0,
    }));
}

export async function discoverMomentImageCandidates(
  moment: WorldCupMoment,
  opts?: { maxCandidates?: number }
): Promise<ImageSearchCandidate[]> {
  const maxCandidates = opts?.maxCandidates ?? 24;
  const queries = buildMomentSearchQueries(moment);
  const buckets: ImageSearchCandidate[] = [];

  for (const query of queries.slice(0, 3)) {
    try {
      buckets.push(...(await searchDuckDuckGoImages(query, 12)));
    } catch {
      // Siguiente query
    }
    await delay(800);
  }

  for (const query of queries.slice(0, 2)) {
    try {
      buckets.push(...(await searchCommonsImages(query, 8)));
    } catch {
      // Fallback opcional
    }
    await delay(500);
  }

  if (process.env.GOOGLE_CSE_API_KEY && process.env.GOOGLE_CSE_CX) {
    for (const query of queries.slice(0, 2)) {
      try {
        buckets.push(...(await searchGoogleCseImages(query, 8)));
      } catch {
        // Opcional
      }
      await delay(400);
    }
  }

  const deduped = dedupeCandidates(buckets);
  const scored = deduped
    .map((candidate) => ({
      ...candidate,
      score: scoreImageCandidate(candidate, moment),
    }))
    .filter((candidate) => candidate.score >= 8)
    .sort((a, b) => b.score - a.score);

  return scored.slice(0, maxCandidates);
}

export async function discoverBestMomentImage(
  moment: WorldCupMoment
): Promise<ImageSearchCandidate | null> {
  const candidates = await discoverMomentImageCandidates(moment, { maxCandidates: 12 });
  return candidates[0] ?? null;
}

function dedupeCandidates(candidates: ImageSearchCandidate[]): ImageSearchCandidate[] {
  const seen = new Set<string>();
  const out: ImageSearchCandidate[] = [];
  for (const candidate of candidates) {
    const key = candidate.imageUrl.split("?")[0] ?? candidate.imageUrl;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate);
  }
  return out;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function formatDiscoverSourceLabel(candidate: ImageSearchCandidate): string {
  const host = hostFromUrl(candidate.pageUrl ?? candidate.imageUrl) || candidate.source;
  return `auto/${host}`;
}
