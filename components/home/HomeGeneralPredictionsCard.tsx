"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import {
  saveTournamentChampion,
  saveTournamentFinalists,
  saveTournamentGoldenGlove,
  saveTournamentMvp,
  saveTournamentTopScorer,
} from "@/actions/tournament-general-predictions";
import { HomeStatCardScrollHint } from "@/components/home/HomeStatCardScrollHint";
import {
  HomeChampionTeamValue,
  HomeFinalistsTeamValue,
} from "@/components/home/GeneralPredictionTeamValue";
import {
  buildLineupView,
  EntityModalController,
  type PlayerPickMode,
} from "@/components/lineup/EntityModalController";
import { PlayerAwardPickerModal } from "@/components/predictions/PlayerAwardPickerModal";
import { TeamsPickerModal } from "@/components/predictions/TeamsPickerModal";
import { formatPlayerDisplay } from "@/lib/tournament-predictions/display";
import type {
  TournamentGeneralPredictions,
  TournamentGeneralPredictionsBoardRow,
} from "@/lib/tournament-predictions/types";
import { TOURNAMENT_GENERAL_PREDICTION_LABELS } from "@/lib/tournament-predictions/types";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";

type ActiveFlow =
  | { kind: "champion" }
  | { kind: "finalists" }
  | { kind: "top_scorer" }
  | { kind: "tournament_mvp" }
  | { kind: "golden_glove" }
  | null;

type GeneralPredictionsCarouselSlide = {
  profileId: string;
  headerLabel: string;
  isOwn: boolean;
  slidePredictions: TournamentGeneralPredictions;
};

type HomeGeneralPredictionsCardProps = {
  poolId: string;
  currentProfileId: string;
  predictions: TournamentGeneralPredictions;
  editable: boolean;
  boardRows: TournamentGeneralPredictionsBoardRow[];
};

function boardRowToPredictions(
  poolId: string,
  row: TournamentGeneralPredictionsBoardRow
): TournamentGeneralPredictions {
  return {
    poolId,
    profileId: row.profileId,
    championTeam: row.championTeam,
    finalistTeamA: row.finalistTeamA,
    finalistTeamB: row.finalistTeamB,
    topScorerPlayerName: row.topScorerPlayerName,
    topScorerTeamName: row.topScorerTeamName,
    tournamentMvpPlayerName: row.tournamentMvpPlayerName,
    tournamentMvpTeamName: row.tournamentMvpTeamName,
    goldenGlovePlayerName: row.goldenGlovePlayerName,
    goldenGloveTeamName: row.goldenGloveTeamName,
    updatedAt: null,
  };
}

function GeneralPredictionsSlideBody({
  slidePredictions,
  editable,
  onChampion,
  onFinalists,
  onTopScorer,
  onTournamentMvp,
  onGoldenGlove,
}: {
  slidePredictions: TournamentGeneralPredictions;
  editable: boolean;
  onChampion: () => void;
  onFinalists: () => void;
  onTopScorer: () => void;
  onTournamentMvp: () => void;
  onGoldenGlove: () => void;
}) {
  const labels = TOURNAMENT_GENERAL_PREDICTION_LABELS;

  return (
    <div className="tm-home-general-predictions__body">
      <GeneralPredictionRow
        label={labels.champion}
        valueNode={
          slidePredictions.championTeam ? (
            <HomeChampionTeamValue team={slidePredictions.championTeam} />
          ) : null
        }
        editable={editable}
        onAdd={onChampion}
        onEdit={onChampion}
      />
      <GeneralPredictionRow
        label={labels.finalists}
        valueNode={
          slidePredictions.finalistTeamA && slidePredictions.finalistTeamB ? (
            <HomeFinalistsTeamValue
              teamA={slidePredictions.finalistTeamA}
              teamB={slidePredictions.finalistTeamB}
            />
          ) : null
        }
        editable={editable}
        onAdd={onFinalists}
        onEdit={onFinalists}
      />
      <GeneralPredictionRow
        label={labels.top_scorer}
        value={formatPlayerDisplay(
          slidePredictions.topScorerPlayerName,
          slidePredictions.topScorerTeamName
        )}
        editable={editable}
        onAdd={onTopScorer}
        onEdit={onTopScorer}
      />
      <GeneralPredictionRow
        label={labels.tournament_mvp}
        value={formatPlayerDisplay(
          slidePredictions.tournamentMvpPlayerName,
          slidePredictions.tournamentMvpTeamName
        )}
        editable={editable}
        onAdd={onTournamentMvp}
        onEdit={onTournamentMvp}
      />
      <GeneralPredictionRow
        label={labels.golden_glove}
        value={formatPlayerDisplay(
          slidePredictions.goldenGlovePlayerName,
          slidePredictions.goldenGloveTeamName
        )}
        editable={editable}
        onAdd={onGoldenGlove}
        onEdit={onGoldenGlove}
      />
    </div>
  );
}

