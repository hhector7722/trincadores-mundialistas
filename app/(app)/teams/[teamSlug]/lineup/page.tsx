import { ProbableXI } from "@/components/lineup/ProbableXI";
import { squadTeamNameFromSlug } from "@/lib/lineup/squad-name";
import type { FormationId } from "@/lib/lineup/types";
import { getTeamSquadByName } from "@/lib/worldcup-data/squad-queries";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const FORMATIONS = new Set<FormationId>(["4-3-3", "4-4-2"]);

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
  const year = query.year ? Number(query.year) : undefined;
  const formation = FORMATIONS.has(query.formation as FormationId)
    ? (query.formation as FormationId)
    : undefined;

  const supabase = await createClient();
  const squad = await getTeamSquadByName(supabase, teamName, {
    year: Number.isInteger(year) ? year : undefined,
  });

  return (
    <ProbableXI
      squad={squad}
      teamName={teamName}
      year={Number.isInteger(year) ? year : squad?.year}
      formation={formation}
      backHref="/predictions"
    />
  );
}
