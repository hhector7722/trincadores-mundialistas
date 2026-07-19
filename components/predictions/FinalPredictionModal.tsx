"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { deleteMvpPrediction, saveMvpPrediction } from "@/actions/mvp-predictions";
import { savePrediction } from "@/actions/predictions";
import {
  buildMvpView,
  buildPossibleLineupsView,
  EntityModalController,
} from "@/components/lineup/EntityModalController";
import type { EntityModalView } from "@/components/lineup/entity-modal-types";
import { Modal } from "@/components/ui/modal";
import { hasFilledPredictionScore, resolvePredictionUiState } from "@/lib/predictions/edit-state";
import {
  mergeMvpIntoMatch,
  mvpDraftDirty,
  mvpPlayerNameFromMatch,
  mvpSnapshotFromMatch,
  type MvpSnapshot,
} from "@/lib/predictions/mvp-match-state";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { MAX_GOALS } from "@/lib/predictions/validation";
import { shirtPlayerName } from "@/lib/lineup/short-player-name";
import { matchFixtureLabel } from "@/lib/usage/modal-labels";
import { cn } from "@/lib/utils";

type FinalPredictionModalProps = {
  open: boolean;
  onClose: () => void;
  poolId: string;
  match: MatchWithPrediction;
};

/**
 * Coordenadas % dentro del frame aspect-[512/1024] (ratio real de modal-v4.webp).
 * MVP: top ~50.88%, height ~2.83%, width ~26.4%, centrado.
 * "Posibles alineaciones" justo debajo; línea decorativa ~57.7%.
 */
const MODAL_MVP_BTN =
  "absolute left-1/2 top-[50.88%] z-20 flex h-[2.83%] min-h-[1.35rem] w-[26.4%] min-w-[7.5rem] -translate-x-1/2 items-center justify-center rounded-full bg-[#D4FF00] px-2 text-[clamp(0.55rem,2.1vw,0.7rem)] font-extrabold uppercase tracking-[0.02em] text-black disabled:opacity-50";
const MODAL_LINEUPS_HIT =
  "left-1/2 top-[54.2%] h-[3.2%] w-[72%] -translate-x-1/2";
/** Zona negra interactiva justo debajo de la línea decorativa. */
const MODAL_PLAYERS_TOP = "top-[58.5%]";

function HitTarget({
  className,
  label,
  disabled,
  onClick,
}: {
  className?: string;
  label: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn("absolute z-20 bg-transparent disabled:pointer-events-none", className)}
    />
  );
}

function GoalStepper({
  label,
  value,
  disabled,
  onChange,
}: {
  label: string;
  value: number | null;
  disabled?: boolean;
  onChange: (next: number | null) => void;
}) {
  const isUnset = value === null;
  return (
    <div className="flex items-center justify-center gap-5">
      <button
        type="button"
        disabled={disabled || isUnset || value <= 0}
        aria-label={`Menos goles ${label}`}
        onClick={() => {
          if (value === null) return;
          onChange(value === 0 ? null : value - 1);
        }}
        className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#b24444] text-white disabled:opacity-40"
      >
        <Minus className="h-2.5 w-2.5 stroke-[2.75]" aria-hidden />
      </button>
      <button
        type="button"
        disabled={disabled || (!isUnset && value >= MAX_GOALS)}
        aria-label={`Mas goles ${label}`}
        onClick={() => onChange(isUnset ? 0 : Math.min(MAX_GOALS, value! + 1))}
        className="flex h-5 w-5 items-center justify-center rounded-[4px] bg-[#3e8a52] text-white disabled:opacity-40"
      >
        <Plus className="h-2.5 w-2.5 stroke-[2.75]" aria-hidden />
      </button>
    </div>
  );
}

function FinalScoreline({
  home,
  away,
}: {
  home: number | null;
  away: number | null;
}) {
  if (home === null && away === null) return null;

  return (
    <p className="pointer-events-none absolute left-1/2 top-[42%] z-[6] flex -translate-x-1/2 items-center font-display text-[2rem] font-bold tabular-nums leading-none text-white">
      <span className="inline-block min-w-[1.15ch] text-center">
        {home === null ? "" : home}
      </span>
      <span className="mx-1.5 text-white" aria-hidden>
        -
      </span>
      <span className="inline-block min-w-[1.15ch] text-center">
        {away === null ? "" : away}
      </span>
    </p>
  );
}

