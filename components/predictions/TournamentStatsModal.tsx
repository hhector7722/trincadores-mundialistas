"use client";

import { useEffect, useMemo, useState } from "react";
import { PlayerSearchBar } from "@/components/players/PlayerSearchBar";
import { Modal } from "@/components/ui/modal";
import type { MatchWithPrediction } from "@/lib/predictions/queries";
import { searchPlayers, type SearchablePlayer } from "@/lib/players/search-players";
import { normalizeText } from "@/lib/text/normalize-alias";
import {
  getTournamentStatRows,
  TOURNAMENT_STAT_TABS,
  type TournamentStatKind,
} from "@/lib/pool/tournament-stats";
import { cn } from "@/lib/utils";

type TournamentStatsModalProps = {
  open: boolean;
  onClose: () => void;
  onBack?: () => void;
  matches: MatchWithPrediction[];
};

const MIN_QUERY_LENGTH = 2;

function filterStatRowsByQuery(
  rows: ReturnType<typeof getTournamentStatRows>,
  query: string
): ReturnType<typeof getTournamentStatRows> {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery || query.trim().length < MIN_QUERY_LENGTH) return rows;

  const searchable: SearchablePlayer[] = rows.map((row) => ({
    playerName: row.label,
    teamName: "",
    position: null,
    shirtNumber: null,
  }));

  const ranked = searchPlayers(searchable, query, { limit: rows.length });
  const rankedLabels = new Set(ranked.map((player) => player.playerName));

  return rows.filter((row) => rankedLabels.has(row.label));
}

export function TournamentStatsModal({ open, onClose, onBack, matches }: TournamentStatsModalProps) {
  const [activeStat, setActiveStat] = useState<TournamentStatKind>("scorers");
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const rows = useMemo(
    () => getTournamentStatRows(activeStat, matches),
    [activeStat, matches]
  );

  const filteredRows = useMemo(
    () => filterStatRowsByQuery(rows, query),
    [rows, query]
  );

  const emptyLabel = useMemo(() => {
    switch (activeStat) {
      case "scorers":
        return "Aún no hay goles registrados.";
      case "assists":
        return "Aún no hay asistencias registradas.";
      case "yellow_cards":
        return "Aún no hay tarjetas amarillas registradas.";
      case "red_cards":
        return "Aún no hay tarjetas rojas registradas.";
      case "mvp":
        return "Aún no hay MVP registrado.";
      default:
        return "Sin datos.";
    }
  }, [activeStat]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      onBack={onBack}
      backButtonPlain={Boolean(onBack)}
      title="Estadísticas del torneo"
      hideHeaderDivider
      className="max-h-[calc(100dvh-1rem)]"
      wrapperClassName="max-w-[min(100vw-1rem,28rem)]"
      backdropClassName="bg-[#2a1058]/40"
    >
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="shrink-0 border-b border-[var(--tm-border)] px-3 py-3">
          <PlayerSearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar futbolista…"
            autoFocus={open}
          />
        </div>

        <div className="flex shrink-0 gap-1 overflow-x-auto px-3 pb-2 pt-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {TOURNAMENT_STAT_TABS.map((tab) => {
            const active = tab.id === activeStat;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveStat(tab.id)}
                className={cn(
                  "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide transition-colors sm:text-xs",
                  active
                    ? "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)]"
                    : "bg-[rgba(255,255,255,0.08)] text-[var(--tm-muted)] hover:text-[var(--tm-fg)]"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <ul className="min-h-0 flex-1 overflow-y-auto border-t border-[var(--tm-border)] px-3 py-2">
          {rows.length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--tm-muted)]">{emptyLabel}</li>
          ) : filteredRows.length === 0 ? (
            <li className="py-6 text-center text-sm text-[var(--tm-muted)]">
              No hay resultados para &ldquo;{query.trim()}&rdquo;.
            </li>
          ) : (
            filteredRows.map((row, index) => (
              <li
                key={`${row.label}-${index}`}
                className="flex items-center gap-2 border-b border-[var(--tm-border)] py-2 last:border-0"
              >
                <span className="w-6 shrink-0 text-center text-xs tabular-nums text-[var(--tm-muted)]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-[var(--tm-fg)]">
                  {row.label}
                </span>
                <span className="shrink-0 font-display text-sm tabular-nums text-[var(--tm-accent)]">
                  {row.value}
                </span>
              </li>
            ))
          )}
        </ul>
      </div>
    </Modal>
  );
}
