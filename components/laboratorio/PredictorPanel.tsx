"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from "react";
import { Loader2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type PredictorChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type PredictorPanelProps = {
  open: boolean;
  onClose: () => void;
};

function createMessageId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

async function streamPredictorReply(
  messages: Array<{ role: "user" | "assistant"; content: string }>,
  onChunk: (accumulated: string) => void,
): Promise<string> {
  const response = await fetch("/api/laboratorio/predict", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    throw new Error(detail || "No se pudo obtener la prediccion.");
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error("La respuesta no incluye streaming.");
  }

  const decoder = new TextDecoder();
  let accumulated = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    accumulated += decoder.decode(value, { stream: true });
    onChunk(accumulated);
  }

  accumulated += decoder.decode();
  onChunk(accumulated);

  return accumulated.trim();
}

export function PredictorPanel({ open, onClose }: PredictorPanelProps) {
  const [messages, setMessages] = useState<PredictorChatMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [streamingText, setStreamingText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    const frame = requestAnimationFrame(() => {
      inputRef.current?.focus();
      scrollToBottom();
    });

    return () => cancelAnimationFrame(frame);
  }, [open, messages, streamingText, scrollToBottom]);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function handleEscape(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [open, onClose]);

  async function handleSubmit(event?: FormEvent) {
    event?.preventDefault();

    const trimmed = draft.trim();
    if (!trimmed || isStreaming) {
      return;
    }

    const userMessage: PredictorChatMessage = {
      id: createMessageId(),
      role: "user",
      content: trimmed,
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setDraft("");
    setError(null);
    setStreamingText("");
    setIsStreaming(true);

    const payload = nextMessages.map(({ role, content }) => ({ role, content }));

    try {
      const assistantContent = await streamPredictorReply(payload, setStreamingText);
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: assistantContent,
        },
      ]);
      setStreamingText("");
    } catch (submitError) {
      const message =
        submitError instanceof Error
          ? submitError.message
          : "Error inesperado al consultar el asistente.";
      setError(message);
      setStreamingText("");
    } finally {
      setIsStreaming(false);
    }
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  if (!open) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 z-[110] flex items-end justify-end p-3 pb-[calc(var(--tab-bar-height,72px)+12px)] sm:p-4"
      role="presentation"
    >
      <button
        type="button"
        aria-label="Cerrar asistente de predicciones"
        className="absolute inset-0 bg-[#2a1058]/45 backdrop-blur-sm"
        onClick={onClose}
      />

      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="predictor-panel-title"
        className={cn(
          "relative z-10 flex w-full max-w-md flex-col overflow-hidden rounded-xl border border-[var(--tm-border)]",
          "bg-[var(--tm-glass)] shadow-[var(--tm-shadow-soft)] backdrop-blur-xl",
          "max-h-[min(72dvh,calc(100dvh-var(--tab-bar-height,72px)-2.5rem))]",
          "transition-all duration-200 ease-out"
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-[var(--tm-border)] px-4 py-3">
          <div className="min-w-0">
            <p
              id="predictor-panel-title"
              className="truncate text-sm font-semibold text-[var(--tm-fg)]"
            >
              Asistente de predicciones
            </p>
            <p className="truncate text-xs text-[var(--tm-muted)]">
              Marcador, MVP y probabilidades con datos actuales
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar panel"
            className="flex size-12 shrink-0 items-center justify-center rounded-xl text-[var(--tm-muted)] transition-colors hover:bg-white/5 hover:text-[var(--tm-fg)]"
          >
            <X className="size-5" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
            {messages.length === 0 && !streamingText ? (
              <div className="rounded-xl border border-[var(--tm-border-subtle)] bg-white/5 px-4 py-3 text-sm leading-relaxed text-[var(--tm-muted)]">
                Pregunta por un partido concreto o deja que interprete el choque mas relevante de hoy.
                Siempre te devuelvo marcador, MVP y probabilidades.
              </div>
            ) : null}

            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[88%] rounded-xl px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap",
                    message.role === "user"
                      ? "bg-[var(--tm-accent)] text-[var(--tm-primary-fg)]"
                      : "border border-[var(--tm-border-subtle)] bg-white/6 text-[var(--tm-fg)]"
                  )}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {streamingText ? (
              <div className="flex justify-start">
                <div className="max-w-[88%] rounded-xl border border-[var(--tm-border-subtle)] bg-white/6 px-3 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-[var(--tm-fg)]">
                  {streamingText}
                  <span className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-[var(--tm-accent)] align-middle" />
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="rounded-xl border border-[var(--tm-danger)]/35 bg-[var(--tm-danger)]/10 px-3 py-2 text-sm text-[var(--tm-danger)]" role="alert">
                {error}
              </p>
            ) : null}

            <div ref={scrollAnchorRef} aria-hidden className="h-px shrink-0" />
          </div>

          <form
            onSubmit={handleSubmit}
            className="shrink-0 border-t border-[var(--tm-border)] p-3"
          >
            <div className="flex items-end gap-2">
              <label className="sr-only" htmlFor="predictor-chat-input">
                Escribe tu pregunta
              </label>
              <textarea
                id="predictor-chat-input"
                ref={inputRef}
                rows={2}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleInputKeyDown}
                disabled={isStreaming}
                placeholder="Ej.: ¿Quién gana esta noche?"
                className={cn(
                  "min-h-12 flex-1 resize-none rounded-xl border border-[var(--tm-border)] bg-[#2a1058]/55 px-3 py-3 text-sm text-[var(--tm-fg)]",
                  "placeholder:text-[var(--tm-muted)] focus:border-[var(--tm-accent)] focus:outline-none focus:ring-1 focus:ring-[var(--tm-accent)]/40",
                  "disabled:cursor-not-allowed disabled:opacity-60"
                )}
              />
              <button
                type="submit"
                disabled={isStreaming || !draft.trim()}
                aria-label="Enviar pregunta"
                className={cn(
                  "flex size-12 shrink-0 items-center justify-center rounded-xl bg-[var(--tm-accent)] text-[var(--tm-primary-fg)]",
                  "transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                )}
              >
                {isStreaming ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <Send className="size-5" />
                )}
              </button>
            </div>
          </form>
        </div>
      </section>
    </div>
  );
}
