import assert from "node:assert/strict";
import test from "node:test";
import { resolveCalendarMatchUnderScore } from "@/lib/predictions/calendar-match-under-score";

test("partido pendiente sin MVP muestra grupo", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: false,
      groupCode: "a",
      predictedMvpPlayerName: null,
    }),
    { label: "A", tone: "group" },
  );
});

test("partido pendiente con MVP pronosticado muestra nombre en amarillo", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: false,
      groupCode: "b",
      predictedMvpPlayerName: "Pedri",
    }),
    { label: "Pedri", tone: "predicted-mvp" },
  );
});

test("partido finalizado muestra MVP oficial en blanco", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: true,
      groupCode: "c",
      officialMvpPlayerName: "Lamine Yamal",
    }),
    { label: "Lamine Yamal", tone: "official-mvp" },
  );
});

test("partido finalizado sin MVP oficial no muestra subtítulo", () => {
  assert.equal(
    resolveCalendarMatchUnderScore({
      finished: true,
      groupCode: "d",
      officialMvpPlayerName: null,
    }),
    null,
  );
});
