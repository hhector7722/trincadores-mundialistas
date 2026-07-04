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
  argentina: { back: null, front: null },
  belgica: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 0, top: 0, width: 740, height: 1024 }
  },
  brasil: { back: null, front: null },
  canada: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 0, top: 0, width: 740, height: 1024 }
  },
  colombia: { back: null, front: null },
  egipto: { back: null, front: null },
  españa: { 
    back: { left: 810, top: 0, width: 732, height: 1020 },
    front: { left: 0, top: 0, width: 730, height: 1020 }
  },
  francia: { back: null, front: null },
  inglaterra: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 0, top: 0, width: 740, height: 1024 }
  },
  marruecos: { back: null, front: null },
  mejico: { back: null, front: null },
  noruega: { back: null, front: null },
  paraguay: { back: null, front: null },
  potugal: { 
    back: { left: 795, top: 0, width: 741, height: 1024 },
    front: { left: 0, top: 0, width: 740, height: 1024 }
  },
  suiza: { back: null, front: null },
  usa: { back: null, front: null },
};

/** Dimensiones normalizadas del canvas final (back y front) para mantener consistencia. */
export const NORMALIZED_CANVAS = {
  width: 600,
  height: 800,
};
