"use client";

import { useEffect, useCallback, useMemo, useState, useTransition } from "react";
import { Trash2, Plus, SlidersHorizontal, Star } from "lucide-react";
import {
  getStarPlayerConfigsAction,
  upsertStarPlayerConfigAction,
  deleteStarPlayerConfigAction,
  type StarPlayerConfigRow,
} from "@/actions/star-player-config";
import { fetchAllTournamentPlayersAction } from "@/actions/lineup";
import { EntityModalController, buildLineupView } from "@/components/lineup/EntityModalController";
import { PlayerAwardPickerModal } from "@/components/predictions/PlayerAwardPickerModal";
import { TeamFlagBadge } from "@/components/predictions/TeamFlagBadge";
import { teamNameEs } from "@/lib/teams/display";
import { cn } from "@/lib/utils";

type EditingState = {
  playerName: string;
  teamName: string | null;
  topScorerProb: string;
  mvpProb: string;
  goldenGloveProb: string;
};

function parseProb(val: string): number | null {
  const n = parseFloat(val);
  if (isNaN(n) || n < 0 || n > 100) return null;
  return n / 100;
}

function probToDisplay(val: number | null): string {
  if (val === null || val === undefined) return "";
  return (val * 100).toFixed(1);
}

function ProbInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <label className="text-[10px] font-semibold uppercase tracking-wide text-white/40">
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min="0"
          max="100"
          step="0.1"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="—"
          className={cn(
            "w-16 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 text-center text-sm font-mono",
            "text-[var(--tm-fg)] placeholder:text-white/20",
            "focus:border-[#CCFF00]/50 focus:outline-none focus:ring-1 focus:ring-[#CCFF00]/30"
          )}
        />
        <span className="text-xs text-white/40">%</span>
      </div>
    </div>
  );
}

