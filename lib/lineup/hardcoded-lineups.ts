import type { FormationId } from "@/lib/lineup/types";

export type HardcodedLineup = {
  formation: FormationId;
  startingNumbers: number[];
};

export const HARDCODED_DEFAULT_LINEUPS: Record<string, HardcodedLineup> = {
  inglaterra: {
    formation: "4-2-3-1",
    startingNumbers: [1, 2, 5, 6, 3, 4, 8, 7, 10, 18, 9], // Pickford, Konsa, Stones, Guehi, O'Reilly, Rice, Anderson, Saka, Bellingham, Gordon, Kane
  },
  méxico: {
    formation: "4-3-3",
    startingNumbers: [1, 2, 3, 5, 23, 7, 6, 19, 25, 9, 16], // Rangel, Sanchez, Montes, Vasquez, Gallardo, Romo, Lira, Mora, Alvarado, Jimenez, Quiñones
  },
  españa: {
    formation: "4-2-3-1",
    startingNumbers: [23, 12, 22, 14, 24, 20, 16, 19, 10, 15, 21], // Simon, Porro, Cubarsi, Laporte, Cucurella, Pedri, Rodri, Lamine Yamal, Olmo, Baena, Oyarzabal
  },
  portugal: {
    formation: "4-2-3-1",
    startingNumbers: [1, 20, 3, 13, 25, 23, 15, 18, 8, 17, 7], // Costa, Cancelo, Dias, Veiga, Mendes, Vitinha, Neves, Neto, Fernandes, Leao, Ronaldo
  },
  "estados unidos": {
    formation: "4-3-3",
    startingNumbers: [24, 16, 3, 13, 5, 17, 4, 8, 2, 20, 10], // Freese, Freeman, Richards, Ream, Robinson, Tillman, Adams, McKennie, Dest, Balogun, Pulisic
  },
  england: {
    formation: "4-2-3-1",
    startingNumbers: [1, 2, 5, 6, 3, 4, 8, 7, 10, 18, 9],
  },
  mexico: {
    formation: "4-3-3",
    startingNumbers: [1, 2, 3, 5, 23, 7, 6, 19, 25, 9, 16],
  },
  spain: {
    formation: "4-2-3-1",
    startingNumbers: [23, 12, 22, 14, 24, 20, 16, 19, 10, 15, 21],
  },
  usa: {
    formation: "4-3-3",
    startingNumbers: [24, 16, 3, 13, 5, 17, 4, 8, 2, 20, 10],
  },
};
