import { LayoutElementInput, TacticalBand } from "./types";

export type TacticalLane = "L" | "CL" | "C" | "CR" | "R";

export type StructuredElement = LayoutElementInput & {
  lane: TacticalLane;
};

export type TacticalStructure = {
  bands: TacticalBand[];
  elements: Map<string, StructuredElement>;
};

function assignLane(x: number): TacticalLane {
  if (x < 20) return "L";
  if (x < 40) return "CL";
  if (x <= 60) return "C";
  if (x <= 80) return "CR";
  return "R";
}

export function buildTacticalStructure(
  inputs: LayoutElementInput[],
  isAwayHalf: boolean
): TacticalStructure {
  if (inputs.length === 0) return { bands: [], elements: new Map() };

  const sorted = [...inputs].sort((a, b) => {
    return isAwayHalf ? a.referenceY - b.referenceY : b.referenceY - a.referenceY;
  });

  const bands: TacticalBand[] = [];
  let currentBandElements: LayoutElementInput[] = [sorted[0]];
  let currentBandY = sorted[0].referenceY;
  const BAND_TOLERANCE = 12;

  for (let i = 1; i < sorted.length; i++) {
    const player = sorted[i];
    const diff = Math.abs(player.referenceY - currentBandY);

    if (diff <= BAND_TOLERANCE) {
      currentBandElements.push(player);
      currentBandY =
        currentBandElements.reduce((acc, el) => acc + el.referenceY, 0) /
        currentBandElements.length;
    } else {
      currentBandElements.sort((a, b) => a.referenceX - b.referenceX);
      bands.push({
        id: `band-${bands.length}`,
        depthOrder: bands.length,
        elements: currentBandElements.map((p) => p.id),
      });
      currentBandElements = [player];
      currentBandY = player.referenceY;
    }
  }

  if (currentBandElements.length > 0) {
    currentBandElements.sort((a, b) => a.referenceX - b.referenceX);
    bands.push({
      id: `band-${bands.length}`,
      depthOrder: bands.length,
      elements: currentBandElements.map((p) => p.id),
    });
  }

  const elements = new Map<string, StructuredElement>();
  for (const input of inputs) {
    elements.set(input.id, {
      ...input,
      lane: assignLane(input.referenceX),
    });
  }

  return { bands, elements };
}
