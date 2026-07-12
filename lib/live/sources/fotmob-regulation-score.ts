type FotmobGoalEvent = {
  homeScore?: number;
  awayScore?: number;
  newScore?: number[];
  shotmapEvent?: { period?: string };
};

type FotmobStatus = {
  scoreStr?: string;
  reason?: {
    short?: string;
    shortKey?: string;
  };
};

type FotmobHeader = {
  status?: FotmobStatus;
  teams?: Array<{ score?: number }>;
  events?: {
    homeTeamGoals?: Record<string, FotmobGoalEvent[]>;
    awayTeamGoals?: Record<string, FotmobGoalEvent[]>;
  };
};

function isExtraTimePeriod(period: string | undefined | null): boolean {
  if (!period) return false;
  const normalized = period.toLowerCase();
  return normalized.includes("extra") || normalized.includes("penalt");
}

function isAfterExtraTimeStatus(status: FotmobStatus | undefined): boolean {
  const short = status?.reason?.short?.toUpperCase() ?? "";
  const shortKey = status?.reason?.shortKey?.toLowerCase() ?? "";
  return short === "AET" || shortKey.includes("afterextratime") || shortKey.includes("afterextra");
}

function isPenaltyShootoutStatus(status: FotmobStatus | undefined): boolean {
  const short = status?.reason?.short?.toUpperCase() ?? "";
  const shortKey = status?.reason?.shortKey?.toLowerCase() ?? "";
  return short.includes("PEN") || shortKey.includes("penalt");
}

function collectGoalSnapshots(header: FotmobHeader): Array<{ home: number; away: number; isExtra: boolean }> {
  const snapshots: Array<{ home: number; away: number; isExtra: boolean }> = [];
  const sides = ["homeTeamGoals", "awayTeamGoals"] as const;

  for (const side of sides) {
    const teamGoals = header.events?.[side];
    if (!teamGoals) continue;

    for (const playerGoals of Object.values(teamGoals)) {
      if (!Array.isArray(playerGoals)) continue;
      for (const goal of playerGoals) {
        const home = goal.newScore?.[0] ?? goal.homeScore;
        const away = goal.newScore?.[1] ?? goal.awayScore;
        if (home == null || away == null) continue;
        snapshots.push({
          home,
          away,
          isExtra: isExtraTimePeriod(goal.shotmapEvent?.period),
        });
      }
    }
  }

  return snapshots;
}

function parseScoreString(rawScore: string): { home: number; away: number } | null {
  const parts = rawScore.split("-").map((part) => parseInt(part.trim(), 10));
  if (parts.length !== 2 || Number.isNaN(parts[0]) || Number.isNaN(parts[1])) return null;
  return { home: parts[0], away: parts[1] };
}

export type FotmobScoringOutcome = {
  finalHome: number;
  finalAway: number;
  regulationHome: number;
  regulationAway: number;
  penaltyHome: number | null;
  penaltyAway: number | null;
  advancingTeam: "home" | "away" | null;
};

export function parseFotmobScoringOutcome(header: FotmobHeader | undefined): FotmobScoringOutcome | null {
  const status = header?.status;
  if (!status?.scoreStr) return null;

  let rawScore = status.scoreStr;
  let penaltyHome: number | null = null;
  let penaltyHomeParsed: number | null = null;
  let penaltyAwayParsed: number | null = null;

  const penMatch = rawScore.match(/\((.*?)-(.*?)\)/);
  if (penMatch) {
    const parsedPenHome = parseInt(penMatch[1].trim(), 10);
    const parsedPenAway = parseInt(penMatch[2].trim(), 10);
    if (!Number.isNaN(parsedPenHome) && !Number.isNaN(parsedPenAway)) {
      penaltyHome = parsedPenHome;
      penaltyAwayParsed = parsedPenAway;
    }
    rawScore = rawScore.replace(/\(.*?\)/, "");
  }

  if (penaltyHome == null && (status.reason as { penalties?: number[] } | undefined)?.penalties?.length === 2) {
    const penalties = (status.reason as { penalties: number[] }).penalties;
    penaltyHome = penalties[0];
    penaltyAwayParsed = penalties[1];
  }

  const finalScore = parseScoreString(rawScore);
  if (!finalScore) return null;

  const penaltyAway = penaltyAwayParsed;
  let regulationHome = finalScore.home;
  let regulationAway = finalScore.away;

  const goalSnapshots = collectGoalSnapshots(header ?? {});

  if (isAfterExtraTimeStatus(status)) {
    const extraGoalEvent = findFirstExtraGoalEvent(header);
    if (extraGoalEvent?.homeScore != null && extraGoalEvent?.awayScore != null) {
      regulationHome = extraGoalEvent.homeScore;
      regulationAway = extraGoalEvent.awayScore;
    } else {
      const lastRegulationGoal = [...goalSnapshots].reverse().find((goal) => !goal.isExtra);
      if (lastRegulationGoal) {
        regulationHome = lastRegulationGoal.home;
        regulationAway = lastRegulationGoal.away;
      }
    }
  } else if (isPenaltyShootoutStatus(status) || penaltyHome != null) {
    regulationHome = finalScore.home;
    regulationAway = finalScore.away;
  }

  const advancingTeam = resolveAdvancingTeam(
    regulationHome,
    regulationAway,
    finalScore.home,
    finalScore.away,
    penaltyHome,
    penaltyAway,
  );

  return {
    finalHome: finalScore.home,
    finalAway: finalScore.away,
    regulationHome,
    regulationAway,
    penaltyHome,
    penaltyAway,
    advancingTeam,
  };
}

function findFirstExtraGoalEvent(header: FotmobHeader | undefined): FotmobGoalEvent | null {
  const sides = ["homeTeamGoals", "awayTeamGoals"] as const;
  for (const side of sides) {
    const teamGoals = header?.events?.[side];
    if (!teamGoals) continue;
    for (const playerGoals of Object.values(teamGoals)) {
      if (!Array.isArray(playerGoals)) continue;
      for (const goal of playerGoals) {
        if (isExtraTimePeriod(goal.shotmapEvent?.period)) return goal;
      }
    }
  }
  return null;
}

function resolveAdvancingTeam(
  regulationHome: number,
  regulationAway: number,
  finalHome: number,
  finalAway: number,
  penaltyHome: number | null,
  penaltyAway: number | null,
): "home" | "away" | null {
  if (penaltyHome != null && penaltyAway != null) {
    if (penaltyHome > penaltyAway) return "home";
    if (penaltyHome < penaltyAway) return "away";
  }
  if (finalHome > finalAway) return "home";
  if (finalHome < finalAway) return "away";
  if (regulationHome > regulationAway) return "home";
  if (regulationHome < regulationAway) return "away";
  return null;
}