function PlayerRow({
  row,
  onDelete,
  onEdit,
}: {
  row: StarPlayerConfigRow;
  onDelete: (name: string) => void;
  onEdit: (row: StarPlayerConfigRow) => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3 border-b border-white/5 last:border-0">
      <div className="shrink-0">
        {row.team_name ? (
          <TeamFlagBadge name={row.team_name} size="sm" />
        ) : (
          <div className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center">
            <Star className="h-3 w-3 text-white/30" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-[var(--tm-fg)]">{row.player_name}</p>
        {row.team_name && (
          <p className="truncate text-xs text-white/40">{teamNameEs(row.team_name)}</p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3 text-[11px] tabular-nums">
        {row.top_scorer_prob !== null && (
          <span className="rounded-full bg-orange-500/20 px-2 py-0.5 text-orange-300 font-semibold">
            ⚽ {probToDisplay(row.top_scorer_prob)}%
          </span>
        )}
        {row.mvp_prob !== null && (
          <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-purple-300 font-semibold">
            🏅 {probToDisplay(row.mvp_prob)}%
          </span>
        )}
        {row.golden_glove_prob !== null && (
          <span className="rounded-full bg-yellow-500/20 px-2 py-0.5 text-yellow-300 font-semibold">
            🧤 {probToDisplay(row.golden_glove_prob)}%
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={() => onEdit(row)}
          className="text-[var(--tm-fg-alt)] transition-colors hover:text-[#CCFF00]"
          aria-label={`Editar ${row.player_name}`}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => onDelete(row.player_name)}
          className="text-[var(--tm-fg-alt)] transition-colors hover:text-red-400"
          aria-label={`Eliminar ${row.player_name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}

export function StarPlayerConfigEditor() {
  const [rows, setRows] = useState<StarPlayerConfigRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [pickerOpen, setPickerOpen] = useState(false);
  const [lineupTeam, setLineupTeam] = useState<string | null>(null);
  const [editing, setEditing] = useState<EditingState | null>(null);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const result = await getStarPlayerConfigsAction();
    if (result.ok) {
      setRows(result.data);
      setError(null);
    } else {
      setError(result.error);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  function handlePickPlayer(teamName: string, playerName: string) {
    setPickerOpen(false);
    const existingRow = rows.find(
      (r) => r.player_name.toLowerCase() === playerName.toLowerCase()
    );
    setEditing({
      playerName,
      teamName,
      topScorerProb: existingRow ? probToDisplay(existingRow.top_scorer_prob) : "",
      mvpProb: existingRow ? probToDisplay(existingRow.mvp_prob) : "",
      goldenGloveProb: existingRow ? probToDisplay(existingRow.golden_glove_prob) : "",
    });
  }

  function handleEditRow(row: StarPlayerConfigRow) {
    setEditing({
      playerName: row.player_name,
      teamName: row.team_name,
      topScorerProb: probToDisplay(row.top_scorer_prob),
      mvpProb: probToDisplay(row.mvp_prob),
      goldenGloveProb: probToDisplay(row.golden_glove_prob),
    });
  }

  function handleSave() {
    if (!editing) return;
    startTransition(async () => {
      const result = await upsertStarPlayerConfigAction(
        editing.playerName,
        editing.teamName,
        parseProb(editing.topScorerProb),
        parseProb(editing.mvpProb),
        parseProb(editing.goldenGloveProb)
      );
      if (!result.ok) {
        setError(result.error ?? "Error al guardar.");
        return;
      }
      setEditing(null);
      await loadRows();
    });
  }

  function handleDelete(playerName: string) {
    startTransition(async () => {
      const result = await deleteStarPlayerConfigAction(playerName);
      if (!result.ok) {
        setError(result.error ?? "Error al eliminar.");
        return;
      }
      await loadRows();
    });
  }

  return (
    <div className="space-y-4">
      {/* Add new */}
      <button
        id="star-player-add-btn"
        type="button"
        onClick={() => setPickerOpen(true)}
        className={cn(
          "inline-flex w-full items-center justify-center gap-2 rounded-xl py-3",
          "bg-[#CCFF00]/10 border border-[#CCFF00]/30 text-[#CCFF00] text-sm font-semibold",
          "transition-colors hover:bg-[#CCFF00]/20 active:opacity-80"
        )}
      >
        <Plus className="h-4 w-4" />
        Añadir jugador estrella
      </button>

      {/* Inline editor panel */}
      {editing && (
        <div className="rounded-xl border border-[#CCFF00]/30 bg-[#CCFF00]/5 p-4 space-y-4">
          <div className="flex items-center gap-3">
            {editing.teamName && (
              <TeamFlagBadge name={editing.teamName} size="sm" className="shrink-0" />
            )}
            <div>
              <p className="font-semibold text-[var(--tm-fg)]">{editing.playerName}</p>
              {editing.teamName && (
                <p className="text-xs text-white/40">{teamNameEs(editing.teamName)}</p>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-4">
            <ProbInput
              label="Pichichi ⚽"
              value={editing.topScorerProb}
              onChange={(v) => setEditing((e) => e && { ...e, topScorerProb: v })}
            />
            <ProbInput
              label="MVP 🏅"
              value={editing.mvpProb}
              onChange={(v) => setEditing((e) => e && { ...e, mvpProb: v })}
            />
            <ProbInput
              label="Guante 🧤"
              value={editing.goldenGloveProb}
              onChange={(v) => setEditing((e) => e && { ...e, goldenGloveProb: v })}
            />
          </div>
          <div className="flex gap-2">
            <button
              id="star-player-save-btn"
              type="button"
              disabled={pending}
              onClick={handleSave}
              className={cn(
                "flex-1 rounded-lg py-2 text-sm font-bold uppercase tracking-wide",
                "bg-[#CCFF00] text-black transition-opacity hover:opacity-90",
                pending && "opacity-60"
              )}
            >
              {pending ? "Guardando…" : "Guardar"}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-lg border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white/80"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {error && (
        <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400">{error}</p>
      )}

      {/* List */}
      {loading ? (
        <p className="py-6 text-center text-sm text-white/40">Cargando…</p>
      ) : rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-white/40">
          No hay jugadores configurados todavía.
        </p>
      ) : (
        <ul className="divide-y divide-white/5">
          {rows.map((row) => (
            <PlayerRow
              key={row.player_name}
              row={row}
              onDelete={handleDelete}
              onEdit={handleEditRow}
            />
          ))}
        </ul>
      )}

      {/* Player picker modal */}
      <PlayerAwardPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        title="Seleccionar jugador"
        playerPickMode="any"
        onPickPlayer={handlePickPlayer}
        onPickTeam={setLineupTeam}
      />

      {lineupTeam && (
        <EntityModalController
          open
          onClose={() => setLineupTeam(null)}
          initialView={buildLineupView(lineupTeam)}
          playerPickMode="any"
          onPlayerPicked={(teamName, playerName) => {
            setLineupTeam(null);
            handlePickPlayer(teamName, playerName);
          }}
        />
      )}
    </div>
  );
}