export function FinalPredictionModal({
  open,
  onClose,
  poolId,
  match,
}: FinalPredictionModalProps) {
  const router = useRouter();
  const [mvpOverride, setMvpOverride] = useState<MvpSnapshot | null>(null);
  const [entityModal, setEntityModal] = useState<{
    open: boolean;
    view: EntityModalView;
  }>({ open: false, view: buildMvpView(poolId, match) });
  const [hadScoreOnOpen, setHadScoreOnOpen] = useState(false);

  const viewMatch = useMemo(
    () => mergeMvpIntoMatch(match, mvpOverride),
    [match, mvpOverride]
  );

  const savedHome = viewMatch.prediction?.home_goals ?? null;
  const savedAway = viewMatch.prediction?.away_goals ?? null;
  const savedAdvancingTeam =
    (viewMatch.prediction?.advancing_team as "home" | "away" | null) ?? null;

  const [home, setHome] = useState<number | null>(savedHome);
  const [away, setAway] = useState<number | null>(savedAway);
  const [advancingTeam, setAdvancingTeam] = useState<"home" | "away" | null>(
    savedAdvancingTeam
  );
  const [error, setError] = useState<string | null>(null);
  const [mvpRequiredOpen, setMvpRequiredOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    setHome(savedHome);
    setAway(savedAway);
    setAdvancingTeam(savedAdvancingTeam);
    setError(null);
    setMvpRequiredOpen(false);
    setMvpOverride(null);
    setHadScoreOnOpen(hasFilledPredictionScore(savedHome, savedAway));
  }, [open, match.id, savedHome, savedAway, savedAdvancingTeam]);

  const draftDirty =
    home !== savedHome || away !== savedAway || advancingTeam !== savedAdvancingTeam;
  const mvpDirty = mvpDraftDirty(match, mvpOverride);
  const scoreFilled =
    hasFilledPredictionScore(savedHome, savedAway) ||
    hasFilledPredictionScore(home, away);
  const mvpFilled = Boolean(mvpPlayerNameFromMatch(viewMatch)?.trim());
  const bothFilled = scoreFilled && mvpFilled;
  const partialFill = (scoreFilled && !mvpFilled) || (mvpFilled && !scoreFilled);

  const uiState = useMemo(
    () =>
      resolvePredictionUiState({
        savedHome,
        savedAway,
        draftHome: home,
        draftAway: away,
        draftDirty,
        matchStatus: viewMatch.status,
        serverEditable: viewMatch.serverEditable,
      }),
    [
      savedHome,
      savedAway,
      home,
      away,
      draftDirty,
      viewMatch.status,
      viewMatch.serverEditable,
    ]
  );

  const controlsDisabled = uiState === "locked" || pending;
  const canSave =
    uiState !== "locked" &&
    !pending &&
    (partialFill || (bothFilled && (uiState !== "saved" || draftDirty || mvpDirty)));

  const openEntity = useCallback((view: EntityModalView) => {
    setEntityModal({ open: true, view });
  }, []);

  function onSave() {
    setError(null);

    const draftScoreFilled = hasFilledPredictionScore(home, away);
    const savedScoreFilled = hasFilledPredictionScore(savedHome, savedAway);
    const hasScore = savedScoreFilled || draftScoreFilled;
    const hasMvp = mvpFilled;

    if (hasScore && !hasMvp) {
      setMvpRequiredOpen(true);
      return;
    }
    if (hasMvp && !hasScore) {
      setError("Añade tu pronóstico del partido.");
      return;
    }
    if (!hasScore || !hasMvp) return;
    if (!viewMatch.group_code && hasScore && home === away && !advancingTeam) {
      setError(
        "Al pronosticar empate en eliminatorias, debes elegir qué equipo pasa de ronda."
      );
      return;
    }

    startTransition(async () => {
      const mvpSnap =
        mvpOverride ??
        (viewMatch.mvpPrediction?.player_name?.trim()
          ? mvpSnapshotFromMatch(viewMatch)
          : null);

      const result = await savePrediction(
        poolId,
        viewMatch.id,
        home!,
        away!,
        advancingTeam ?? undefined
      );
      if (!result.ok) {
        setError(result.error);
        return;
      }

      if (mvpSnap) {
        const mvpResult = await saveMvpPrediction(
          poolId,
          viewMatch.id,
          mvpSnap.player_name,
          mvpSnap.team_name,
          mvpSnap.shirt_number
        );
        if (!mvpResult.ok) {
          setError(mvpResult.error);
          return;
        }
      }

      setHome(result.home);
      setAway(result.away);
      onClose();
      router.refresh();
    });
  }

  const handleDismiss = useCallback(() => {
    void (async () => {
      let didMutate = false;
      if (!hadScoreOnOpen && mvpFilled) {
        const result = await deleteMvpPrediction(poolId, match.id);
        if (result.ok) didMutate = true;
      }
      onClose();
      if (didMutate || mvpOverride) {
        router.refresh();
      }
    })();
  }, [hadScoreOnOpen, match.id, mvpFilled, mvpOverride, onClose, poolId, router]);

  const showAdvancing =
    !viewMatch.group_code && home !== null && away !== null && home === away;
  const mvpLabel = mvpPlayerNameFromMatch(viewMatch);
  const mvpButtonLabel = mvpLabel
    ? shirtPlayerName(mvpLabel)
    : "+ AÑADIR MVP";

  return (
    <>
      <Modal
        open={open}
        onClose={handleDismiss}
        title={matchFixtureLabel(viewMatch.home_team, viewMatch.away_team)}
        usageId="final-prediction"
        usageLabel={matchFixtureLabel(viewMatch.home_team, viewMatch.away_team)}
        hideHeader
        ariaLabel={`Pronóstico final ${viewMatch.home_team} vs ${viewMatch.away_team}`}
        hideCloseButton
        scrollContent={false}
        opaque
        className="flex max-h-[calc(100dvh-2rem)] w-full max-w-[min(26rem,94vw)] flex-col overflow-hidden rounded-[1.75rem] border-0 bg-black p-0 shadow-2xl"
        panelHostClassName="w-full max-w-[min(26rem,94vw)]"
      >
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden bg-black">
          {/* Frame 512×1024: cabe en viewport (ancho o alto) y el Modal lo centra */}
          <div className="relative aspect-[512/1024] w-[min(100%,calc((100dvh-2rem)*512/1024))] shrink-0">
            <Image
              src="/images/final/modal-v4.webp"
              alt=""
              fill
              sizes="26rem"
              className="object-cover object-top"
              priority
            />

            {/* Botón MVP real (cubre el del arte) → picker de alineaciones */}
            <button
              type="button"
              disabled={controlsDisabled}
              onClick={() => openEntity(buildMvpView(poolId, viewMatch))}
              aria-label={mvpLabel ? `MVP: ${mvpLabel}` : "Añadir MVP"}
              className={MODAL_MVP_BTN}
            >
              <span className="truncate">{mvpButtonLabel}</span>
            </button>

            <HitTarget
              label="Posibles alineaciones"
              onClick={() => openEntity(buildPossibleLineupsView(viewMatch))}
              className={MODAL_LINEUPS_HIT}
            />

            {/* Zona interactiva debajo de la línea de "posibles alineaciones".
                Jugadores + steppers ocupan todo el espacio salvo el footer de
                Cancelar/Guardar. El selector de empate va en overlay absoluto
                sobre el footer para no comprimir ni escalar spa/arg. */}
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 z-10 flex flex-col bg-black",
                MODAL_PLAYERS_TOP
              )}
            >
              <div className="relative flex min-h-0 flex-1 -translate-y-8 flex-col px-1 pt-1">
                <div className="relative mx-auto flex min-h-0 w-full flex-1 items-end justify-between">
                  <div className="relative flex h-full w-[46%] flex-col">
                    <div className="relative min-h-0 flex-1">
                      <Image
                        src="/club_player/spa.png"
                        alt=""
                        fill
                        sizes="12rem"
                        className="object-contain object-bottom"
                      />
                    </div>
                    <div className="flex shrink-0 justify-center pb-1 pt-3">
                      <GoalStepper
                        label={viewMatch.home_team}
                        value={home}
                        disabled={controlsDisabled}
                        onChange={setHome}
                      />
                    </div>
                  </div>

                  <FinalScoreline home={home} away={away} />

                  <div className="relative flex h-full w-[46%] flex-col">
                    <div className="relative min-h-0 flex-1">
                      <Image
                        src="/club_player/arg.png"
                        alt=""
                        fill
                        sizes="12rem"
                        className="object-contain object-bottom"
                      />
                    </div>
                    <div className="flex shrink-0 justify-center pb-1 pt-3">
                      <GoalStepper
                        label={viewMatch.away_team}
                        value={away}
                        disabled={controlsDisabled}
                        onChange={setAway}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative flex shrink-0 flex-col items-center gap-2 px-5 pb-5 pt-1">
                {showAdvancing ? (
                  <div className="absolute bottom-full left-1/2 z-20 -mb-1 w-full max-w-[16rem] -translate-x-1/2 translate-y-2 rounded-xl bg-black/90 px-2 py-2">
                    <div className="flex gap-1" role="group" aria-label="Equipo que pasa de ronda">
                      <button
                        type="button"
                        onClick={() => setAdvancingTeam("home")}
                        className={cn(
                          "flex-1 truncate rounded-full px-2 py-1 text-[10px] font-semibold",
                          advancingTeam === "home"
                            ? "bg-[#D4FF00] text-black"
                            : "bg-white/10 text-white/80"
                        )}
                      >
                        {viewMatch.home_team}
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdvancingTeam("away")}
                        className={cn(
                          "flex-1 truncate rounded-full px-2 py-1 text-[10px] font-semibold",
                          advancingTeam === "away"
                            ? "bg-[#D4FF00] text-black"
                            : "bg-white/10 text-white/80"
                        )}
                      >
                        {viewMatch.away_team}
                      </button>
                    </div>
                  </div>
                ) : null}

                {error ? (
                  <p className="text-center text-[11px] text-[var(--tm-danger)]" role="alert">
                    {error}
                  </p>
                ) : null}

                <div className="mt-0.5 flex w-full items-center justify-center gap-8">
                  <button
                    type="button"
                    disabled={pending}
                    onClick={handleDismiss}
                    className="min-h-11 px-4 text-sm font-semibold text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    disabled={!canSave || pending}
                    onClick={onSave}
                    className="inline-flex min-h-11 items-center justify-center px-4 text-sm font-extrabold text-[#D4FF00] disabled:opacity-40"
                  >
                    {pending ? "Guardando..." : "Guardar"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={mvpRequiredOpen}
        onClose={() => setMvpRequiredOpen(false)}
        title="Falta el MVP"
        usageId="final-mvp-required"
        usageLabel="Falta el MVP"
        stackElevated
        opaque
        className="max-w-[min(20rem,90vw)] rounded-2xl border-0 bg-[var(--tm-bg-elevated)] p-0"
        panelHostClassName="w-full max-w-[min(20rem,90vw)]"
      >
        <div className="flex flex-col gap-4 px-5 pb-5 pt-1">
          <p className="text-center text-sm leading-relaxed text-[var(--tm-fg)]">
            Añade quien crees que será el mvp del partido.
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => {
                setMvpRequiredOpen(false);
                openEntity(buildMvpView(poolId, viewMatch));
              }}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#D4FF00] px-5 text-sm font-extrabold text-black"
            >
              Añadir MVP
            </button>
            <button
              type="button"
              onClick={() => setMvpRequiredOpen(false)}
              className="inline-flex min-h-11 items-center justify-center text-sm font-semibold text-white/80"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>

      <EntityModalController
        open={entityModal.open}
        onClose={() => setEntityModal((current) => ({ ...current, open: false }))}
        initialView={entityModal.view}
        carouselTeams={[viewMatch.home_team, viewMatch.away_team]}
        stackElevated
        opaque
        onMvpSaved={(playerName, teamName, shirtNumber) => {
          setMvpOverride({
            player_name: playerName,
            team_name: teamName,
            shirt_number: shirtNumber ?? null,
          });
          setEntityModal((current) => ({ ...current, open: false }));
        }}
      />
    </>
  );
}
