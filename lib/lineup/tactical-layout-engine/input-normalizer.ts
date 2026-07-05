import { LayoutElementInput } from "./types";

/**
 * Valida y normaliza la entrada, asegurando que todos los valores caen dentro de rangos razonables.
 * Devuelve un array con elementos normalizados para que el algoritmo no falle con entradas absurdas.
 */
export function normalizeInput(inputs: LayoutElementInput[]): LayoutElementInput[] {
  return inputs.map((input) => {
    // Asegurarse de que tenemos un id, sino inventar uno
    const id = input.id || `unknown-${Math.random().toString(36).substr(2, 9)}`;
    const role = input.role || "unknown";

    // Restringir x entre 0 y 100
    let referenceX = Number(input.referenceX);
    if (isNaN(referenceX)) referenceX = 50;
    referenceX = Math.max(0, Math.min(100, referenceX));

    // Restringir y entre 0 y 100
    let referenceY = Number(input.referenceY);
    if (isNaN(referenceY)) referenceY = 50;
    referenceY = Math.max(0, Math.min(100, referenceY));

    return {
      id,
      role,
      referenceX,
      referenceY,
    };
  });
}
