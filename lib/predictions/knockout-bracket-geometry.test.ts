import { describe, expect, it } from "vitest";
import {
  bracketGridRowCenter,
  buildBracketConnectorPaths,
  buildBracketGeometry,
  COL_FINAL_AWAY,
  COL_FINAL_HOME,
  COL_R32_LEFT,
  COL_R32_RIGHT,
  gridRowToPercentY,
} from "./knockout-bracket-geometry";

describe("bracket grid guide (invisible layout)", () => {
  it("assigns r32 rows 1,3,5,7,9,11,13,15", () => {
    expect(
      [0, 1, 2, 3, 4, 5, 6, 7].map((slot) => bracketGridRowCenter(0, slot))
    ).toEqual([1, 3, 5, 7, 9, 11, 13, 15]);
  });

  it("assigns r16 rows 2,6,10,14", () => {
    expect([0, 1, 2, 3].map((slot) => bracketGridRowCenter(1, slot))).toEqual([
      2, 6, 10, 14,
    ]);
  });

  it("assigns qf rows 4 and 12", () => {
    expect([0, 1].map((slot) => bracketGridRowCenter(2, slot))).toEqual([4, 12]);
  });

  it("assigns sf and final to row 8", () => {
    expect(bracketGridRowCenter(3, 0)).toBe(8);
  });

  it("maps grid rows monotonically to canvas Y", () => {
    const y1 = gridRowToPercentY(1);
    const y8 = gridRowToPercentY(8);
    const y15 = gridRowToPercentY(15);
    expect(y1).toBeLessThan(y8);
    expect(y8).toBeLessThan(y15);
  });

  it("places bracket sides on columns A and J with final on E/F", () => {
    const geoms = buildBracketGeometry();
    const leftR32 = geoms.filter((g) => g.round === "r32" && g.side === "left");
    const rightR32 = geoms.filter((g) => g.round === "r32" && g.side === "right");
    const final = geoms.find((g) => g.round === "final");

    expect(leftR32).toHaveLength(8);
    expect(rightR32).toHaveLength(8);
    expect(leftR32.every((g) => g.column === COL_R32_LEFT)).toBe(true);
    expect(rightR32.every((g) => g.column === COL_R32_RIGHT)).toBe(true);

    expect(final?.homeX).toBeDefined();
    expect(final?.awayX).toBeDefined();
    expect(final?.column).toBe(COL_FINAL_HOME);
    expect(final?.homeX).not.toBe(final?.awayX);

    const leftSf = geoms.find((g) => g.matchNumber === 101);
    const rightSf = geoms.find((g) => g.matchNumber === 102);
    expect(leftSf?.column).toBe(3);
    expect(rightSf?.column).toBe(6);
    expect(final?.homeX).toBeLessThan(final?.awayX ?? 0);
    expect(final?.homeX).toBeGreaterThan(leftSf?.columnX ?? 0);
    expect(final?.awayX).toBeLessThan(rightSf?.columnX ?? 100);
  });

  it("generates inter-round connector segments for the full bracket", () => {
    const geoms = buildBracketGeometry();
    const segments = buildBracketConnectorPaths(geoms);

    expect(segments.length).toBeGreaterThan(60);
    expect(segments.some((segment) => segment.variant === "pair")).toBe(true);
    expect(segments.some((segment) => segment.variant === "final")).toBe(true);
    expect(segments.every((segment) => segment.d.startsWith("M"))).toBe(true);
  });
});
