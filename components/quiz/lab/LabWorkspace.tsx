"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus, RotateCcw, Save, Shuffle, Trash2 } from "lucide-react";
import { LabQuestionPreview } from "@/components/quiz/lab/formats/LabQuestionPreview";
import { LabShell } from "@/components/quiz/lab/LabShell";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { resolveClubCrestUrl } from "@/lib/quiz/lab/club-crests";
import { LAB_DEMO_VIDEO_SRC } from "@/lib/quiz/lab/demo-video";
import { createLabQuestion } from "@/lib/quiz/lab/defaults";
import {
  canAutoGenerateLabFormat,
  questionNeedsAutoGeneration,
} from "@/lib/quiz/lab/auto-formats";
import { fetchGeneratedLabQuestion } from "@/lib/quiz/lab/generate-question.client";
import { selectionSlotsForFormation } from "@/lib/quiz/lab/hydrate";
import { canReloadLabQuestion, reloadLabQuestion } from "@/lib/quiz/lab/reload-question";
import { readLabDraft, resetLabDraft, writeLabDraft } from "@/lib/quiz/lab/storage";
import {
  isLabPlayerCropQuestion,
  isLabPlayerSilhouetteQuestion,
  LAB_FORMAT_DESCRIPTIONS,
  LAB_FORMAT_LABELS,
  LAB_QUESTION_FORMATS,
  type LabDraft,
  type LabQuestion,
  type LabQuestionFormat,
} from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";
import { cn } from "@/lib/utils";

type WorkspaceMode = "edit" | "preview";

function updateQuestion(draft: LabDraft, questionId: string, patch: Partial<LabQuestion>): LabDraft {
  return {
    ...draft,
    questions: draft.questions.map((q) =>
      q.id === questionId ? ({ ...q, ...patch } as LabQuestion) : q
    ),
  };
}

