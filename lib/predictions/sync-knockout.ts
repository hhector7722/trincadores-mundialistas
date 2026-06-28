import { createAdminClient } from "@/lib/supabase/admin";
import { resolveThirdPlaceMatchup } from "@/lib/predictions/third-place-matrix";

function getGroupCodeFromPlaceholder(placeholder: string): string | null {
  const match = placeholder.match(/^[12]([A-L])$/i);
  return match ? match[1].toUpperCase() : null;
}

function getPositionFromPlaceholder(placeholder: string): number | null {
  const match = placeholder.match(/^([12])[A-L]$/i);
  return match ? parseInt(match[1], 10) : null;
}

export async function resolveGroupPlaceholder(placeholder: string): Promise<string | null> {
  const groupCode = getGroupCodeFromPlaceholder(placeholder);
  const position = getPositionFromPlaceholder(placeholder);
  if (!groupCode || !position) return null;

  const admin = createAdminClient();

  const { data: matches, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, status")
    .eq("group_code", groupCode);

  if (error || !matches || matches.length === 0) return null;

  // Check if all group matches are finished
  if (matches.some((m) => m.status !== "finished")) {
    return null; // Not finished yet
  }

  const { data: results } = await admin
    .from("match_results")
    .select("match_id, home_goals, away_goals")
    .in("match_id", matches.map((m) => m.id));

  const resultsMap = new Map((results ?? []).map((r) => [r.match_id, r]));

  type TeamStats = {
    name: string;
    points: number;
    goalDiff: number;
    goalsFor: number;
  };

  const stats = new Map<string, TeamStats>();

  const initTeam = (name: string) => {
    if (!stats.has(name)) {
      stats.set(name, { name, points: 0, goalDiff: 0, goalsFor: 0 });
    }
  };

  for (const match of matches) {
    const { home_team, away_team, id } = match;
    initTeam(home_team);
    initTeam(away_team);

    const result = resultsMap.get(id);
    if (!result) continue; // Should not happen if status == 'finished'

    const { home_goals, away_goals } = result;

    const homeStats = stats.get(home_team)!;
    const awayStats = stats.get(away_team)!;

    homeStats.goalsFor += home_goals;
    awayStats.goalsFor += away_goals;
    homeStats.goalDiff += home_goals - away_goals;
    awayStats.goalDiff += away_goals - home_goals;

    if (home_goals > away_goals) {
      homeStats.points += 3;
    } else if (away_goals > home_goals) {
      awayStats.points += 3;
    } else {
      homeStats.points += 1;
      awayStats.points += 1;
    }
  }

  const standings = Array.from(stats.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name); // Simplified head-to-head fallback
  });

  const team = standings[position - 1];
  return team ? team.name : null;
}

export async function resolveBestThirdPlaceholder(placeholder: string): Promise<string | null> {
  if (!/^3[A-L](\/[A-L])+$/.test(placeholder)) return null;

  const admin = createAdminClient();

  // Verificamos si todos los partidos de grupos están terminados
  const { data: incompleteMatches } = await admin
    .from("matches")
    .select("id")
    .not("group_code", "is", null)
    .neq("status", "finished")
    .limit(1);

  if (incompleteMatches && incompleteMatches.length > 0) {
    return null; // Aún hay partidos de grupos sin terminar
  }

  const { data: matches } = await admin
    .from("matches")
    .select("id, home_team, away_team, group_code")
    .not("group_code", "is", null);

  const { data: results } = await admin
    .from("match_results")
    .select("match_id, home_goals, away_goals");
    
  if (!matches || !results) return null;

  const resultsMap = new Map(results.map((r) => [r.match_id, r]));

  type TeamStats = {
    name: string;
    groupCode: string;
    points: number;
    goalDiff: number;
    goalsFor: number;
  };

  const stats = new Map<string, TeamStats>();
  const initTeam = (name: string, groupCode: string) => {
    if (!stats.has(name)) {
      stats.set(name, { name, groupCode, points: 0, goalDiff: 0, goalsFor: 0 });
    }
  };

  for (const match of matches) {
    const { home_team, away_team, id, group_code } = match;
    if (!group_code) continue;
    initTeam(home_team, group_code);
    initTeam(away_team, group_code);

    const result = resultsMap.get(id);
    if (!result) continue;

    const homeStats = stats.get(home_team)!;
    const awayStats = stats.get(away_team)!;

    homeStats.goalsFor += result.home_goals;
    awayStats.goalsFor += result.away_goals;
    homeStats.goalDiff += result.home_goals - result.away_goals;
    awayStats.goalDiff += result.away_goals - result.home_goals;

    if (result.home_goals > result.away_goals) {
      homeStats.points += 3;
    } else if (result.away_goals > result.home_goals) {
      awayStats.points += 3;
    } else {
      homeStats.points += 1;
      awayStats.points += 1;
    }
  }

  const byGroup = new Map<string, TeamStats[]>();
  for (const st of stats.values()) {
    if (!byGroup.has(st.groupCode)) byGroup.set(st.groupCode, []);
    byGroup.get(st.groupCode)!.push(st);
  }

  const thirds: TeamStats[] = [];
  for (const groupTeams of byGroup.values()) {
    groupTeams.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
      if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
      return a.name.localeCompare(b.name);
    });
    if (groupTeams.length >= 3) {
      thirds.push(groupTeams[2]);
    }
  }

  thirds.sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDiff !== a.goalDiff) return b.goalDiff - a.goalDiff;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.name.localeCompare(b.name);
  });

  const top8Thirds = thirds.slice(0, 8);
  const advancingGroups = top8Thirds.map(t => t.groupCode);

  // Mapeamos el placeholder al match_number destino que representa en R32
  const placeholderDestinations: Record<string, number> = {
    "3A/B/C/D/F": 74,
    "3C/D/F/G/H": 77,
    "3C/E/F/H/I": 79,
    "3E/H/I/J/K": 80,
    "3B/E/F/I/J": 81,
    "3A/E/H/I/J": 82,
    "3E/F/G/I/J": 85,
    "3D/E/I/J/L": 87,
  };

  const targetMatchNumber = placeholderDestinations[placeholder];
  if (!targetMatchNumber) return null;

  // Buscamos qué tercero fue asignado a este match_number por la matriz
  for (const third of top8Thirds) {
    const slot = resolveThirdPlaceMatchup(advancingGroups, third.groupCode);
    if (slot === targetMatchNumber) {
      return third.name;
    }
  }

  return null;
}

