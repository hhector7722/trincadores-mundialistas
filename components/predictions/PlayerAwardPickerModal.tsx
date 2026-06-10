"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchAllTournamentPlayersAction } from "@/actions/lineup";
import { PlayerSearchBar } from "@/components/players/PlayerSearchBar";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { Modal } from "@/components/ui/modal";
import { LoadingCenter } from "@/components/ui/spinner";
import type { PlayerPickMode } from "@/components/lineup/EntityModalController";
import { getAllWorldCupTeamsAlphabetically } from "@/lib/predictions/teams-picker-data";
import {
  goalkeeperFilter,
  searchPlayers,
  type SearchablePlayer,
} from "@/lib/players/search-players";
import { teamAbbr, teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type PlayerAwardPickerModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  playerPickMode: PlayerPickMode;
  onPickPlayer: (teamName: string, playerName: string) => void;
  onPickTeam: (teamName: string) => void;
};

const MIN_QUERY_LENGTH = 2;

export function PlayerAwardPickerModal({
  open,
  onClose,
  title,
  playerPickMode,
  onPickPlayer,
  onPickTeam,
}: PlayerAwardPickerModalProps) {
  const teams = useMemo(() => getAllWorldCupTeamsAlphabetically(), []);
  const [query, setQuery] = useState("");
  const [players, setPlayers] = useState<SearchablePlayer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setQuery("");
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    fetchAllTournamentPlayersAction().then((result) => {
      if (cancelled) return;
      if (!result.ok) {
        setError(result.error);
        setPlayers([]);
      } else {
        setPlayers(result.data);
      }
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [open]);

  const positionFilter =
    playerPickMode === "goalkeeper"
      ? goalkeeperFilter
      : playerPickMode === "any"
        ? undefined
        : undefined;

  const searchResults = useMemo(() => {
    if (query.trim().length < MIN_QUERY_LENGTH) return [];
    return searchPlayers(players, query, {
      filter: positionFilter,
      limit: 24,
    });
  }, [players, query, positionFilter]);

  const showSearchResults = query.trim().length >= MIN_QUERY_LENGTH;
  const pickHint =
    playerPickMode === "goalkeeper"
      ? "Solo porteros. Busca por nombre o elige selección."
      : "Busca por nombre o elige una selección.";

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      headerTitleAlign="center"
      hideHeaderDivider
      className="h-[min(calc(100dvh-2rem),44rem)] max-h-[calc(100dvh-2rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,56rem)]"
      backdropClassName="bg-[#2a1058]/40"
    >
      <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 space-y-2 border-b border-[var(--tm-border)] px-3 py-3">
          <PlayerSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar jugador…"
            autoFocus
          />
          <p className="text-center text-[10px] text-[var(--tm-muted)]">{pickHint}</p>
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {loading ? (
            <LoadingCenter label="Cargando jugadores…" />
          ) : error ? (
            <div className="flex h-full items-center justify-center px-4 py-6">
              <p className="text-center text-sm text-[var(--tm-danger)]" role="alert">
                {error}
              </p>
            </div>
          ) : (
            <>
              <ul
                aria-hidden={showSearchResults}
                className={cn(
                  "absolute inset-0 grid grid-cols-6 items-stretch gap-2 overflow-y-auto p-2.5 sm:gap-2.5 sm:p-3",
                  showSearchResults && "pointer-events-none invisible"
                )}
              >
                {teams.map((team) => (
                  <li key={team} className="flex min-w-0">
                    <button
                      type="button"
                      onClick={() => onPickTeam(team)}
                      aria-label={`Ver plantilla de ${teamNameEs(team)}`}
                      className={cn(
                        "flex h-[3.75rem] w-full min-w-0 flex-col items-center justify-center gap-1 rounded-lg border border-[var(--tm-border)] bg-[rgba(111,43,255,0.12)] px-1 text-center transition-colors",
                        "hover:bg-[rgba(111,43,255,0.22)] active:bg-[rgba(111,43,255,0.28)]"
                      )}
                    >
                      <TeamFlagBadge name={team} size="sm" className="shrink-0" />
                      <span className="w-full min-w-0 truncate text-center text-[8px] font-semibold uppercase tracking-wide text-[var(--tm-fg)] sm:text-[10px]">
                        {teamAbbr(team)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>

              {showSearchResults ? (
                <ul className="absolute inset-0 overflow-y-auto px-2 py-2">
                  {searchResults.length === 0 ? (
                    <li className="py-8 text-center text-sm text-[var(--tm-muted)]">
                      No hay jugadores que coincidan con &ldquo;{query.trim()}&rdquo;.
                    </li>
                  ) : (
                    searchResults.map((player) => (
                      <li key={`${player.teamName}-${player.playerName}`}>
                        <button
                          type="button"
                          onClick={() => onPickPlayer(player.teamName, player.playerName)}
                          className="flex min-h-12 w-full items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-[rgba(111,43,255,0.18)] active:bg-[rgba(111,43,255,0.28)]"
                        >
                          <TeamFlagBadge name={player.teamName} size="sm" className="shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-[var(--tm-fg)]">
                              {player.playerName}
                            </p>
                            <p className="truncate text-xs text-[var(--tm-muted)]">
                              {teamNameEs(player.teamName)}
                              {player.shirtNumber != null ? ` · #${player.shirtNumber}` : ""}
                            </p>
                          </div>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              ) : null}
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}
