import Image from "next/image";
import { KnockoutBracket } from "@/components/predictions/KnockoutBracket";
import { getPoolKnockoutMatchesWithPredictions } from "@/lib/predictions/queries";
import { requireActivePoolContext } from "@/lib/pool/require-context";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function KnockoutPredictionsPage() {
  const ctx = await requireActivePoolContext();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matches = await getPoolKnockoutMatchesWithPredictions(ctx.activePoolId, user!.id);

  return (
    <div className="tm-porra-page flex min-h-0 flex-1 flex-col">
      <div className="flex w-full shrink-0 justify-center px-4 pt-2">
        <Image
          src="/icons/PERRETE.png"
          alt=""
          width={455}
          height={351}
          priority
          className="h-auto max-h-16 w-auto object-contain sm:max-h-20"
        />
      </div>
      <KnockoutBracket poolId={ctx.activePoolId} matches={matches} />
    </div>
  );
}
