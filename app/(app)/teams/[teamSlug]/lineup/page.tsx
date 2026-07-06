import { isFormationId } from "@/lib/lineup/formation-coordinates";
import { squadTeamNameFromSlug } from "@/lib/lineup/squad-name";
import type { FormationId } from "@/lib/lineup/types";
import { CURRENT_WORLD_CUP_YEAR } from "@/lib/worldcup-data/squad-queries";
import { AsyncTeamLineup } from "@/components/lineup/AsyncTeamLineup";

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

  return (
    <AsyncTeamLineup
      teamName={teamName}
      teamSlug={teamSlug}
      year={year}
      formation={formation}
    />
  );
}
