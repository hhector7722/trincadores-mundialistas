import { describe, expect, it } from "vitest";
import { computeMvpFieldChipScale } from "./mvp-field-chip-scale";

describe("computeMvpFieldChipScale", () => {
  it("aplica escala máxima segura según tamaño del campo", () => {
    const scale = computeMvpFieldChipScale(360, 200);
    expect(scale).toBeGreaterThanOrEqual(0.38);
    expect(scale).toBeLessThanOrEqual(0.78);
  });

  it("reduce escala en campos estrechos para evitar solapamientos", () => {
    const wide = computeMvpFieldChipScale(400, 220);
    const narrow = computeMvpFieldChipScale(280, 160);
    expect(narrow).toBeLessThanOrEqual(wide);
  });
});
