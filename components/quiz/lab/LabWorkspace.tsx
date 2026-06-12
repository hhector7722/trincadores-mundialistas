"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, Play, Plus, RotateCcw, Save, Trash2 } from "lucide-react";
import { LabQuestionPreview } from "@/components/quiz/lab/formats/LabQuestionPreview";
import { LabShell } from "@/components/quiz/lab/LabShell";
import { FORMATION_SLOT_ANCHORS } from "@/lib/lineup/formation-coordinates";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { createLabQuestion } from "@/lib/quiz/lab/defaults";
import { readLabDraft, resetLabDraft, writeLabDraft } from "@/lib/quiz/lab/storage";
import {
  LAB_FORMAT_DESCRIPTIONS,
  LAB_FORMAT_LABELS,
  LAB_QUESTION_FORMATS,
  type LabDraft,
  type LabQuestion,
  type LabQuestionFormat,
} from "@/lib/quiz/lab/types";
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

  const activeQuestion =
    draft.questions.find((q) => q.id === activeQuestionId) ?? draft.questions[0] ?? null;
  const playQuestion = draft.questions[playIndex] ?? null;

  const persist = useCallback((next: LabDraft) => {
    setDraft(next);
    writeLabDraft(next);
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

  function addQuestion(format: LabQuestionFormat) {
    const question = createLabQuestion(format);
    const next = { ...draft, questions: [...draft.questions, question] };
    persist(next);
    setActiveQuestionId(question.id);
  }

  function removeQuestion(id: string) {
    const next = { ...draft, questions: draft.questions.filter((q) => q.id !== id) };
    persist(next);
    if (activeQuestionId === id) {
      setActiveQuestionId(next.questions[0]?.id ?? null);
    }
  }

  function moveQuestion(id: string, direction: -1 | 1) {
    const index = draft.questions.findIndex((q) => q.id === id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= draft.questions.length) return;
    const questions = [...draft.questions];
    const [item] = questions.splice(index, 1);
    questions.splice(target, 0, item);
    persist({ ...draft, questions });
  }

  function patchActive(patch: Partial<LabQuestion>) {
    if (!activeQuestion) return;
    persist(updateQuestion(draft, activeQuestion.id, patch));
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

                <label className="block space-y-1">
                  <span className="text-[10px] uppercase text-[var(--lab-muted)]">Enunciado</span>
                  <input
                    value={activeQuestion.prompt}
                    onChange={(e) => patchActive({ prompt: e.target.value })}
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
                      patchActive({ timerSeconds: Number(e.target.value) || 10 })
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
                        patchActive({
                          imageUrl: e.target.value.trim() || null,
                        } as Partial<LabQuestion>)
                      }
                      className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                    />
                  </label>
                ) : null}

                {activeQuestion.format === "guess_image" ? (
                  <>
                    <label className="block space-y-1">
                      <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                        URL imagen
                      </span>
                      <input
                        value={activeQuestion.imageUrl}
                        onChange={(e) => patchActive({ imageUrl: e.target.value })}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className="block space-y-1">
                        <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                          Blur inicial (px)
                        </span>
                        <input
                          type="number"
                          min={0}
                          max={40}
                          value={activeQuestion.blurStartPx}
                          onChange={(e) =>
                            patchActive({ blurStartPx: Number(e.target.value) || 0 })
                          }
                          className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                        />
                      </label>
                      <label className="block space-y-1">
                        <span className="text-[10px] uppercase text-[var(--lab-muted)]">
                          Revelar en (s)
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={30}
                          value={activeQuestion.revealSeconds}
                          onChange={(e) =>
                            patchActive({ revealSeconds: Number(e.target.value) || 8 })
                          }
                          className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                        />
                      </label>
                    </div>
                  </>
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
                          const anchors = FORMATION_SLOT_ANCHORS[formation];
                          const slots = anchors.map((anchor, index) => {
                            const prev = activeQuestion.slots[index];
                            return {
                              slotKey: anchor.key,
                              clubLabel: prev?.clubLabel ?? `Club ${index + 1}`,
                              clubImageUrl: prev?.clubImageUrl ?? null,
                            };
                          });
                          patchActive({ formation, slots });
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
                        <div key={slot.slotKey} className="grid grid-cols-2 gap-2">
                          <input
                            value={slot.clubLabel}
                            onChange={(e) => {
                              const slots = [...activeQuestion.slots];
                              slots[index] = { ...slot, clubLabel: e.target.value };
                              patchActive({ slots });
                            }}
                            placeholder={`Club ${slot.slotKey}`}
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
                              patchActive({ slots });
                            }}
                            placeholder="URL escudo (opc.)"
                            className="rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-xs text-[var(--lab-fg)]"
                          />
                        </div>
                      ))}
                    </div>
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
                        onChange={(e) => patchActive({ videoUrl: e.target.value })}
                        className="w-full rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
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
                          patchActive({ stopAtSeconds: Number(e.target.value) || 3 })
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
                          patchActive({ options });
                        }}
                        className="min-h-10 flex-1 rounded-lg border border-[var(--lab-border)] bg-[var(--lab-surface)] px-3 py-2 text-sm text-[var(--lab-fg)]"
                      />
                      <button
                        type="button"
                        onClick={() => patchActive({ correctOptionId: option.id })}
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
