import { performance } from "perf_hooks";
import * as os from "os";
import { LayoutEngine } from "../lib/lineup/tactical-layout-engine";

const CONSTRAINTS = {
  margins: { side: 2, vertical: 2 },
  spacing: { minHorizontal: 2, minVertical: 2 },
  chipSize: { minScale: 0.3, maxScale: 1.5, baseWidth: 10, baseHeight: 10 },
  nameAreaBounds: { width: 12, height: 4 },
  optimization: { mode: "balanced" as const, maxIterations: 50, tolerance: 0.05 },
  fieldBounds: { xMin: 0, xMax: 100, yMin: 0, yMax: 100, isAwayHalf: false },
};

function createFormation(formation: string, yOffset = 0, yScale = 1) {
  if (formation === "4-3-3") {
    return [
      { id: "GK", role: "GK", referenceX: 50, referenceY: 90 * yScale + yOffset },
      { id: "LB", role: "LB", referenceX: 10, referenceY: 70 * yScale + yOffset },
      { id: "CB1", role: "CB", referenceX: 35, referenceY: 70 * yScale + yOffset },
      { id: "CB2", role: "CB", referenceX: 65, referenceY: 70 * yScale + yOffset },
      { id: "RB", role: "RB", referenceX: 90, referenceY: 70 * yScale + yOffset },
      { id: "CM1", role: "CM", referenceX: 25, referenceY: 45 * yScale + yOffset },
      { id: "CM2", role: "CM", referenceX: 50, referenceY: 45 * yScale + yOffset },
      { id: "CM3", role: "CM", referenceX: 75, referenceY: 45 * yScale + yOffset },
      { id: "LW", role: "LW", referenceX: 15, referenceY: 20 * yScale + yOffset },
      { id: "ST", role: "ST", referenceX: 50, referenceY: 20 * yScale + yOffset },
      { id: "RW", role: "RW", referenceX: 85, referenceY: 20 * yScale + yOffset },
    ];
  }
  if (formation === "3-5-2") {
    return [
      { id: "GK", role: "GK", referenceX: 50, referenceY: 90 * yScale + yOffset },
      { id: "CB1", role: "CB", referenceX: 25, referenceY: 70 * yScale + yOffset },
      { id: "CB2", role: "CB", referenceX: 50, referenceY: 70 * yScale + yOffset },
      { id: "CB3", role: "CB", referenceX: 75, referenceY: 70 * yScale + yOffset },
      { id: "LWB", role: "LWB", referenceX: 10, referenceY: 55 * yScale + yOffset },
      { id: "CM1", role: "CM", referenceX: 35, referenceY: 45 * yScale + yOffset },
      { id: "CDM", role: "CDM", referenceX: 50, referenceY: 55 * yScale + yOffset },
      { id: "CM2", role: "CM", referenceX: 65, referenceY: 45 * yScale + yOffset },
      { id: "RWB", role: "RWB", referenceX: 90, referenceY: 55 * yScale + yOffset },
      { id: "ST1", role: "ST", referenceX: 35, referenceY: 20 * yScale + yOffset },
      { id: "ST2", role: "ST", referenceX: 65, referenceY: 20 * yScale + yOffset },
    ];
  }
  // Crowded wing
  if (formation === "crowded-wing") {
    return Array.from({ length: 11 }).map((_, i) => ({
      id: `P${i}`, role: "CM", referenceX: 10, referenceY: 10 + i * 5
    }));
  }
  return [];
}

async function runScenario(name: string, inputs: any[], constraints: any, iterations: number) {
  const times: number[] = [];
  
  // Warmup
  for(let i=0; i<10; i++) {
    LayoutEngine.calculate(inputs, constraints);
  }

  // Benchmark
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    LayoutEngine.calculate(inputs, constraints);
    times.push(performance.now() - start);
  }

  times.sort((a, b) => a - b);
  
  const sum = times.reduce((a, b) => a + b, 0);
  const avg = sum / times.length;
  const min = times[0];
  const max = times[times.length - 1];
  const p50 = times[Math.floor(times.length * 0.50)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  
  const variance = times.reduce((acc, val) => acc + Math.pow(val - avg, 2), 0) / times.length;
  const stdDev = Math.sqrt(variance);

  console.log(`\n=== Scenario: ${name} ===`);
  console.log(`Iterations: ${iterations}`);
  console.log(`Avg: ${avg.toFixed(2)} ms`);
  console.log(`Min: ${min.toFixed(2)} ms | Max: ${max.toFixed(2)} ms`);
  console.log(`P50 (Median): ${p50.toFixed(2)} ms`);
  console.log(`P95: ${p95.toFixed(2)} ms | P99: ${p99.toFixed(2)} ms`);
  console.log(`StdDev: ${stdDev.toFixed(2)} ms`);
  
  return { avg, min, max, p50, p95, p99, stdDev };
}

async function main() {
  console.log("=========================================");
  console.log("  TACTICAL LAYOUT ENGINE - BENCHMARK");
  console.log("=========================================");
  console.log(`Node.js Version: ${process.version}`);
  console.log(`OS: ${os.type()} ${os.release()} (${os.arch()})`);
  console.log(`CPU: ${os.cpus()[0]?.model} (${os.cpus().length} cores)`);
  console.log("-----------------------------------------");

  const iterations = 1000;
  
  // Scenario 1: 1 Team (Half Field)
  await runScenario("1 Team 4-3-3 (Half Field)", createFormation("4-3-3", 50, 0.5), {
    ...CONSTRAINTS,
    fieldBounds: { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false }
  }, iterations);

  // Scenario 2: Dense 1 Team (Half Field)
  await runScenario("1 Team 3-5-2 (Half Field)", createFormation("3-5-2", 50, 0.5), {
    ...CONSTRAINTS,
    fieldBounds: { xMin: 0, xMax: 100, yMin: 50, yMax: 100, isAwayHalf: false }
  }, iterations);

  // Scenario 3: 2 Teams (Full Field)
  const home = createFormation("4-3-3", 50, 0.5);
  const away = createFormation("3-5-2", 0, 0.5).map(p => ({ ...p, id: `AWAY_${p.id}` }));
  await runScenario("2 Teams (4-3-3 vs 3-5-2 Full Field)", [...home, ...away], CONSTRAINTS, iterations);

  // Scenario 4: Extreme edge case (Crowded wing)
  await runScenario("Extreme: All 11 players crowded on left wing", createFormation("crowded-wing", 0, 1), CONSTRAINTS, iterations);
}

main().catch(console.error);
