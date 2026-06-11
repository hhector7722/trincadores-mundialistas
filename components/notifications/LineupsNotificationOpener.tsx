"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { fetchMatchLineupsModalContextAction } from "@/actions/notifications";
import {
  buildPossibleLineupsView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { LINEUPS_NOTIFICATION_QUERY } from "@/lib/notifications/notification-navigation";

function LineupsNotificationOpenerInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const matchId = searchParams.get(LINEUPS_NOTIFICATION_QUERY);
  const [modal, setModal] = useState<{ open: boolean; view: EntityModalView } | null>(null);

  useEffect(() => {
    if (!matchId) return;

    let cancelled = false;

    void (async () => {
      const result = await fetchMatchLineupsModalContextAction(matchId);
      if (cancelled) return;

      const params = new URLSearchParams(searchParams.toString());
      params.delete(LINEUPS_NOTIFICATION_QUERY);
      const nextQuery = params.toString();
      router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false });

      if (!result.ok) return;

      setModal({
        open: true,
        view: buildPossibleLineupsView(result.data),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [matchId, pathname, router, searchParams]);

  if (!modal?.open) return null;

  return (
    <EntityModalController
      open={modal.open}
      initialView={modal.view}
      onClose={() => setModal(null)}
      opaque
    />
  );
}

export function LineupsNotificationOpener() {
  return (
    <Suspense fallback={null}>
      <LineupsNotificationOpenerInner />
    </Suspense>
  );
}
