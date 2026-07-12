import { FOTMOB_SOURCE_CODE } from "@/lib/live/sources/fotmob-official-mvp";
import { parseFotmobScoringOutcome } from "@/lib/live/sources/fotmob-regulation-score";
import type { MatchLivePayload, MatchLiveStats, MatchSubstitution, MatchPlayerIncident } from "@/lib/live/types";

export const FOTMOB_API_BASE = "https://www.fotmob.com/api";

type FotMobLiveMatchDetails = {
  header?: {
    status?: {
      utcTime?: string;
      finished?: boolean;
      started?: boolean;
      cancelled?: boolean;
      ongoing?: boolean;
      scoreStr?: string;
      liveTime?: {
        short?: string;
      };
      reason?: {
        short?: string;
      };
    };
  };
  content?: {
    stats?: {
      Periods?: {
        All?: {
          stats?: Array<{
            stats?: Array<{
              title?: string;
              key?: string;
              stats?: any[];
              type?: string;
            }>;
          }>;
        };
      };
    };
    matchFacts?: {
      events?: {
        events?: Array<{
          type?: string;
          time?: number;
          isHome?: boolean;
          player?: { name?: string };
          swap?: Array<{ name?: string }>;
          card?: string;
        }>;
      };
    };
  };
};

export async function fetchFotmobMatchDetailsRaw(matchId: number): Promise<FotMobLiveMatchDetails | null> {
  try {
    const res = await fetch(`${FOTMOB_API_BASE}/data/matchDetails?matchId=${matchId}`, {
      headers: { "user-agent": "TrincadoresMundialistas/1.0" },
      next: { revalidate: 0 },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

function parseFotmobStats(details: FotMobLiveMatchDetails): MatchLiveStats | null {
  const statsGroups = details.content?.stats?.Periods?.All?.stats;
  if (!statsGroups || statsGroups.length === 0) return null;

  const allStats = statsGroups.flatMap((g) => g.stats || []);
  if (allStats.length === 0) return null;

  const findStat = (key: string, isHome: boolean): number | null => {
    const item = allStats.find((s) => s.key === key);
    if (!item || !item.stats || item.stats.length < 2) return null;
    // item.stats[0] is home, item.stats[1] is away
    let val = item.stats[isHome ? 0 : 1];
    if (typeof val === "string") {
      val = val.replace(/[^0-9.]/g, ""); // strip "%" or other chars if any
      const n = Number(val);
      return Number.isNaN(n) ? null : n;
    }
    if (typeof val === "number") return val;
    return null;
  };

  return {
    possessionHome: findStat("BallPossesion", true),
    possessionAway: findStat("BallPossesion", false),
    shotsHome: findStat("total_shots", true),
    shotsAway: findStat("total_shots", false),
    shotsOnTargetHome: findStat("ShotsOnTarget", true),
    shotsOnTargetAway: findStat("ShotsOnTarget", false),
    xgHome: findStat("expected_goals", true),
    xgAway: findStat("expected_goals", false),
    yellowCardsHome: findStat("yellow_cards", true),
    yellowCardsAway: findStat("yellow_cards", false),
    redCardsHome: findStat("red_cards", true),
    redCardsAway: findStat("red_cards", false),
  };
}

export async function fetchFotmobLiveBundle(matchId: number) {
  const details = await fetchFotmobMatchDetailsRaw(matchId);
  if (!details || !details.header?.status) {
    return null;
  }

  const st = details.header.status;
  const isFinished = !!st.finished;
  const isLive = !!st.ongoing || (!!st.started && !isFinished);
  let timeElapsed = st.liveTime?.short || st.reason?.short || "—";
  
  // Clean strange characters from fotmob time
  timeElapsed = timeElapsed.replace("‎’‎", "'").replace("’", "'").replace(/[^0-9HTF'A-Za-z+-]/g, "");
  if (!timeElapsed.endsWith("'") && timeElapsed.match(/^[0-9]+$/)) {
    timeElapsed = `${timeElapsed}'`;
  }

  let homeScore = 0;
  let awayScore = 0;
  let regulationHomeScore: number | null = null;
  let regulationAwayScore: number | null = null;
  let advancingTeam: "home" | "away" | null = null;
  let penaltyHome: number | null = null;
  let penaltyAway: number | null = null;

  const scoringOutcome = parseFotmobScoringOutcome(details.header);
  if (scoringOutcome) {
    homeScore = scoringOutcome.finalHome;
    awayScore = scoringOutcome.finalAway;
    regulationHomeScore = scoringOutcome.regulationHome;
    regulationAwayScore = scoringOutcome.regulationAway;
    penaltyHome = scoringOutcome.penaltyHome;
    penaltyAway = scoringOutcome.penaltyAway;
    advancingTeam = scoringOutcome.advancingTeam;
  } else if (st.scoreStr) {
    let rawScore = st.scoreStr;
    const penMatch = rawScore.match(/\((.*?)-(.*?)\)/);
    if (penMatch) {
      penaltyHome = parseInt(penMatch[1].trim(), 10);
      penaltyAway = parseInt(penMatch[2].trim(), 10);
      rawScore = rawScore.replace(/\(.*?\)/, "");
    }
    const parts = rawScore.split("-").map(p => parseInt(p.trim(), 10));
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      homeScore = parts[0];
      awayScore = parts[1];
    }
  }

  if (penaltyHome == null && (st.reason as any)?.penalties?.length === 2) {
    penaltyHome = (st.reason as any).penalties[0];
    penaltyAway = (st.reason as any).penalties[1];
  }

  const substitutions: MatchSubstitution[] = [];
  const playerIncidents: MatchPlayerIncident[] = [];

  const rawEvents = details.content?.matchFacts?.events?.events || [];
  for (const e of rawEvents) {
    const teamSide = e.isHome ? "home" : "away";
    
    if (e.type === "Substitution" && e.swap && e.swap.length >= 2) {
      substitutions.push({
        minute: e.time != null ? String(e.time) : "—",
        teamSide,
        playerIn: e.swap[0]?.name || "—",
        playerOut: e.swap[1]?.name || "—",
      });
    } else if (e.type === "Card" && e.player?.name) {
      playerIncidents.push({
        kind: e.card === "Red" ? "red_card" : "yellow_card",
        playerName: e.player.name,
        teamSide,
        minute: e.time,
      });
    } else if (e.type === "Goal" && e.player?.name) {
      playerIncidents.push({
        kind: "goal",
        playerName: e.player.name,
        teamSide,
        minute: e.time,
      });
    }
  }

  const payload: MatchLivePayload = {
    period: isFinished ? "FT" : isLive ? "Live" : "Pre-Match",
    currentMinute: parseInt(timeElapsed) || null,
    stats: parseFotmobStats(details),
    substitutions,
    playerIncidents,
    penaltyHome,
    penaltyAway,
  };

  return {
    sourceCode: FOTMOB_SOURCE_CODE,
    externalKey: String(matchId),
    homeScore,
    awayScore,
    regulationHomeScore,
    regulationAwayScore,
    advancingTeam,
    timeElapsed,
    finished: isFinished,
    isLive,
    payload,
    syncedAt: new Date().toISOString(),
  };
}
