/**
 * MVP oficial desde crónicas FIFA.com (CXM API / Contentful).
 * Fuente editorial primaria: bloque "Michelob Ultra Superior Player of the Match"
 * en el match report publicado tras el partido.
 */

import { buildFifaMatchReportArticlePathCandidates } from "@/lib/live/sources/fifa-match-report-slugs";
import { titleCasePlayerName } from "@/lib/worldcup2026/fifa-squads";
import { openFootballTeamName } from "@/lib/worldcup2026/squad-team-names";

export const FIFA_MATCH_REPORT_SOURCE_CODE = "fifa_match_report" as const;

const FIFA_CXM_API_BASE = "https://cxm-api.fifa.com/fifaplusweb/api";

const SUPERIOR_POTM_LABEL = /superior player of the match|michelob ultra superior player/i;

export type OfficialMvpFromFifaMatchReport = {
  playerName: string;
  teamName: string;
  sourceCode: typeof FIFA_MATCH_REPORT_SOURCE_CODE;
  sourceExternalKey: string;
  signal: "match_report_article";
};

type ContentfulTextNode = {
  nodeType?: string;
  value?: string;
  content?: ContentfulTextNode[];
};

type ContentfulBlock = {
  nodeType?: string;
  content?: ContentfulTextNode[];
};

type FifaPageTag = {
  sourceCategory?: string;
  id?: string;
};

type FifaArticlePage = {
  relativeUrl?: string;
  tags?: FifaPageTag[];
  sections?: Array<{ entryType?: string; entryId?: string }>;
};

type FifaArticleSection = {
  richtext?: ContentfulBlock;
};

function normalizePlayerName(raw: string): string {
  return titleCasePlayerName(raw.trim());
}

function collectText(node: ContentfulTextNode | undefined): string {
  if (!node) return "";
  if (node.nodeType === "text" && typeof node.value === "string") {
    return node.value;
  }
  return (node.content ?? []).map(collectText).join("");
}

function parsePlayerTeamLine(line: string): { playerName: string; teamName: string } | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  if (!trimmed) return null;

  const withTeam = trimmed.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (withTeam) {
    return {
      playerName: normalizePlayerName(withTeam[1]),
      teamName: openFootballTeamName(withTeam[2]),
    };
  }

  return null;
}

/** Extrae MVP del rich text Contentful de la crónica oficial. */
export function parseOfficialMvpFromFifaMatchReportRichtext(
  richtext: ContentfulBlock | null | undefined,
): { playerName: string; teamName: string } | null {
  const blocks = richtext?.content ?? [];
  for (let i = 0; i < blocks.length; i += 1) {
    const block = blocks[i];
    const headingText = collectText(block as ContentfulTextNode);
    if (!SUPERIOR_POTM_LABEL.test(headingText)) continue;

    for (let j = i + 1; j < blocks.length; j += 1) {
      const next = blocks[j];
      if (next.nodeType !== "paragraph") continue;

      const line = collectText(next as ContentfulTextNode);
      const parsed = parsePlayerTeamLine(line);
      if (parsed?.playerName && parsed.teamName) return parsed;
      break;
    }
  }

  return null;
}

function extractArticleEntryId(page: FifaArticlePage): string | null {
  const article = page.sections?.find((section) => section.entryType === "article");
  return article?.entryId?.trim() ?? null;
}

function pageMatchesFifaId(page: FifaArticlePage, idMatch: string | undefined): boolean {
  if (!idMatch) return true;
  return (page.tags ?? []).some(
    (tag) => tag.sourceCategory === "Match" && tag.id === idMatch,
  );
}

async function cxmFetch<T>(path: string): Promise<T | null> {
  const response = await fetch(`${FIFA_CXM_API_BASE}${path}`, {
    headers: {
      accept: "application/json",
      "user-agent": "TrincadoresMundialistas/1.0",
    },
    signal: AbortSignal.timeout(20_000),
    cache: "no-store",
  });

  if (response.status === 404) return null;
  if (!response.ok) {
    throw new Error(`FIFA CXM ${path}: HTTP ${response.status}`);
  }

  return (await response.json()) as T;
}

async function fetchOfficialMvpFromFifaMatchReportPage(
  articlePath: string,
  idMatch: string | undefined,
): Promise<OfficialMvpFromFifaMatchReport | null> {
  const page = await cxmFetch<FifaArticlePage>(`/pages${articlePath}`);
  if (!page || !pageMatchesFifaId(page, idMatch)) return null;

  const entryId = extractArticleEntryId(page);
  if (!entryId) return null;

  const section = await cxmFetch<FifaArticleSection>(`/sections/article/${entryId}?locale=en`);
  const parsed = parseOfficialMvpFromFifaMatchReportRichtext(section?.richtext);
  if (!parsed) return null;

  return {
    playerName: parsed.playerName,
    teamName: parsed.teamName,
    sourceCode: FIFA_MATCH_REPORT_SOURCE_CODE,
    sourceExternalKey: page.relativeUrl ?? articlePath,
    signal: "match_report_article",
  };
}

export async function fetchOfficialMvpFromFifaMatchReport(
  homeTeam: string,
  awayTeam: string,
  options?: { idMatch?: string },
): Promise<OfficialMvpFromFifaMatchReport | null> {
  const candidates = buildFifaMatchReportArticlePathCandidates(homeTeam, awayTeam);

  for (const articlePath of candidates) {
    const result = await fetchOfficialMvpFromFifaMatchReportPage(articlePath, options?.idMatch);
    if (result) return result;
  }

  return null;
}
