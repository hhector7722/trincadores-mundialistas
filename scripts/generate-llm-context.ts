import { writeLlMContext } from "./llm-context/generate.ts";

const { path: outPath, lines } = writeLlMContext();
console.log(`✓ llm_context.md generado (${lines} líneas)`);
console.log(`  → ${outPath}`);