export function HomeGeneralPredictionsCard({
  poolId,
  currentProfileId,
  predictions: initialPredictions,
  editable: initialEditable,
  boardRows,
}: HomeGeneralPredictionsCardProps) {
  const router = useRouter();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);
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
  const allTeams = useMemo(() => getAllWorldCupTeamsAlphabetically(), []);

  const carouselSlides = useMemo<GeneralPredictionsCarouselSlide[]>(() => {
    const peers = boardRows
      .filter((row) => row.profileId !== currentProfileId)
      .sort((a, b) => a.label.localeCompare(b.label, "es", { sensitivity: "base" }));

    const ownSlide: GeneralPredictionsCarouselSlide = {
      profileId: currentProfileId,
      headerLabel: "Mis predicciones",
      isOwn: true,
      slidePredictions: predictions,
    };

    const peerSlides = peers.map((row) => ({
      profileId: row.profileId,
      headerLabel: row.label,
      isOwn: false,
      slidePredictions: boardRowToPredictions(poolId, row),
    }));

    return [ownSlide, ...peerSlides];
  }, [boardRows, currentProfileId, predictions, poolId]);

  const updateActiveIndex = useCallback(() => {
    const el = scrollRef.current;
    if (!el || el.clientWidth === 0) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setActiveIndex(Math.min(Math.max(index, 0), carouselSlides.length - 1));
  }, [carouselSlides.length]);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el || carouselSlides.length === 0) return;
    el.scrollLeft = 0;
    setActiveIndex(0);
  }, [carouselSlides.length, currentProfileId]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateActiveIndex();
    el.addEventListener("scroll", updateActiveIndex, { passive: true });
    return () => el.removeEventListener("scroll", updateActiveIndex);
  }, [updateActiveIndex]);

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
      <Link
        href="/general-predictions"
        aria-label="Ver pronósticos globales de todos los trincadores"
        className={cn(
          "tm-home-top-stat-card @container relative flex min-h-0 min-w-0 flex-col rounded-2xl p-[clamp(0.5rem,3cqw,0.75rem)] tm-stat-card",
          "transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#CCFF00]/50"
        )}
        data-block-tab-swipe={true}
      >
        <div
          ref={scrollRef}
          className="tm-home-general-predictions__carousel"
          aria-roledescription="carrusel"
        >
          {carouselSlides.map((slide, index) => (
            <div
              key={slide.profileId}
              className="tm-home-general-predictions__slide"
              aria-hidden={index !== activeIndex}
            >
              <div className="tm-home-general-predictions__header">
                <span className="min-w-0 truncate text-[9px] font-semibold uppercase tracking-wide text-[var(--tm-accent)]">
                  {slide.headerLabel}
                </span>
                <span className="shrink-0 text-[6px] font-medium uppercase tracking-[0.08em] text-[var(--tm-accent)]">
                  Ver todos
                </span>
              </div>
              <GeneralPredictionsSlideBody
                slidePredictions={slide.slidePredictions}
                editable={editable && slide.isOwn}
                onChampion={openChampionFlow}
                onFinalists={openFinalistsFlow}
                onTopScorer={() => openPlayerFlow("top_scorer", "any")}
                onTournamentMvp={() => openPlayerFlow("tournament_mvp", "any")}
                onGoldenGlove={() => openPlayerFlow("golden_glove", "goalkeeper")}
              />
            </div>
          ))}
        </div>
        {carouselSlides.length > 1 ? (
          <HomeStatCardScrollHint activeSlot={activeIndex === 0 ? 0 : 1} />
        ) : null}
        {error ? (
          <p className="mt-1 shrink-0 text-[10px] text-[var(--tm-danger)]" role="alert">
            {error}
          </p>
        ) : null}
      </Link>

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
          carouselTeams={allTeams}
          onCarouselTeamChange={setLineupTeam}
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
