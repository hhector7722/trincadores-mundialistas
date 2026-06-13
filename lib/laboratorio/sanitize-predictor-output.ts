/** Limpia markdown, enlaces y citas que el modelo pueda colar en texto plano. */
export function sanitizePredictorOutput(text: string): string {
  let result = text;

  result = result.replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
  result = result.replace(/\*\*([^*]+)\*\*/g, "$1");
  result = result.replace(/__([^_]+)__/g, "$1");
  result = result.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, "$1");
  result = result.replace(/_([^_]+)_/g, "$1");
  result = result.replace(/https?:\/\/\S+/g, "");
  result = result.replace(/www\.\S+/gi, "");
  result = result.replace(
    /\s*\([^)]*(?:https?:\/\/|www\.|\.com\b|\.es\b|\.org\b|\.net\b|reddit|sofascore|ussoccer|fifa|uefa|espn|marca|as\.com|goal\.com)[^)]*\)/gi,
    "",
  );
  result = result.replace(
    /\s*\[[^\]]*(?:\.com|\.es|\.org|https?:\/\/|www\.)[^\]]*\]/gi,
    "",
  );
  result = result.replace(/\s+[a-z0-9][-a-z0-9]*\.(com|es|org|net|co)(?:\/\S*)?/gi, "");
  result = result.replace(/^\s*(?:fuente|fuentes|source|según|via)\s*:\s*.+$/gim, "");
  result = result.replace(/utm_source=\S+/g, "");
  result = result.replace(/\s*\(\s*\)/g, "");
  result = result.replace(/[ \t]{2,}/g, " ");
  result = result.replace(/\n{3,}/g, "\n\n");

  return result.trim();
}
