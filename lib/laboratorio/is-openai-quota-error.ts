/** Errores de OpenAI por cuota, facturación o créditos agotados. */
export function isOpenAiQuotaOrBillingError(status: number, detail: string): boolean {
  const lower = detail.toLowerCase();

  if (status === 402) {
    return true;
  }

  if (status === 403) {
    return (
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("credit") ||
      lower.includes("insufficient")
    );
  }

  if (status === 429) {
    return (
      lower.includes("insufficient_quota") ||
      lower.includes("quota") ||
      lower.includes("billing") ||
      lower.includes("credit") ||
      lower.includes("exceeded")
    );
  }

  return (
    lower.includes("insufficient_quota") ||
    lower.includes("exceeded your current quota") ||
    lower.includes("credit balance is too low")
  );
}
