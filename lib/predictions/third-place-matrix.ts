/**
 * Lógica de fallback para la matriz oficial FIFA 2026 de mejores terceros.
 * La matriz oficial completa (Anexo C del reglamento) tiene 495 combinaciones posibles
 * dado que 8 de 12 terceros avanzan. Como no está disponible públicamente en formato JSON simple,
 * se utiliza este fallback determinista que evita que equipos del mismo grupo jueguen en R32
 * si es posible, o simplemente asigna secuencialmente.
 * 
 * TODO: Reemplazar con la matriz oficial exacta (las 495 filas) cuando esté disponible en JSON.
 */

const THIRD_PLACE_SLOTS = [74, 77, 79, 80, 81, 82, 85, 87];

export function resolveThirdPlaceMatchup(
  advancingGroups: string[],
  teamGroup: string
): number | null {
  // Aseguramos que solo pasen 8 grupos y estén ordenados alfabéticamente
  const sorted = [...advancingGroups].sort((a, b) => a.localeCompare(b));
  
  if (sorted.length !== 8) {
    return null;
  }

  const index = sorted.indexOf(teamGroup);
  if (index === -1) {
    return null;
  }

  // Fallback: asignación directa secuencial a los slots disponibles.
  // La lógica oficial de FIFA permuta estos slots dependiendo de los grupos exactos
  // para evitar coincidencias del mismo grupo.
  return THIRD_PLACE_SLOTS[index];
}
