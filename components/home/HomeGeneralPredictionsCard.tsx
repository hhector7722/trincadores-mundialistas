"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  saveTournamentChampion,
  saveTournamentFinalists,
  saveTournamentGoldenGlove,
  saveTournamentMvp,
  saveTournamentTopScorer,
} from "@/actions/tournament-general-predictions";
import { GeneralPredictionRow } from "@/components/home/GeneralPredictionRow";
import {
  buildLineupView,
  EntityModalController,
  type PlayerPickMode,
} from "@/components/lineup/EntityModalController";
import { PlayerAwardPickerModal } from "@/components/predictions/PlayerAwardPickerModal";
import { TeamsPickerModal } from "@/components/predictions/TeamsPickerModal";
import {
  formatChampionDisplay,
  formatFinalistsDisplay,
  formatPlayerDisplay,
} from "@/lib/tournament-predictions/display";
import type { TournamentGeneralPredictions } from "@/lib/tournament-predictions/types";
import { TOURNAMENT_GENERAL_PREDICTION_LABELS } from "@/lib/tournament-predictions/types";

type ActiveFlow =
  | { kind: "champion" }
  | { kind: "finalists" }
  | { kind: "top_scorer" }
  | { kind: "tournament_mvp" }
  | { kind: "golden_glove" }
  | null;

type HomeGeneralPredictionsCardProps = {
  poolId: string;
  predictions: TournamentGeneralPredictions;
  editable: boolean;
};

