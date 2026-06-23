import Link from "next/link";
import { notFound } from "next/navigation";
import { MemberStandingCard } from "@/components/profile/MemberStandingCard";
import { getMemberStanding } from "@/lib/ranking/queries";
import { assertPoolMembership } from "@/lib/pool/active-pool";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ profileId: string }>;
}) {
  const { profileId } = await params;
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isMember = await assertPoolMembership(profileId, ctx.activePoolId);
  if (!isMember) {
    notFound();
  }

  const standing = await getMemberStanding(ctx.activePoolId, profileId);
  if (!standing) {
    notFound();
  }

  const isSelf = user!.id === profileId;

  return (
    <div className="space-y-4 p-4 pb-4">
      <Link href="/ranking" className="text-sm font-medium text-[var(--tm-primary)]">
        Volver al ranking
      </Link>
      <div className="sticky top-0 z-20 -mx-4 -mt-4 bg-[var(--tm-bg)] px-4 pb-2 pt-4 shadow-sm">
        <h1 className="font-display text-lg uppercase tracking-wide text-[var(--tm-fg)]">
          Perfil
        </h1>
      </div>
      <MemberStandingCard standing={standing} isSelf={isSelf} />
    </div>
  );
}