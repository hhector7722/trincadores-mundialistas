"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Play, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { LabQuestionPreview } from "@/components/quiz/lab/formats/LabQuestionPreview";
import { LabShell } from "@/components/quiz/lab/LabShell";
import { FORMATION_IDS } from "@/lib/lineup/formation-coordinates";
import { resolveClubCrestUrl } from "@/lib/quiz/lab/club-crests";
import { LAB_DEMO_VIDEO_SRC } from "@/lib/quiz/lab/demo-video";
import { createLabQuestionStub } from "@/lib/quiz/lab/defaults";
import { generateLabQuestionContent } from "@/lib/quiz/lab/generate-content.client";
import { selectionSlotsForFormation } from "@/lib/quiz/lab/hydrate";
import {
  canGenerateLabQuestion,
  labQuestionIsReady,
} from "@/lib/quiz/lab/question-status";
import { readLabDraft, resetLabDraft, writeLabDraft } from "@/lib/quiz/lab/storage";
import {
  isLabPlayerCropQuestion,
  isLabPlayerSilhouetteQuestion,
  LAB_FORMAT_LABELS,
  LAB_QUESTION_FORMATS,
  type LabDraft,
  type LabQuestion,
  type LabQuestionFormat,
} from "@/lib/quiz/lab/types";
import type { WorldCupMomentDifficulty } from "@/lib/quiz/world-cup-moments";
import { cn } from "@/lib/utils";

type WorkspaceMode = "edit" | "preview";

function statusLabel(question: LabQuestion, generating: boolean) {
  if (generating) return "Generando";
  if (labQuestionIsReady(question)) return "Lista";
  return "Pendiente";
}

