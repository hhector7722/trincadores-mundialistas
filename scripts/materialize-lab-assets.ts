import {
  listPlayerMomentsForLab,
  materializeLabAsset,
} from "@/lib/quiz/lab/materialize-assets.server";
import type { LabDeriveVariant } from "@/lib/quiz/lab/derive-images.server";

const VARIANTS: LabDeriveVariant[] = ["hair", "eyes", "silhouette"];

function readArg(prefix: string): string | null {
  const match = process.argv.find((arg) => arg.startsWith(`${prefix}=`));
  return match ? match.slice(prefix.length + 1).trim() : null;
}

const force = process.argv.includes("--force");
const momentIdFilter = readArg("--moment-id");
const variantFilter = readArg("--variant") as LabDeriveVariant | null;

const ACTIVE_VARIANTS =
  variantFilter && VARIANTS.includes(variantFilter) ? [variantFilter] : VARIANTS;

const SILHOUETTE_PAUSE_MS = 3_000;

async function main() {
  let moments = listPlayerMomentsForLab();
  if (momentIdFilter) {
    moments = moments.filter((moment) => moment.id === momentIdFilter);
    if (!moments.length) {
      console.error(`Momento player no encontrado: ${momentIdFilter}`);
      process.exit(1);
    }
  }

  if (variantFilter && !VARIANTS.includes(variantFilter)) {
    console.error(`Variante inválida: ${variantFilter}. Usa hair, eyes o silhouette.`);
    process.exit(1);
  }

  const results: Array<{ momentId: string; variant: string; status: string; url?: string }> =
    [];
  const failures: Array<{ momentId: string; variant: string; error: string }> = [];

  for (const moment of moments) {
    for (const variant of ACTIVE_VARIANTS) {
      const suitability = moment.lab_suitability;
      if (suitability?.length) {
        if (variant === "hair" || variant === "eyes") {
          if (!suitability.includes(variant)) {
            results.push({
              momentId: moment.id,
              variant,
              status: "skipped_unsuitable",
            });
            continue;
          }
        } else if (!suitability.includes("silhouette")) {
          results.push({
            momentId: moment.id,
            variant,
            status: "skipped_unsuitable",
          });
          continue;
        }
      }

      try {
        const result = await materializeLabAsset(moment, variant, {
          force: variant === "silhouette" ? true : force,
        });
        results.push({
          momentId: moment.id,
          variant,
          status: result.skipped ? "skipped_exists" : "generated",
          url: result.publicUrl,
        });
        console.log(
          `${result.skipped ? "SKIP" : "OK"} ${moment.id} ${variant} → ${result.publicUrl}`
        );
        if (variant === "silhouette" && !result.skipped) {
          await new Promise((resolve) => setTimeout(resolve, SILHOUETTE_PAUSE_MS));
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        failures.push({ momentId: moment.id, variant, error: message });
        console.error(`FAIL ${moment.id} ${variant}: ${message}`);
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        moments: moments.length,
        results: results.length,
        generated: results.filter((r) => r.status === "generated").length,
        skipped: results.filter((r) => r.status.startsWith("skipped")).length,
        failures,
      },
      null,
      2
    )
  );

  if (failures.length) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
