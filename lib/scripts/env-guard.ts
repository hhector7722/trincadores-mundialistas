const PROJECT_REF = "savsnkgpvvmdbaujqqoa";

export function getProjectRef(): string | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (!url) return null;
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

export function assertProjectRef(): void {
  const ref = getProjectRef();
  if (ref !== PROJECT_REF) {
    throw new Error(
      `Proyecto Supabase incorrecto (ref=${ref ?? "?"}, esperado=${PROJECT_REF}). Abortando.`
    );
  }
}

export function assertServiceEnv(): void {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY.");
  }
  assertProjectRef();
}


export function assertPurgeConfirmed(): void {
  if (process.env.CONFIRM_PURGE !== "1") {
    throw new Error("Purga bloqueada. Ejecuta con CONFIRM_PURGE=1.");
  }
}

export function assertBootstrapAllowed(): void {
  if (process.env.ALLOW_BOOTSTRAP !== "1") {
    throw new Error("Bootstrap bloqueado. Ejecuta con ALLOW_BOOTSTRAP=1.");
  }
}

export function assertImportAllowed(): void {
  if (process.env.ALLOW_IMPORT !== "1") {
    throw new Error("Import bloqueado. Ejecuta con ALLOW_IMPORT=1.");
  }
}

export function assertQuizSeedAllowed(): void {
  if (process.env.ALLOW_QUIZ_SEED !== "1") {
    throw new Error("Seed de quiz bloqueado. Ejecuta con ALLOW_QUIZ_SEED=1.");
  }
}
