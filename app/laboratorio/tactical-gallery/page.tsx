import { TacticalVerticalField } from "@/components/lineup/TacticalVerticalField";
import { LayoutEngine } from "@/lib/lineup/tactical-layout-engine";

const FORMATIONS = ["4-3-3", "4-4-2", "4-2-3-1", "4-1-4-1", "3-4-3", "3-4-2-1", "3-5-2", "5-3-2", "5-4-1", "5-2-3"];

import type { ResolvedLineup, PositionRole, FormationId } from "@/lib/lineup/types";

// A mock lineup creator for the gallery
function generateLineup(formation: string, isAway = false): ResolvedLineup {
  const positions = parseFormation(formation);
  
  return {
    formation: formation as FormationId,
    formationLabel: formation,
    slots: positions.map((pos, i) => ({
      key: `P${i}`,
      name: pos.role + (i + 1),
      shirtNumber: i + 1,
      positionLabel: pos.role,
      role: pos.role as PositionRole,
      isPlaceholder: false,
      x: pos.x,
      y: pos.y
    })),
    benchCount: 0,
    isProbable: false,
    sourceKind: "fallback",
    dataSourceCode: null,
    fetchedAt: null
  };
}

function parseFormation(formation: string) {
  const parts = formation.split("-").map(Number);
  
  let positions = [
    { role: "GK", x: 50, y: 90 } // GK always at bottom
  ];
  
  let currentY = 70;
  
  parts.forEach(count => {
    const stepX = 100 / (count + 1);
    for (let i = 0; i < count; i++) {
      positions.push({
        role: getRoleByRow(currentY),
        x: stepX * (i + 1),
        y: currentY
      });
    }
    currentY -= 20;
  });

  return positions;
}

function getRoleByRow(y: number) {
  if (y >= 65) return "DF";
  if (y >= 35) return "MF";
  return "FW";
}

export default function TacticalGallery() {
  return (
    <div className="p-8 bg-zinc-950 text-white min-h-screen">
      <h1 className="text-3xl font-bold mb-8 text-center text-zinc-100">Tactical Layout Engine Gallery</h1>
      <p className="text-zinc-400 text-center max-w-2xl mx-auto mb-12">
        A visual gallery rendering all requested formations through the production rendering pipeline.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12 max-w-7xl mx-auto">
        {FORMATIONS.map(formation => (
          <div key={formation} className="flex flex-col items-center gap-4 bg-zinc-900 rounded-2xl p-6 border border-zinc-800">
            <h2 className="text-xl font-semibold text-zinc-200">{formation}</h2>
            <div className="w-full max-w-sm aspect-[2/3] bg-green-900/20 rounded-lg overflow-hidden border border-green-900/50 relative">
              <TacticalVerticalField 
                homeLineup={generateLineup(formation, false)}
                awayLineup={generateLineup("4-3-3", true)}
                homeTeam="Home Team"
                awayTeam="Away Team"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
