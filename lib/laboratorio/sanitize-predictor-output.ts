/** Limpia markdown y enlaces que el modelo pueda colar en texto plano. */
export function sanitizePredictorOutput(text: string): string {
  let result = text;

  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  result = result.replace(/_([^_]+)_/g, "$1");
  result = result.replace(/\s*\([^)]*https?:\/\/[^)]*\)/g, "");
  result = result.replace(/https?:\/\/\S+/g, "");
  result = result.replace(/utm_source=\S+/g, "");
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}