export function HomeGeneralPredictionsCard({
  poolId,
  predictions: initialPredictions,
  editable: initialEditable,
}: HomeGeneralPredictionsCardProps) {
  const router = useRouter();
  const [predictions, setPredictions] = useState(initialPredictions);
  const [editable, setEditable] = useState(initialEditable);

  useEffect(() => {
    setPredictions(initialPredictions);
    setEditable(initialEditable);
  }, [initialPredictions, initialEditable]);
  const [activeFlow, setActiveFlow] = useState<ActiveFlow>(null);
  const [lineupTeam, setLineupTeam] = useState<string | null>(null);
  const [playerPickMode, setPlayerPickMode] = useState<PlayerPickMode>("any");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function closeAll() {
    setActiveFlow(null);
    setLineupTeam(null);
    setError(null);
  }

  function runSave(action: () => Promise<{ ok: boolean; error?: string }>, onOk: () => void) {
    if (pending) return;
    setError(null);
    startTransition(async () => {
      const result = await action();
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      onOk();
      closeAll();
      router.refresh();
    });
  }

  function openChampionFlow() {
    setActiveFlow({ kind: "champion" });
  }

  function openFinalistsFlow() {
    setActiveFlow({ kind: "finalists" });
  }

  function openPlayerFlow(
    kind: "top_scorer" | "tournament_mvp" | "golden_glove",
    pickMode: PlayerPickMode
  ) {
    setPlayerPickMode(pickMode);
    setLineupTeam(null);
    setActiveFlow({ kind });
  }

  const labels = TOURNAMENT_GENERAL_PREDICTION_LABELS;

  return (
    <>
      <div className="tm-home-top-stat-card @container flex min-w-0 flex-col rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card">
        <div className="space-y-0">
          <GeneralPredictionRow
            label={labels.champion}
            value={formatChampionDisplay(predictions.championTeam)}
            editable={editable}
            onAdd={openChampionFlow}
            onEdit={openChampionFlow}
          />
          <GeneralPredictionRow
            label={labels.finalists}
            value={formatFinalistsDisplay(
              predictions.finalistTeamA,
              predictions.finalistTeamB
            )}
            editable={editable}
            onAdd={openFinalistsFlow}
            onEdit={openFinalistsFlow}
          />
          <GeneralPredictionRow
            label={labels.top_scorer}
            value={formatPlayerDisplay(
              predictions.topScorerPlayerName,
              predictions.topScorerTeamName
            )}
            editable={editable}
            onAdd={() => openPlayerFlow("top_scorer", "any")}
            onEdit={() => openPlayerFlow("top_scorer", "any")}
          />
          <GeneralPredictionRow
            label={labels.tournament_mvp}
            value={formatPlayerDisplay(
              predictions.tournamentMvpPlayerName,
              predictions.tournamentMvpTeamName
            )}
            editable={editable}
            onAdd={() => openPlayerFlow("tournament_mvp", "any")}
            onEdit={() => openPlayerFlow("tournament_mvp", "any")}
          />
          <GeneralPredictionRow
            label={labels.golden_glove}
            value={formatPlayerDisplay(
              predictions.goldenGlovePlayerName,
              predictions.goldenGloveTeamName
            )}
            editable={editable}
            onAdd={() => openPlayerFlow("golden_glove", "goalkeeper")}
            onEdit={() => openPlayerFlow("golden_glove", "goalkeeper")}
          />
        </div>
        {error ? (
          <p className="mt-2 text-[10px] text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      {activeFlow?.kind === "champion" ? (
        <TeamsPickerModal
          open
          onClose={closeAll}
          mode="pickOne"
          title="Campeón"
          onPickTeam={(team) =>
            runSave(
              () => saveTournamentChampion(poolId, team),
              () => setPredictions((current) => ({ ...current, championTeam: team }))
            )
          }
        />
      ) : null}

      {activeFlow?.kind === "finalists" ? (
        <TeamsPickerModal
          open
          onClose={closeAll}
          mode="pickTwo"
          title="Finalistas"
          onPickTwoTeams={(teamA, teamB) =>
            runSave(
              () => saveTournamentFinalists(poolId, teamA, teamB),
              () =>
                setPredictions((current) => ({
                  ...current,
                  finalistTeamA: teamA,
                  finalistTeamB: teamB,
                }))
            )
          }
        />
      ) : null}

      {activeFlow &&
      (activeFlow.kind === "top_scorer" ||
        activeFlow.kind === "tournament_mvp" ||
        activeFlow.kind === "golden_glove") &&
      !lineupTeam ? (
        <PlayerAwardPickerModal
          open
          onClose={closeAll}
          title={labels[activeFlow.kind]}
          playerPickMode={playerPickMode}
          onPickPlayer={(teamName, playerName) => {
            if (activeFlow.kind === "top_scorer") {
              runSave(
                () => saveTournamentTopScorer(poolId, playerName, teamName),
                () =>
                  setPredictions((current) => ({
                    ...current,
                    topScorerPlayerName: playerName,
                    topScorerTeamName: teamName,
                  }))
              );
              return;
            }
            if (activeFlow.kind === "tournament_mvp") {
              runSave(
                () => saveTournamentMvp(poolId, playerName, teamName),
                () =>
                  setPredictions((current) => ({
                    ...current,
                    tournamentMvpPlayerName: playerName,
                    tournamentMvpTeamName: teamName,
                  }))
              );
              return;
            }
            runSave(
              () => saveTournamentGoldenGlove(poolId, playerName, teamName),
              () =>
                setPredictions((current) => ({
                  ...current,
                  goldenGlovePlayerName: playerName,
                  goldenGloveTeamName: teamName,
                }))
            );
          }}
          onPickTeam={setLineupTeam}
        />
      ) : null}

      {lineupTeam &&
      activeFlow &&
      (activeFlow.kind === "top_scorer" ||
        activeFlow.kind === "tournament_mvp" ||
        activeFlow.kind === "golden_glove") ? (
        <EntityModalController
          open
          onClose={() => setLineupTeam(null)}
          initialView={buildLineupView(lineupTeam)}
          playerPickMode={playerPickMode}
          onPlayerPicked={(teamName, playerName) => {
            if (activeFlow.kind === "top_scorer") {
              runSave(
                () => saveTournamentTopScorer(poolId, playerName, teamName),
                () =>
                  setPredictions((current) => ({
                    ...current,
                    topScorerPlayerName: playerName,
                    topScorerTeamName: teamName,
                  }))
              );
              return;
            }
            if (activeFlow.kind === "tournament_mvp") {
              runSave(
                () => saveTournamentMvp(poolId, playerName, teamName),
                () =>
                  setPredictions((current) => ({
                    ...current,
                    tournamentMvpPlayerName: playerName,
                    tournamentMvpTeamName: teamName,
                  }))
              );
              return;
            }
            runSave(
              () => saveTournamentGoldenGlove(poolId, playerName, teamName),
              () =>
                setPredictions((current) => ({
                  ...current,
                  goldenGlovePlayerName: playerName,
                  goldenGloveTeamName: teamName,
                }))
            );
          }}
        />
      ) : null}
    </>
  );
}
