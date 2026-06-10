/**
 * @deprecated Usar `fit-lineup-layout` o `fit-mvp-horizontal-layout`.
 * Reexport temporal para compatibilidad.
 */
export {
  VERTICAL_PITCH_ASPECT as PITCH_ASPECT,
  type BenchLayoutConfig,
  computeFitLineupLayout as computeFitFieldModalLayout,
  type FitLineupLayout as FitFieldModalLayout,
} from "@/lib/lineup/fit-lineup-layout";

export type FitFieldModalLayoutMode = "lineup" | "mvp";

export type ComputeFitFieldModalLayoutOptions = {
  widthPx: number;
  heightPx: number;
  awayBenchCount: number;
  homeBenchCount: number;
  footerPx: number;
  gapPx?: number;
  mode?: FitFieldModalLayoutMode;
  formationRowPx?: number;
};
