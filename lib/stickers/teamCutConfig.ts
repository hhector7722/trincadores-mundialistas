export type TeamCutConfig = {
  /** 
   * Caja de extracción para la mitad trasera (donde va el dorsal).
   * Si no se especifica, se asume un corte perfecto al 50% derecho.
   */
  back: { left: number; top: number; width: number; height: number } | null;
  /** 
   * Caja de extracción para la mitad delantera (sin dorsal).
   * Si no se especifica, se asume un corte perfecto al 50% izquierdo.
   */
  front: { left: number; top: number; width: number; height: number } | null;
};

/**
 * Tabla de calibración manual para recortar la delantera y trasera de cada camiseta.
 * Las dimensiones originales varían por equipo (ej. algunas son 1536x1024, otras 1609x977).
 * Rellena los valores correctos tras inspeccionar visualmente cada PNG.
 */
export const TEAM_CUT_CONFIGS: Record<string, TeamCutConfig> = {
  argentina: { back: { left: 768, top: 60, width: 733, height: 942 }, front: { left: 34, top: 62, width: 734, height: 937 } },
  belgica: { 
    back: { left: 768, top: 69, width: 768, height: 955 },
    front: { left: 14, top: 66, width: 754, height: 958 }
  },
  brasil: { back: { left: 768, top: 70, width: 752, height: 954 }, front: { left: 11, top: 72, width: 757, height: 948 } },
  canada: { 
    back: { left: 768, top: 76, width: 720, height: 922 },
    front: { left: 55, top: 71, width: 713, height: 927 }
  },
  colombia: { back: { left: 804, top: 42, width: 805, height: 935 }, front: { left: 20, top: 38, width: 784, height: 939 } },
  egipto: { back: { left: 768, top: 84, width: 714, height: 910 }, front: { left: 49, top: 84, width: 719, height: 903 } },
  españa: { 
    back: { left: 771, top: 23, width: 771, height: 997 },
    front: { left: 32, top: 24, width: 739, height: 996 }
  },
  francia: { back: { left: 742, top: 107, width: 705, height: 845 }, front: { left: 65, top: 105, width: 677, height: 848 } },
  inglaterra: { 
    back: { left: 768, top: 54, width: 768, height: 970 },
    front: { left: 2, top: 49, width: 766, height: 975 }
  },
  marruecos: { back: { left: 768, top: 64, width: 758, height: 960 }, front: { left: 9, top: 59, width: 759, height: 965 } },
  mejico: { back: { left: 768, top: 73, width: 755, height: 949 }, front: { left: 0, top: 71, width: 768, height: 952 } },
  noruega: { back: { left: 757, top: 64, width: 727, height: 948 }, front: { left: 23, top: 66, width: 734, height: 947 } },
  paraguay: { back: { left: 768, top: 69, width: 718, height: 933 }, front: { left: 44, top: 70, width: 724, height: 932 } },
  potugal: { 
    back: { left: 768, top: 67, width: 734, height: 941 },
    front: { left: 66, top: 67, width: 702, height: 942 }
  },
  suiza: { back: { left: 768, top: 79, width: 707, height: 907 }, front: { left: 55, top: 79, width: 713, height: 907 } },
  usa: { back: { left: 768, top: 60, width: 765, height: 964 }, front: { left: 0, top: 66, width: 768, height: 958 } }
};

/** Dimensiones normalizadas del canvas final (back y front) para mantener consistencia. */
export const NORMALIZED_CANVAS = {
  width: 600,
  height: 800,
};
