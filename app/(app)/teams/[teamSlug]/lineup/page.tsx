import { ProbableXI } from "@/components/lineup/ProbableXI";
import { isFormationId } from "@/lib/lineup/formation-coordinates";
import { resolveTeamLineup } from "@/lib/lineup/resolve-lineup";
import { squadTeamNameFromSlug } from "@/lib/lineup/squad-name";
import type { FormationId } from "@/lib/lineup/types";
import { CURRENT_WORLD_CUP_YEAR, getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function TeamLineupPage({
  params,
  searchParams,
}: {
  params: Promise<{ teamSlug: string }>;
  searchParams: Promise<{ year?: string; formation?: string }>;
}) {
  const { teamSlug } = await params;
  const query = await searchParams;
  const teamName = squadTeamNameFromSlug(teamSlug);
  const parsedYear = query.year ? Number(query.year) : CURRENT_WORLD_CUP_YEAR;
  const year = Number.isInteger(parsedYear) ? parsedYear : CURRENT_WORLD_CUP_YEAR;
  const formation = isFormationId(query.formation ?? "") ? (query.formation as FormationId) : undefined;

  const supabase = await createClient();
  const squad = await getTeamSquadByName(supabase, teamName, { year });
  const lineup =
    squad && squad.players.length > 0
      ? await resolveTeamLineup(supabase, {
          teamName,
          players: squad.players,
          formationOverride: formation,
        })
      : null;

  return (
    <ProbableXI
      squad={squad}
      teamName={teamName}
      teamSlug={teamSlug}
      lineup={lineup}
      year={year}
      formation={formation}
      backHref="/predictions"
    />
  );
}
