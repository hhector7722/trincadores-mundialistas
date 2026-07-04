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
  argentina: { back: null, front: { left: 34, top: 62, width: 734, height: 937 } },
  belgica: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 14, top: 66, width: 754, height: 958 }
  },
  brasil: { back: null, front: { left: 11, top: 72, width: 757, height: 948 } },
  canada: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 55, top: 71, width: 713, height: 927 }
  },
  colombia: { back: null, front: { left: 20, top: 38, width: 784, height: 939 } },
  egipto: { back: null, front: { left: 49, top: 84, width: 719, height: 903 } },
  españa: { 
    back: { left: 810, top: 0, width: 732, height: 1020 },
    front: { left: 32, top: 24, width: 739, height: 996 }
  },
  francia: { back: null, front: { left: 65, top: 105, width: 677, height: 848 } },
  inglaterra: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 2, top: 49, width: 766, height: 975 }
  },
  marruecos: { back: null, front: { left: 9, top: 59, width: 759, height: 965 } },
  mejico: { back: null, front: { left: 0, top: 71, width: 768, height: 952 } },
  noruega: { back: null, front: { left: 23, top: 66, width: 734, height: 947 } },
  paraguay: { back: null, front: { left: 44, top: 70, width: 724, height: 932 } },
  potugal: { 
    back: { left: 785, top: 0, width: 751, height: 1024 },
    front: { left: 66, top: 67, width: 702, height: 942 }
  },
  suiza: { back: null, front: { left: 55, top: 79, width: 713, height: 907 } },
  usa: { back: null, front: { left: 0, top: 66, width: 768, height: 958 } }
};

/** Dimensiones normalizadas del canvas final (back y front) para mantener consistencia. */
export const NORMALIZED_CANVAS = {
  width: 600,
  height: 800,
};
