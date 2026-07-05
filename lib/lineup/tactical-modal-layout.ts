import {
  computeFitMvpHorizontalLayout,
  estimateMvpInlineBenchLayout,
  type FitMvpHorizontalLayout,
} from "@/lib/lineup/fit-mvp-horizontal-layout";

import { MVP_MODAL_FIELD_BODY_HEIGHT_REM } from "@/lib/lineup/field-asset";

/** Ancho útil del modal táctico (32rem − padding). */
export const TACTICAL_MODAL_LAYOUT_WIDTH_PX = 480;

/** Reservas de referencia para altura estable del shell durante la carga. */
export const TACTICAL_SHELL_BENCH_PLACEHOLDER = 12;

const MVP_FORMATION_ROW_PX = 22;
const MVP_CHIP_BLEED_PX = 14;
const MVP_LAYOUT_GAP_PX = 2;
const TACTICAL_BODY_PAD_PX = 12;

const REFERENCE_LAYOUT = computeFitMvpHorizontalLayout({
  widthPx: TACTICAL_MODAL_LAYOUT_WIDTH_PX,
  heightPx: MVP_MODAL_FIELD_BODY_HEIGHT_REM * 16,
  awayBenchCount: TACTICAL_SHELL_BENCH_PLACEHOLDER,
  homeBenchCount: TACTICAL_SHELL_BENCH_PLACEHOLDER,
  footerPx: MVP_CHIP_BLEED_PX,
  formationRowPx: MVP_FORMATION_ROW_PX,
  gapPx: MVP_LAYOUT_GAP_PX,
});

/** Campo fijo compartido por MVP y posibles alineaciones del mismo partido. */
export const TACTICAL_FIELD_WIDTH_PX = REFERENCE_LAYOUT.fieldWidthPx;
export const TACTICAL_FIELD_HEIGHT_PX = REFERENCE_LAYOUT.fieldHeightPx;


/** Layout táctico: campo idéntico; banco local arriba, visitante abajo. */
export function buildTacticalModalLayout(
  homeBenchCount: number,
  awayBenchCount: number
): FitMvpHorizontalLayout {
  const home = homeBenchCount > 0 ? homeBenchCount : TACTICAL_SHELL_BENCH_PLACEHOLDER;
  const away = awayBenchCount > 0 ? awayBenchCount : TACTICAL_SHELL_BENCH_PLACEHOLDER;

  return {
    fieldWidthPx: TACTICAL_FIELD_WIDTH_PX,
    fieldHeightPx: TACTICAL_FIELD_HEIGHT_PX,
    homeBench: estimateMvpInlineBenchLayout(home, TACTICAL_FIELD_WIDTH_PX),
    awayBench: estimateMvpInlineBenchLayout(away, TACTICAL_FIELD_WIDTH_PX),
  };
}

export function computeTacticalBodyMinHeightPx(layout: FitMvpHorizontalLayout): number {
  return (
    MVP_FORMATION_ROW_PX +
    layout.homeBench.heightPx +
    MVP_LAYOUT_GAP_PX +
    layout.fieldHeightPx +
    MVP_LAYOUT_GAP_PX +
    MVP_FORMATION_ROW_PX +
    layout.awayBench.heightPx +
    MVP_CHIP_BLEED_PX +
    TACTICAL_BODY_PAD_PX
  );
}

export const TACTICAL_SHELL_BODY_MIN_HEIGHT_PX = computeTacticalBodyMinHeightPx(
  buildTacticalModalLayout(
    TACTICAL_SHELL_BENCH_PLACEHOLDER,
    TACTICAL_SHELL_BENCH_PLACEHOLDER
  )
);
