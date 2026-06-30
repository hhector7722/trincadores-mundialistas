import type { LabOption, LabQuestionScoreGap } from "./types";
import { labOptionIdsToSeed } from "../play-formats";

export type ScoreGapQuestion = {
  id: string;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  difficulty?: "easy" | "medium" | "hard";
};

export const SCORE_GAP_BANK: ScoreGapQuestion[] = [
  { id: "sg_1", prompt: "¿Por cuántos goles de diferencia ganó Alemania a Brasil en las semifinales de 2014?", options: ["5", "6", "7", "8"], correctOptionIndex: 1, difficulty: "easy" },
  { id: "sg_2", prompt: "¿Cuántos Mundiales ganó Pelé?", options: ["2", "3", "4", "5"], correctOptionIndex: 1, difficulty: "easy" },
  { id: "sg_3", prompt: "¿En qué minuto marcó Andrés Iniesta el gol de la final del Mundial 2010?", options: ["114'", "116'", "118'", "120'"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_4", prompt: "¿Cuántos goles marcó Miroslav Klose en total en la historia de los Mundiales?", options: ["14", "15", "16", "17"], correctOptionIndex: 2, difficulty: "hard" },
  { id: "sg_5", prompt: "¿Cuántos goles marcó Just Fontaine en el Mundial de 1958, el récord histórico en un solo torneo?", options: ["11", "12", "13", "14"], correctOptionIndex: 2, difficulty: "hard" },
  { id: "sg_6", prompt: "¿Cuántas tarjetas amarillas se mostraron en el partido de octavos de 2006 entre Portugal y Países Bajos, la 'Batalla de Núremberg'?", options: ["14", "16", "18", "20"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_7", prompt: "¿Cuántas Copas del Mundo ha ganado Brasil?", options: ["3", "4", "5", "6"], correctOptionIndex: 2, difficulty: "easy" },
  { id: "sg_8", prompt: "¿Cuántos equipos participaron en el primer Mundial en 1930?", options: ["13", "14", "15", "16"], correctOptionIndex: 0, difficulty: "hard" },
  { id: "sg_9", prompt: "¿A qué edad ganó Pelé su primer Mundial en 1958?", options: ["16", "17", "18", "19"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_10", prompt: "¿Cuántos goles marcó Ronaldo Nazário en la final de 2002 contra Alemania?", options: ["1", "2", "3", "ninguno"], correctOptionIndex: 1, difficulty: "easy" },
  { id: "sg_11", prompt: "¿Cuántos penaltis paró Dibu Martínez en la tanda de la final de 2022 contra Francia?", options: ["1", "2", "3", "4"], correctOptionIndex: 0, difficulty: "medium" },
  { id: "sg_12", prompt: "¿A qué distancia estaba el arco cuando Roberto Carlos anotó su icónico gol de tiro libre contra Francia en el torneo amistoso previo al Mundial de 1998 (Tournoi de France)?", options: ["30 metros", "35 metros", "40 metros", "45 metros"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_13", prompt: "¿Cuántas finales del Mundial ha perdido Países Bajos sin haberlo ganado nunca?", options: ["2", "3", "4", "5"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_14", prompt: "¿En qué edición del Mundial se introdujeron por primera vez las tarjetas rojas y amarillas?", options: ["1966", "1970", "1974", "1978"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_15", prompt: "¿Cuántos goles marcó Diego Maradona en el Mundial de 1986?", options: ["4", "5", "6", "7"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_16", prompt: "¿Cuál fue el resultado del partido inaugural del Mundial 2002 donde Senegal sorprendió a la campeona Francia?", options: ["1-0", "2-0", "2-1", "3-1"], correctOptionIndex: 0, difficulty: "medium" },
  { id: "sg_17", prompt: "¿Cuántas selecciones participaron en el Mundial de Qatar 2022?", options: ["24", "32", "40", "48"], correctOptionIndex: 1, difficulty: "easy" },
  { id: "sg_18", prompt: "¿Cuántos goles anotó Kylian Mbappé en la final del Mundial 2022?", options: ["1", "2", "3", "4"], correctOptionIndex: 2, difficulty: "easy" },
  { id: "sg_19", prompt: "¿A los cuántos segundos se anotó el gol más rápido en la historia de los Mundiales (Hakan Şükür en 2002)?", options: ["10.8 s", "11.2 s", "12.5 s", "14.1 s"], correctOptionIndex: 0, difficulty: "hard" },
  { id: "sg_20", prompt: "¿A qué edad marcó Roger Milla en el Mundial de 1994, siendo el goleador de mayor edad?", options: ["39", "40", "41", "42"], correctOptionIndex: 3, difficulty: "hard" },
  { id: "sg_21", prompt: "¿Cuántas veces ha sido anfitriona Italia de la Copa del Mundo?", options: ["1", "2", "3", "4"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_22", prompt: "¿Cuántos estadios se utilizaron para albergar los partidos del Mundial de Sudáfrica 2010?", options: ["8", "10", "12", "14"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_23", prompt: "¿Cuántos goles de diferencia hubo en la victoria de España sobre Costa Rica en Qatar 2022?", options: ["5", "6", "7", "8"], correctOptionIndex: 2, difficulty: "medium" },
  { id: "sg_24", prompt: "¿En qué minuto fue expulsado Zinedine Zidane en la final del Mundial 2006?", options: ["105'", "110'", "115'", "120'"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_25", prompt: "¿Cuántos campeonatos mundiales ha ganado la selección de Argentina?", options: ["2", "3", "4", "5"], correctOptionIndex: 1, difficulty: "easy" },
  { id: "sg_26", prompt: "¿Cuántos goles se marcaron en total en el partido de fase de grupos entre España y Portugal en Rusia 2018?", options: ["4", "5", "6", "7"], correctOptionIndex: 2, difficulty: "medium" },
  { id: "sg_27", prompt: "¿Cuántos penaltis se fallaron en la tanda de la final del Mundial de 1994 entre Brasil e Italia?", options: ["2", "3", "4", "5"], correctOptionIndex: 1, difficulty: "hard" },
  { id: "sg_28", prompt: "¿De cuántos equipos fue la diferencia de participantes al pasar del formato del Mundial 1994 al Mundial 1998?", options: ["4", "6", "8", "10"], correctOptionIndex: 2, difficulty: "hard" },
  { id: "sg_29", prompt: "¿Cuántos goles anotó Gary Lineker para ganar la Bota de Oro en el Mundial de 1986?", options: ["5", "6", "7", "8"], correctOptionIndex: 1, difficulty: "medium" },
  { id: "sg_30", prompt: "¿Cuántos títulos consecutivos ganó Italia en los primeros años de la Copa del Mundo (1934 y 1938)?", options: ["1", "2", "3", "4"], correctOptionIndex: 1, difficulty: "easy" },
];

export function pickScoreGapQuestion(excludeIds: string[]): LabQuestionScoreGap | null {
  const available = SCORE_GAP_BANK.filter(q => !excludeIds.includes(q.id));
  if (available.length === 0) return null;

  const selected = available[Math.floor(Math.random() * available.length)];
  
  const options: LabOption[] = selected.options.map((opt, i) => ({
    id: `opt_${i}`,
    label: opt
  }));

  return {
    id: selected.id,
    format: "score_gap",
    prompt: selected.prompt,
    options,
    correctOptionId: options[selected.correctOptionIndex].id,
    timerSeconds: 15,
    difficulty: selected.difficulty,
  };
}