export async function resolveWinnerPlaceholder(placeholder: string): Promise<string | null> {
  const matchNum = placeholder.match(/^([WL])(\d+)$/i);
  if (!matchNum) return null;

  const isWinner = matchNum[1].toUpperCase() === "W";
  const targetMatchNumber = parseInt(matchNum[2], 10);

  const admin = createAdminClient();

  const { data: targetMatch, error } = await admin
    .from("matches")
    .select("id, home_team, away_team, status")
    .eq("match_number", targetMatchNumber)
    .maybeSingle();

  if (error || !targetMatch || targetMatch.status !== "finished") {
    return null;
  }

  const { data: targetResult } = await admin
    .from("match_results")
    .select("home_goals, away_goals, penalty_home, penalty_away")
    .eq("match_id", targetMatch.id)
    .maybeSingle();

  if (!targetResult) return null;

  const { home_goals, away_goals, penalty_home, penalty_away } = targetResult;

  let homeWins = false;
  if (home_goals > away_goals) {
    homeWins = true;
  } else if (away_goals > home_goals) {
    homeWins = false;
  } else if (penalty_home != null && penalty_away != null) {
    homeWins = penalty_home > penalty_away;
  } else {
    // Should not happen in a knockout match that is 'finished', but just in case
    return null;
  }

  if (isWinner) {
    return homeWins ? targetMatch.home_team : targetMatch.away_team;
  } else {
    // For "L101" (Loser of 101)
    return homeWins ? targetMatch.away_team : targetMatch.home_team;
  }
}

export async function syncKnockoutBracket(): Promise<{ updated: number; skipped: number }> {
  const admin = createAdminClient();

  const { data: matches, error } = await admin
    .from("matches")
    .select("id, match_number, home_team, away_team, status")
    .gte("match_number", 73);

  if (error || !matches) return { updated: 0, skipped: 0 };

  let updatedCount = 0;
  let skippedCount = 0;

  for (const match of matches) {
    const { id, home_team, away_team, match_number } = match;
    let newHome = home_team;
    let newAway = away_team;

    const isPlaceholder = (t: string) => /^[12][A-L]$|^3[A-L]|^[WL]\d+$/.test(t.trim());

    // Evaluate home
    if (isPlaceholder(home_team)) {
      if (/^[12][A-L]$/.test(home_team)) {
        const resolved = await resolveGroupPlaceholder(home_team);
        if (resolved) newHome = resolved;
      } else if (/^3[A-L](\/[A-L])+$/.test(home_team)) {
        const resolved = await resolveBestThirdPlaceholder(home_team);
        if (resolved) newHome = resolved;
      } else if (/^[WL]\d+$/.test(home_team)) {
        const resolved = await resolveWinnerPlaceholder(home_team);
        if (resolved) newHome = resolved;
      }
    }

    // Evaluate away
    if (isPlaceholder(away_team)) {
      if (/^[12][A-L]$/.test(away_team)) {
        const resolved = await resolveGroupPlaceholder(away_team);
        if (resolved) newAway = resolved;
      } else if (/^3[A-L](\/[A-L])+$/.test(away_team)) {
        const resolved = await resolveBestThirdPlaceholder(away_team);
        if (resolved) newAway = resolved;
      } else if (/^[WL]\d+$/.test(away_team)) {
        const resolved = await resolveWinnerPlaceholder(away_team);
        if (resolved) newAway = resolved;
      }
    }

    if (newHome !== home_team || newAway !== away_team) {
      const isNowFullyResolved = !isPlaceholder(newHome) && !isPlaceholder(newAway);
      const updateData: any = { home_team: newHome, away_team: newAway };
      
      if (isNowFullyResolved && match.status === "pending") {
        updateData.status = "scheduled";
      }

      await admin
        .from("matches")
        .update(updateData)
        .eq("id", id);
      updatedCount++;
    } else {
      skippedCount++;
    }
  }

  return { updated: updatedCount, skipped: skippedCount };
}