export function LabWorkspace() {
  const [draft, setDraft] = useState<LabDraft>(() => readLabDraft());
  const [mode, setMode] = useState<WorkspaceMode>("edit");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(
    () => draft.questions[0]?.id ?? null
  );
  const [playIndex, setPlayIndex] = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(10);
  const [savedFlash, setSavedFlash] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [catalogDifficulty, setCatalogDifficulty] =
    useState<WorldCupMomentDifficulty>("medium");

  const activeQuestion =
    draft.questions.find((q) => q.id === activeQuestionId) ?? draft.questions[0] ?? null;
  const playQuestion = draft.questions[playIndex] ?? null;

  const persist = useCallback((next: LabDraft | ((prev: LabDraft) => LabDraft)) => {
    setDraft((prev) => {
      const resolved = typeof next === "function" ? next(prev) : next;
      writeLabDraft(resolved);
      return resolved;
    });
  }, []);

  useEffect(() => {
    if (!activeQuestionId && draft.questions[0]) {
      setActiveQuestionId(draft.questions[0].id);
    }
  }, [activeQuestionId, draft.questions]);

  useEffect(() => {
    if (mode !== "preview" || !playQuestion || selectedOptionId !== null) return;

    setSecondsLeft(playQuestion.timerSeconds);
    const interval = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [mode, playQuestion, playIndex, selectedOptionId]);

  useEffect(() => {
    let cancelled = false;

    async function autoGenerateInitialQuestions() {
      const pending = draft.questions.filter(questionNeedsAutoGeneration);
      if (!pending.length) return;

      setGenerating(true);
      setGenerateError(null);

      try {
        for (const question of pending) {
          if (cancelled) return;
          const generated = await fetchGeneratedLabQuestion({
            format: question.format,
            questionId: question.id,
            excludeMomentId:
              "momentId" in question && question.momentId ? question.momentId : null,
            minDifficulty: catalogDifficulty,
          });
          if (cancelled) return;
          persist((prev) => ({
            ...prev,
            questions: prev.questions.map((item) =>
              item.id === question.id ? generated : item
            ),
          }));
        }
      } catch (error) {
        if (!cancelled) {
          setGenerateError(
            error instanceof Error
              ? error.message
              : "No se pudieron generar las imagenes automaticamente."
          );
        }
      } finally {
        if (!cancelled) setGenerating(false);
      }
    }

    void autoGenerateInitialQuestions();

    return () => {
      cancelled = true;
    };
    // Solo al montar: genera assets para el borrador cargado desde localStorage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleSave() {
    writeLabDraft(draft);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1500);
  }

  function handleReset() {
    const fresh = resetLabDraft();
    setDraft(fresh);
    setActiveQuestionId(fresh.questions[0]?.id ?? null);
    setMode("edit");
  }

  async function addQuestion(format: LabQuestionFormat) {
    setGenerateError(null);
    let question = createLabQuestion(format);

    if (canAutoGenerateLabFormat(format)) {
      setGenerating(true);
      try {
        question = await fetchGeneratedLabQuestion({
          format,
          minDifficulty: catalogDifficulty,
        });
      } catch (error) {
        setGenerateError(
          error instanceof Error ? error.message : "No se pudo generar la pregunta."
        );
      } finally {
        setGenerating(false);
      }
    }

    persist((prev) => ({ ...prev, questions: [...prev.questions, question] }));
    setActiveQuestionId(question.id);
  }

  function removeQuestion(id: string) {
    let nextActiveId: string | null | undefined;
    persist((prev) => {
      const questions = prev.questions.filter((q) => q.id !== id);
      if (activeQuestionId === id) {
        nextActiveId = questions[0]?.id ?? null;
      }
      return { ...prev, questions };
    });
    if (nextActiveId !== undefined) {
      setActiveQuestionId(nextActiveId);
    }
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    persist((prev) => {
      const index = prev.questions.findIndex((q) => q.id === id);
      const target = index + direction;
      if (index < 0 || target < 0 || target >= prev.questions.length) return prev;
      const questions = [...prev.questions];
      const [item] = questions.splice(index, 1);
      questions.splice(target, 0, item);
      return { ...prev, questions };
    });
  }

  function patchActive(questionId: string, patch: Partial<LabQuestion>) {
    persist((prev) => updateQuestion(prev, questionId, patch));
  }

  async function reloadActiveQuestion() {
    if (!activeQuestion) return;

    setGenerateError(null);
    setGenerating(true);

    try {
      let reloaded: LabQuestion;

      if (canAutoGenerateLabFormat(activeQuestion.format)) {
        reloaded = await fetchGeneratedLabQuestion({
          format: activeQuestion.format,
          questionId: activeQuestion.id,
          excludeMomentId:
            "momentId" in activeQuestion && activeQuestion.momentId
              ? activeQuestion.momentId
              : null,
          minDifficulty: catalogDifficulty,
          force: true,
        });
      } else if (canReloadLabQuestion(activeQuestion.format)) {
        reloaded = reloadLabQuestion(activeQuestion, {
          minDifficulty: catalogDifficulty,
        });
      } else {
        return;
      }

      persist((prev) => ({
        ...prev,
        questions: prev.questions.map((q) => (q.id === activeQuestion.id ? reloaded : q)),
      }));
    } catch (error) {
      setGenerateError(
        error instanceof Error ? error.message : "No se pudo actualizar la pregunta."
      );
    } finally {
      setGenerating(false);
    }
  }

  function startPreview() {
    if (draft.questions.length === 0) return;
    setMode("preview");
    setPlayIndex(0);
    setSelectedOptionId(null);
    setShowFeedback(false);
  }

  function handlePlaySelect(optionId: string) {
    if (!playQuestion || selectedOptionId) return;
    setSelectedOptionId(optionId);
    setShowFeedback(true);
  }

  function nextPlayQuestion() {
    if (playIndex + 1 >= draft.questions.length) {
      setMode("edit");
      setPlayIndex(0);
      setSelectedOptionId(null);
      setShowFeedback(false);
      return;
    }
    setPlayIndex((i) => i + 1);
    setSelectedOptionId(null);
    setShowFeedback(false);
  }

  return (
    <LabShell subtitle={draft.title}>
      <div className="flex shrink-0 gap-2 border-b border-[var(--lab-border)] px-4 py-2">
        <button
          type="button"
          onClick={() => setMode("edit")}
          className={cn(
            "min-h-10 flex-1 rounded-lg border text-xs font-semibold uppercase tracking-wider",
            mode === "edit"
              ? "border-[var(--lab-accent)] bg-[var(--lab-surface)] text-[var(--lab-fg)]"
              : "border-[var(--lab-border)] text-[var(--lab-muted)]"
          )}
        >
          Editor
        </button>
        <button
          type="button"
          onClick={startPreview}
          disabled={draft.questions.length === 0}
          className={cn(
            "flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider",
            mode === "preview"
              ? "border-[var(--lab-accent)] bg-[var(--lab-surface)] text-[var(--lab-fg)]"
              : "border-[var(--lab-border)] text-[var(--lab-muted)]",
            draft.questions.length === 0 && "opacity-40"
          )}
        >
          <Play className="h-3.5 w-3.5" />
          Probar
        </button>
      </div>

      {mode === "edit" ? (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <div className="shrink-0 space-y-2 border-b border-[var(--lab-border)] px-4 py-3">
            <label className="block text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
              Título del borrador
            </label>
            <input
              value={draft.title}
              onChange={(e) => persist({ ...draft, title: e.target.value })}
              className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)] outline-none focus:border-[var(--lab-accent)]"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSave}
                className="flex min-h-10 flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--lab-accent)] text-xs font-semibold uppercase text-[var(--lab-fg)]"
              >
                <Save className="h-3.5 w-3.5" />
                {savedFlash ? "Guardado" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-[var(--lab-border)] px-3 text-xs uppercase text-[var(--lab-muted)]"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-4 py-3">
            <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
              Preguntas ({draft.questions.length})
            </p>
            <div className="mb-4 space-y-2">
              {draft.questions.map((q, index) => (
                <div
                  key={q.id}
                  className={cn(
                    "flex items-center gap-2 rounded-xl border p-2",
                    activeQuestionId === q.id
                      ? "border-[var(--lab-accent)] bg-[var(--lab-surface)]"
                      : "border-[var(--lab-border)]"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveQuestionId(q.id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <span className="block text-[10px] uppercase text-[var(--lab-muted)]">
                      {index + 1}. {LAB_FORMAT_LABELS[q.format]}
                    </span>
                    <span className="block truncate text-sm text-[var(--lab-fg)]">
                      {q.prompt || "(sin enunciado)"}
                    </span>
                  </button>
                  <div className="flex shrink-0 flex-col gap-1">
                    <button
                      type="button"
                      aria-label="Subir"
                      onClick={() => moveQuestion(q.id, -1)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[var(--lab-border)] text-[var(--lab-muted)]"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Bajar"
                      onClick={() => moveQuestion(q.id, 1)}
                      className="flex h-8 w-8 items-center justify-center rounded border border-[var(--lab-border)] text-[var(--lab-muted)]"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                  <button
                    type="button"
                    aria-label="Eliminar"
                    onClick={() => removeQuestion(q.id)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-red-900/50 text-red-400"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>

            <p className="mb-2 text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
              Añadir formato
            </p>
            <div className="mb-6 grid gap-2">
              {LAB_QUESTION_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => addQuestion(format)}
                  className="flex min-h-12 items-start gap-2 rounded-xl border border-dashed border-[var(--lab-border)] px-3 py-2 text-left transition-colors active:bg-[var(--lab-surface)]"
                >
                  <Plus className="mt-0.5 h-4 w-4 shrink-0 text-[var(--lab-fg)]" />
                  <span>
                    <span className="block text-sm font-medium text-[var(--lab-fg)]">
                      {LAB_FORMAT_LABELS[format]}
                    </span>
                    <span className="block text-[11px] text-[var(--lab-muted)]">
                      {LAB_FORMAT_DESCRIPTIONS[format]}
                    </span>
                  </span>
                </button>
              ))}
            </div>

            {activeQuestion ? (
              <div className="space-y-4 border-t border-[var(--lab-border)] pt-4">
                <p className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
                  Editar · {LAB_FORMAT_LABELS[activeQuestion.format]}
                </p>

                {(canReloadLabQuestion(activeQuestion.format) ||
                  canAutoGenerateLabFormat(activeQuestion.format)) ? (
                  <div className="rounded-xl border border-[var(--lab-border)] bg-[var(--lab-surface)] p-3 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
                        Contenido generado
                      </p>
                      <button
                        type="button"
                        onClick={() => void reloadActiveQuestion()}
                        disabled={generating}
                        className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-[var(--lab-accent)] px-3 text-[10px] font-bold uppercase tracking-wider text-[var(--lab-fg)] disabled:opacity-50"
                      >
                        <Shuffle className="size-4" aria-hidden />
                        {generating ? "Generando…" : "Actualizar"}
                      </button>
                    </div>
                    {activeQuestion.format === "image_trivia" ||
                    activeQuestion.format === "guess_player_hair" ||
                    activeQuestion.format === "guess_player_eyes" ? (
                      <div className="flex flex-wrap gap-2">
                        {(["easy", "medium", "hard"] as const).map((level) => (
                          <button
                            key={level}
                            type="button"
                            onClick={() => setCatalogDifficulty(level)}
                            className={cn(
                              "min-h-10 rounded-lg border px-3 text-[10px] font-bold uppercase tracking-wider",
                              catalogDifficulty === level
                                ? "border-[var(--lab-accent)] text-[var(--lab-fg)]"
                                : "border-[var(--lab-border)] text-[var(--lab-muted)]"
                            )}
                          >
                            {level}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    {"momentLabel" in activeQuestion && activeQuestion.momentLabel ? (
                      <p className="text-xs text-[var(--lab-fg)]">
                        <span className="text-[var(--lab-muted)]">Fuente: </span>
                        {activeQuestion.momentLabel}
                        {"momentDifficulty" in activeQuestion && activeQuestion.momentDifficulty ? (
                          <span className="ml-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase text-[var(--lab-muted)]">
                            {activeQuestion.momentDifficulty}
                          </span>
                        ) : null}
                      </p>
                    ) : activeQuestion.format === "image_trivia" ? (
                      <p className="text-xs text-[var(--lab-fg)]">
                        <span className="text-[var(--lab-muted)]">Pregunta: </span>
                        {activeQuestion.prompt}
                        {activeQuestion.answerType ? (
                          <span className="ml-2 rounded bg-black/40 px-1.5 py-0.5 text-[10px] uppercase text-[var(--lab-muted)]">
                            {activeQuestion.answerType}
                          </span>
                        ) : null}
                      </p>
                    ) : activeQuestion.format === "guess_selection" ? (
                      <p className="text-xs text-[var(--lab-fg)]">
                        <span className="text-[var(--lab-muted)]">Selección: </span>
                        {activeQuestion.options.find((o) => o.id === activeQuestion.correctOptionId)
                          ?.label ?? "—"}
                      </p>
                    ) : activeQuestion.format === "guess_player_silhouette" ? (
                      <p className="text-xs text-[var(--lab-fg)]">
                        <span className="text-[var(--lab-muted)]">Escena: </span>
                        {activeQuestion.sceneLabel}
                      </p>
                    ) : activeQuestion.format === "video_play_end" ? (
                      <p className="text-xs text-[var(--lab-muted)]">
                        Mezcla las opciones de respuesta manteniendo el vídeo.
                      </p>
                    ) : null}
                  </div>
                ) : null}

                {generateError ? (
                  <p className="rounded-lg border border-red-900/50 bg-red-950/30 px-3 py-2 text-xs text-red-300">
                    {generateError}
                  </p>
                ) : null}

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase text-[var(--lab-muted)]">Enunciado</span>
                  <input
                    value={activeQuestion.prompt}
                    onChange={(e) => patchActive(activeQuestion.id, { prompt: e.target.value })}
                    className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                  />
                </label>

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                    Timer (segundos)
                  </span>
                  <input
                    type="number"
                    min={5}
                    max={60}
                    value={activeQuestion.timerSeconds}
                    onChange={(e) =>
                      patchActive(activeQuestion.id, { timerSeconds: Number(e.target.value) || 10 })
                    }
                    className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                  />
                </label>

                {activeQuestion.format === "multiple_choice" ? (
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                      URL imagen (opcional)
                    </span>
                    <input
                      value={activeQuestion.imageUrl ?? ""}
                      onChange={(e) =>
                        patchActive(activeQuestion.id, {
                          imageUrl: e.target.value.trim() || null,
                        } as Partial<LabQuestion>)
                      }
                      className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                    />
                  </label>
                ) : null}

                {activeQuestion.format === "image_trivia" ? (
                  <label className="block space-y-1">
                    <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                      URL imagen
                    </span>
                    <input
                      value={activeQuestion.imageUrl}
                      onChange={(e) => patchActive(activeQuestion.id, { imageUrl: e.target.value })}
                      className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                    />
                  </label>
                ) : null}

                {activeQuestion.format === "guess_selection" ? (
                  <>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        Formación
                      </span>
                      <select
                        value={activeQuestion.formation}
                        onChange={(e) => {
                          const formation = e.target.value as typeof activeQuestion.formation;
                          patchActive(activeQuestion.id, {
                            formation,
                            slots: selectionSlotsForFormation(formation),
                          });
                        }}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      >
                        {FORMATION_IDS.map((id) => (
                          <option key={id} value={id}>
                            {id}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="space-y-2">
                      {activeQuestion.slots.map((slot, index) => (
                        <div key={slot.slotKey} className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                          <input
                            value={slot.clubLabel}
                            onChange={(e) => {
                              const clubLabel = e.target.value;
                              const slots = [...activeQuestion.slots];
                              slots[index] = {
                                ...slot,
                                clubLabel,
                                clubImageUrl: resolveClubCrestUrl(clubLabel) ?? slot.clubImageUrl,
                              };
                              patchActive(activeQuestion.id, { slots });
                            }}
                            placeholder={`Club ${slot.slotKey}`}
                            className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                          />
                          <input
                            value={slot.playerName ?? ""}
                            onChange={(e) => {
                              const slots = [...activeQuestion.slots];
                              slots[index] = {
                                ...slot,
                                playerName: e.target.value,
                              };
                              patchActive(activeQuestion.id, { slots });
                            }}
                            placeholder={`Jugador ${slot.slotKey}`}
                            className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                          />
                          <input
                            value={slot.clubImageUrl ?? ""}
                            onChange={(e) => {
                              const slots = [...activeQuestion.slots];
                              slots[index] = {
                                ...slot,
                                clubImageUrl: e.target.value.trim() || null,
                              };
                              patchActive(activeQuestion.id, { slots });
                            }}
                            placeholder="URL escudo (auto)"
                            className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-xs text-[var(--lab-fg)]"
                          />
                        </div>
                      ))}
                    </div>
                  </>
                ) : null}

                {isLabPlayerCropQuestion(activeQuestion) ? (
                  <>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        URL imagen (recorte)
                      </span>
                      <input
                        value={activeQuestion.imageUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { imageUrl: e.target.value })}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        Contexto (opcional)
                      </span>
                      <input
                        value={activeQuestion.sceneHint ?? ""}
                        onChange={(e) =>
                          patchActive(activeQuestion.id, {
                            sceneHint: e.target.value.trim() || null,
                          } as Partial<LabQuestion>)
                        }
                        placeholder="Mundial 2002, Champions..."
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                  </>
                ) : null}

                {isLabPlayerSilhouetteQuestion(activeQuestion) ? (
                  <>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        URL foto con silueta
                      </span>
                      <input
                        value={activeQuestion.imageUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { imageUrl: e.target.value })}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        URL foto revelada (opcional)
                      </span>
                      <input
                        value={activeQuestion.revealImageUrl ?? ""}
                        onChange={(e) =>
                          patchActive(activeQuestion.id, {
                            revealImageUrl: e.target.value.trim() || null,
                          } as Partial<LabQuestion>)
                        }
                        placeholder="Sin silueta, al resolver"
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        Escena / momento
                      </span>
                      <input
                        value={activeQuestion.sceneLabel}
                        onChange={(e) => patchActive(activeQuestion.id, { sceneLabel: e.target.value })}
                        placeholder="Euro 2008 — España"
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                  </>
                ) : null}

                {activeQuestion.format === "video_play_end" ? (
                  <>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        URL vídeo
                      </span>
                      <input
                        value={activeQuestion.videoUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { videoUrl: e.target.value })}
                        placeholder={LAB_DEMO_VIDEO_SRC}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                      <p className="text-[10px] text-[var(--lab-muted)]">
                        Recomendado: vídeo local en /public (p. ej. {LAB_DEMO_VIDEO_SRC})
                      </p>
                    </label>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        Corte (segundos)
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        step={0.5}
                        value={activeQuestion.stopAtSeconds}
                        onChange={(e) =>
                          patchActive(activeQuestion.id, { stopAtSeconds: Number(e.target.value) || 3 })
                        }
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                  </>
                ) : null}

                <div className="space-y-2">
                  <p className="text-[10px] uppercase text-[var(--lab-muted)]">Opciones</p>
                  {activeQuestion.options.map((option, index) => (
                    <div key={option.id} className="flex gap-2">
                      <input
                        value={option.label}
                        onChange={(e) => {
                          const options = [...activeQuestion.options];
                          options[index] = { ...option, label: e.target.value };
                          patchActive(activeQuestion.id, { options });
                        }}
                        className="min-h-10 flex-1 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                      <button
                        type="button"
                        onClick={() => patchActive(activeQuestion.id, { correctOptionId: option.id })}
                        className={cn(
                          "min-h-10 shrink-0 rounded-lg border px-3 text-[10px] font-bold uppercase",
                          activeQuestion.correctOptionId === option.id
                            ? "border-[var(--lab-accent)] text-[var(--lab-fg)]"
                            : "border-[var(--lab-border)] text-[var(--lab-muted)]"
                        )}
                      >
                        OK
                      </button>
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border border-[var(--lab-border)] bg-black/30 p-3">
                  <p className="mb-2 text-[10px] uppercase text-[var(--lab-muted)]">Vista previa</p>
                  <LabQuestionPreview question={activeQuestion} mode="editor" />
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 py-4">
          {playQuestion ? (
            <>
              <div className="mb-3 flex items-center justify-between text-[10px] uppercase tracking-wider text-[var(--lab-muted)]">
                <span>
                  Pregunta {playIndex + 1} / {draft.questions.length}
                </span>
                <span>{LAB_FORMAT_LABELS[playQuestion.format]}</span>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <LabQuestionPreview
                  question={playQuestion}
                  mode="play"
                  selectedOptionId={selectedOptionId}
                  secondsLeft={secondsLeft}
                  showFeedback={showFeedback}
                  onSelect={handlePlaySelect}
                />
              </div>
              {showFeedback ? (
                <button
                  type="button"
                  onClick={nextPlayQuestion}
                  className="mt-4 min-h-12 shrink-0 rounded-xl border border-[var(--lab-accent)] bg-[var(--lab-surface)] font-display text-sm uppercase tracking-wider text-[var(--lab-fg)]"
                >
                  {playIndex + 1 >= draft.questions.length ? "Volver al editor" : "Siguiente"}
                </button>
              ) : null}
            </>
          ) : (
            <p className="text-center text-sm text-[var(--lab-muted)]">No hay preguntas.</p>
          )}
        </div>
      )}
    </LabShell>
  );
}