function statusColor(question: LabQuestion, generating: boolean) {
  if (generating) return "bg-amber-500";
  if (labQuestionIsReady(question)) return "bg-[var(--lab-accent)]";
  return "bg-[var(--lab-border)]";
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
  const [showSettings, setShowSettings] = useState(false);
  const [generatingIds, setGeneratingIds] = useState<Set<string>>(() => new Set());
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});
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
      setSecondsLeft((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [mode, playQuestion, playIndex, selectedOptionId]);

  const setQuestionGenerating = useCallback((questionId: string, active: boolean) => {
    setGeneratingIds((prev) => {
      const next = new Set(prev);
      if (active) next.add(questionId);
      else next.delete(questionId);
      return next;
    });
  }, []);

  const generateQuestion = useCallback(
    async (question: LabQuestion) => {
      if (!canGenerateLabQuestion(question.format)) return;

      const rotate = labQuestionIsReady(question);
      setQuestionGenerating(question.id, true);
      setQuestionErrors((prev) => {
        const next = { ...prev };
        delete next[question.id];
        return next;
      });

      try {
        const generated = await generateLabQuestionContent(question, {
          minDifficulty: catalogDifficulty,
          force: rotate,
        });
        persist((prev) => ({
          ...prev,
          questions: prev.questions.map((item) =>
            item.id === question.id ? generated : item
          ),
        }));
      } catch (error) {
        setQuestionErrors((prev) => ({
          ...prev,
          [question.id]:
            error instanceof Error ? error.message : "No se pudo generar la pregunta.",
        }));
      } finally {
        setQuestionGenerating(question.id, false);
      }
    },
    [catalogDifficulty, persist, setQuestionGenerating]
  );

  const generateAllQuestions = useCallback(() => {
    for (const question of draft.questions) {
      if (canGenerateLabQuestion(question.format)) {
        void generateQuestion(question);
      }
    }
  }, [draft.questions, generateQuestion]);

  function patchActive(questionId: string, patch: Partial<LabQuestion>) {
    persist((prev) => ({
      ...prev,
      questions: prev.questions.map((q) =>
        q.id === questionId ? ({ ...q, ...patch } as LabQuestion) : q
      ),
    }));
  }

  function addQuestion(format: LabQuestionFormat) {
    const question = createLabQuestionStub(format);
    persist((prev) => ({ ...prev, questions: [...prev.questions, question] }));
    setActiveQuestionId(question.id);
  }

  function removeQuestion(id: string) {
    persist((prev) => {
      const questions = prev.questions.filter((q) => q.id !== id);
      if (activeQuestionId === id) {
        setActiveQuestionId(questions[0]?.id ?? null);
      }
      return { ...prev, questions };
    });
  }

  function startPreview() {
    if (!draft.questions.length) return;
    setMode("preview");
    setPlayIndex(0);
    setSelectedOptionId(null);
    setShowFeedback(false);
  }

  const headerActions = (
    <>
      <button
        type="button"
        onClick={() => setMode("edit")}
        className={cn(
          "tm-lab-btn tm-lab-btn-ghost px-3",
          mode === "edit" && "text-[var(--lab-fg)] underline decoration-[var(--lab-accent)] decoration-2 underline-offset-4"
        )}
      >
        Editar
      </button>
      <button
        type="button"
        onClick={startPreview}
        disabled={!draft.questions.length}
        className={cn(
          "tm-lab-btn tm-lab-btn-ghost inline-flex items-center gap-1.5 px-3",
          mode === "preview" && "text-[var(--lab-fg)] underline decoration-[var(--lab-accent)] decoration-2 underline-offset-4",
          !draft.questions.length && "opacity-40"
        )}
      >
        <Play className="h-3.5 w-3.5" />
        Probar
      </button>
    </>
  );

  if (mode === "preview" && playQuestion) {
    return (
      <LabShell title={draft.title} actions={headerActions}>
        <div className="flex min-h-0 flex-1 flex-col px-4 py-4">
          <p className="mb-3 text-xs text-[var(--lab-muted)]">
            {playIndex + 1} / {draft.questions.length} · {LAB_FORMAT_LABELS[playQuestion.format]}
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto">
            <LabQuestionPreview
              question={playQuestion}
              mode="play"
              selectedOptionId={selectedOptionId}
              secondsLeft={secondsLeft}
              showFeedback={showFeedback}
              onSelect={(id) => {
                if (selectedOptionId) return;
                setSelectedOptionId(id);
                setShowFeedback(true);
              }}
              loading={generatingIds.has(playQuestion.id)}
            />
          </div>
          {showFeedback ? (
            <button
              type="button"
              onClick={() => {
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
              }}
              className="tm-lab-btn tm-lab-btn-primary mt-4 w-full shrink-0"
            >
              {playIndex + 1 >= draft.questions.length ? "Volver al editor" : "Siguiente"}
            </button>
          ) : null}
        </div>
      </LabShell>
    );
  }

  return (
    <LabShell title={draft.title} actions={headerActions}>
      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Lista de preguntas */}
        <aside className="flex shrink-0 flex-col border-b border-[var(--lab-border)] md:w-72 md:border-b-0 md:border-r">
          <div className="flex items-center gap-2 px-4 py-3">
            <button
              type="button"
              onClick={generateAllQuestions}
              disabled={!draft.questions.length}
              className="tm-lab-btn tm-lab-btn-primary inline-flex flex-1 items-center justify-center gap-2 px-3"
            >
              <Sparkles className="h-4 w-4" />
              Generar todas
            </button>
            <button
              type="button"
              onClick={() => {
                const fresh = resetLabDraft();
                setDraft(fresh);
                setActiveQuestionId(fresh.questions[0]?.id ?? null);
              }}
              className="tm-lab-btn tm-lab-btn-ghost px-3"
              aria-label="Resetear borrador"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          </div>

          <nav className="min-h-0 flex-1 overflow-y-auto px-2 pb-2" aria-label="Preguntas del borrador">
            {draft.questions.map((q, index) => {
              const generating = generatingIds.has(q.id);
              const selected = activeQuestionId === q.id;
              return (
                <div
                  key={q.id}
                  className={cn(
                    "mb-0.5 flex items-center gap-2 rounded-md px-2 py-2",
                    selected && "bg-white/70"
                  )}
                >
                  <button
                    type="button"
                    onClick={() => setActiveQuestionId(q.id)}
                    className="flex min-w-0 flex-1 items-start gap-2 text-left"
                  >
                    <span
                      className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", statusColor(q, generating))}
                      aria-hidden
                    />
                    <span className="min-w-0">
                      <span className="block text-xs font-medium text-[var(--lab-fg)]">
                        {index + 1}. {LAB_FORMAT_LABELS[q.format]}
                      </span>
                      <span className="block truncate text-[11px] text-[var(--lab-muted)]">
                        {statusLabel(q, generating)}
                        {questionErrors[q.id] ? ` · ${questionErrors[q.id]}` : ""}
                      </span>
                    </span>
                  </button>
                  {canGenerateLabQuestion(q.format) ? (
                    <button
                      type="button"
                      disabled={generating}
                      onClick={() => void generateQuestion(q)}
                      className="tm-lab-btn tm-lab-btn-ghost shrink-0 px-2 text-[11px]"
                    >
                      {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gen."}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removeQuestion(q.id)}
                    className="shrink-0 p-1 text-[var(--lab-muted)] hover:text-[var(--lab-danger)]"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </nav>

          <div className="border-t border-[var(--lab-border)] px-4 py-3">
            <p className="mb-2 text-[11px] font-medium text-[var(--lab-muted)]">Añadir formato</p>
            <div className="flex flex-wrap gap-1">
              {LAB_QUESTION_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  onClick={() => addQuestion(format)}
                  className="inline-flex items-center gap-1 rounded-md bg-white/80 px-2 py-1 text-[11px] text-[var(--lab-fg)] hover:bg-white"
                >
                  <Plus className="h-3 w-3" />
                  {LAB_FORMAT_LABELS[format]}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Panel principal */}
        <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          {activeQuestion ? (
            <>
              <div className="flex flex-wrap items-center gap-2 border-b border-[var(--lab-border)] px-4 py-3">
                <span className="text-sm font-semibold text-[var(--lab-fg)]">
                  {LAB_FORMAT_LABELS[activeQuestion.format]}
                </span>
                <div className="flex-1" />
                {(activeQuestion.format === "image_trivia" ||
                  activeQuestion.format === "guess_player_hair" ||
                  activeQuestion.format === "guess_player_eyes" ||
                  activeQuestion.format === "guess_player_silhouette" ||
                  activeQuestion.format === "video_play_end") && (
                  <div className="flex gap-1">
                    {(["easy", "medium", "hard"] as const).map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setCatalogDifficulty(level)}
                        className={cn(
                          "rounded-md px-2 py-1 text-[11px] font-medium capitalize",
                          catalogDifficulty === level
                            ? "bg-[var(--lab-accent)] text-white"
                            : "text-[var(--lab-muted)] hover:bg-white/60"
                        )}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
                {canGenerateLabQuestion(activeQuestion.format) ? (
                  <button
                    type="button"
                    disabled={generatingIds.has(activeQuestion.id)}
                    onClick={() => void generateQuestion(activeQuestion)}
                    className="tm-lab-btn tm-lab-btn-primary inline-flex items-center gap-2 px-4"
                  >
                    {generatingIds.has(activeQuestion.id) ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Sparkles className="h-4 w-4" />
                    )}
                    {labQuestionIsReady(activeQuestion) ? "Otra pregunta" : "Generar"}
                  </button>
                ) : null}
              </div>

              {questionErrors[activeQuestion.id] ? (
                <p className="border-b border-[var(--lab-border)] bg-red-50 px-4 py-2 text-xs text-[var(--lab-danger)]">
                  {questionErrors[activeQuestion.id]}
                </p>
              ) : null}

              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
                <LabQuestionPreview
                  question={activeQuestion}
                  mode="editor"
                  loading={generatingIds.has(activeQuestion.id)}
                />
              </div>

              <div className="shrink-0 border-t border-[var(--lab-border)]">
                <button
                  type="button"
                  onClick={() => setShowSettings((v) => !v)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left text-xs font-medium text-[var(--lab-muted)]"
                >
                  Ajustes manuales
                  <span>{showSettings ? "−" : "+"}</span>
                </button>
                {showSettings ? (
                  <div className="space-y-3 border-t border-[var(--lab-border)] px-4 py-3">
                    <label className="block space-y-1 text-xs">
                      <span className="text-[var(--lab-muted)]">Título borrador</span>
                      <input
                        value={draft.title}
                        onChange={(e) => persist({ ...draft, title: e.target.value })}
                        className="w-full px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="text-[var(--lab-muted)]">Enunciado</span>
                      <input
                        value={activeQuestion.prompt}
                        onChange={(e) => patchActive(activeQuestion.id, { prompt: e.target.value })}
                        className="w-full px-3 py-2 text-sm"
                      />
                    </label>
                    <label className="block space-y-1 text-xs">
                      <span className="text-[var(--lab-muted)]">Timer (s)</span>
                      <input
                        type="number"
                        min={5}
                        max={60}
                        value={activeQuestion.timerSeconds}
                        onChange={(e) =>
                          patchActive(activeQuestion.id, {
                            timerSeconds: Number(e.target.value) || 10,
                          })
                        }
                        className="w-full px-3 py-2 text-sm"
                      />
                    </label>

                    {activeQuestion.format === "guess_selection" ? (
                      <>
                        <label className="block space-y-1 text-xs">
                          <span className="text-[var(--lab-muted)]">Formación</span>
                          <select
                            value={activeQuestion.formation}
                            onChange={(e) => {
                              const formation = e.target.value as typeof activeQuestion.formation;
                              patchActive(activeQuestion.id, {
                                formation,
                                slots: selectionSlotsForFormation(formation),
                              });
                            }}
                            className="w-full px-3 py-2 text-sm"
                          >
                            {FORMATION_IDS.map((id) => (
                              <option key={id} value={id}>
                                {id}
                              </option>
                            ))}
                          </select>
                        </label>
                        {activeQuestion.slots.map((slot, index) => (
                          <div key={slot.slotKey} className="grid gap-2 sm:grid-cols-2">
                            <input
                              value={slot.clubLabel}
                              onChange={(e) => {
                                const slots = [...activeQuestion.slots];
                                slots[index] = {
                                  ...slot,
                                  clubLabel: e.target.value,
                                  clubImageUrl:
                                    resolveClubCrestUrl(e.target.value) ?? slot.clubImageUrl,
                                };
                                patchActive(activeQuestion.id, { slots });
                              }}
                              placeholder="Club"
                              className="px-3 py-2 text-sm"
                            />
                            <input
                              value={slot.playerName ?? ""}
                              onChange={(e) => {
                                const slots = [...activeQuestion.slots];
                                slots[index] = { ...slot, playerName: e.target.value };
                                patchActive(activeQuestion.id, { slots });
                              }}
                              placeholder="Jugador"
                              className="px-3 py-2 text-sm"
                            />
                          </div>
                        ))}
                      </>
                    ) : null}

                    {isLabPlayerCropQuestion(activeQuestion) ? (
                      <input
                        value={activeQuestion.imageUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { imageUrl: e.target.value })}
                        placeholder="URL imagen"
                        className="w-full px-3 py-2 text-sm"
                      />
                    ) : null}

                    {isLabPlayerSilhouetteQuestion(activeQuestion) ? (
                      <input
                        value={activeQuestion.imageUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { imageUrl: e.target.value })}
                        placeholder="URL silueta"
                        className="w-full px-3 py-2 text-sm"
                      />
                    ) : null}

                    {activeQuestion.format === "video_play_end" ? (
                      <input
                        value={activeQuestion.videoUrl}
                        onChange={(e) => patchActive(activeQuestion.id, { videoUrl: e.target.value })}
                        placeholder={LAB_DEMO_VIDEO_SRC}
                        className="w-full px-3 py-2 text-sm"
                      />
                    ) : null}

                    <div className="space-y-2">
                      {activeQuestion.options.map((option, index) => (
                        <div key={option.id} className="flex gap-2">
                          <input
                            value={option.label}
                            onChange={(e) => {
                              const options = [...activeQuestion.options];
                              options[index] = { ...option, label: e.target.value };
                              patchActive(activeQuestion.id, { options });
                            }}
                            className="min-h-10 flex-1 px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              patchActive(activeQuestion.id, { correctOptionId: option.id })
                            }
                            className={cn(
                              "min-h-10 shrink-0 rounded-md px-3 text-[11px] font-semibold",
                              activeQuestion.correctOptionId === option.id
                                ? "bg-[var(--lab-accent)] text-white"
                                : "bg-white/80 text-[var(--lab-muted)]"
                            )}
                          >
                            OK
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            </>
          ) : (
            <p className="p-6 text-sm text-[var(--lab-muted)]">No hay preguntas en el borrador.</p>
          )}
        </main>
      </div>
    </LabShell>
  );
}
