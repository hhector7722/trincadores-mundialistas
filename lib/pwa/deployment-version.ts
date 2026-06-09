/** Identificador del deploy actual (Vercel) o fallback local. */
export function getDeploymentVersion(): string {
  return (
    process.env.VERCEL_DEPLOYMENT_ID?.trim() ||
    process.env.VERCEL_GIT_COMMIT_SHA?.trim()?.slice(0, 12) ||
    "local-dev"
  );
}

export const APP_VERSION_STORAGE_KEY = "tm-app-deployment-version";
