import {
  computeFitMvpHorizontalLayout,
  type FitMvpHorizontalLayout,
} from "@/lib/lineup/fit-mvp-horizontal-layout";
import {
  MVP_MODAL_FIELD_BODY_HEIGHT_REM,
  MVP_MODAL_SAVE_FOOTER_REM,
} from "@/lib/lineup/field-asset";

/** Ancho útil del modal táctico (32rem − padding). Evita medir durante slides. */
export const TACTICAL_MODAL_LAYOUT_WIDTH_PX = 480;

const MVP_FORMATION_ROW_PX = 22;
const MVP_CHIP_BLEED_PX = 14;
const MVP_LAYOUT_GAP_PX = 2;

export type TacticalModalLayoutMode = "mvp-pick" | "possible-lineups";

function bodyHeightPx(mode: TacticalModalLayoutMode): number {
  if (mode === "possible-lineups") {
    return (MVP_MODAL_FIELD_BODY_HEIGHT_REM + MVP_MODAL_SAVE_FOOTER_REM) * 16;
  }
  return MVP_MODAL_FIELD_BODY_HEIGHT_REM * 16;
}

/** Layout fijo del campo horizontal: sin ResizeObserver ni mediciones en mitad de slide. */
export function buildTacticalModalLayout(
  mode: TacticalModalLayoutMode,
  awayBenchCount: number,
  homeBenchCount: number
): FitMvpHorizontalLayout {
  return computeFitMvpHorizontalLayout({
    widthPx: TACTICAL_MODAL_LAYOUT_WIDTH_PX,
    heightPx: bodyHeightPx(mode),
    awayBenchCount,
    homeBenchCount,
    footerPx: MVP_CHIP_BLEED_PX,
    formationRowPx: MVP_FORMATION_ROW_PX,
    gapPx: MVP_LAYOUT_GAP_PX,
  });
}
