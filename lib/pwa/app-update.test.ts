import assert from "node:assert/strict";
import test from "node:test";
import { getDeploymentVersion } from "./deployment-version";

test("getDeploymentVersion prioriza VERCEL_DEPLOYMENT_ID", () => {
  const previousDeployment = process.env.VERCEL_DEPLOYMENT_ID;
  const previousSha = process.env.VERCEL_GIT_COMMIT_SHA;

  process.env.VERCEL_DEPLOYMENT_ID = "dpl_test123";
  process.env.VERCEL_GIT_COMMIT_SHA = "abcdef1234567890";

  assert.equal(getDeploymentVersion(), "dpl_test123");

  delete process.env.VERCEL_DEPLOYMENT_ID;
  assert.equal(getDeploymentVersion(), "abcdef123456");

  if (previousDeployment) process.env.VERCEL_DEPLOYMENT_ID = previousDeployment;
  else delete process.env.VERCEL_DEPLOYMENT_ID;

  if (previousSha) process.env.VERCEL_GIT_COMMIT_SHA = previousSha;
  else delete process.env.VERCEL_GIT_COMMIT_SHA;
});
