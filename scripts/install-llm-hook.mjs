import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const hooksDir = path.join(root, ".githooks");
const hookPath = path.join(hooksDir, "pre-commit");
const gitDir = path.join(root, ".git");

if (!fs.existsSync(gitDir)) {
  console.log("llm-context: sin repo git, hook omitido");
  process.exit(0);
}

const hookContent = `#!/bin/sh
# Cross-platform: delega en Node (funciona en Windows Git, macOS, Linux)
node scripts/llm-context/pre-commit.mjs
`;

fs.mkdirSync(hooksDir, { recursive: true });
fs.writeFileSync(hookPath, hookContent, "utf8");

try {
  fs.chmodSync(hookPath, 0o755);
} catch {
  // Windows puede ignorar chmod
}

try {
  execSync("git config core.hooksPath .githooks", { cwd: root, stdio: "pipe" });
  console.log("llm-context: hook pre-commit instalado (.githooks/pre-commit)");
} catch (err) {
  console.warn("llm-context: no se pudo configurar git hooksPath:", err.message);
}
