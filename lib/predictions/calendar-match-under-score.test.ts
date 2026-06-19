import assert from "node:assert/strict";
import test from "node:test";
import { resolveCalendarMatchUnderScore } from "@/lib/predictions/calendar-match-under-score";

test("partido pendiente sin MVP no muestra subtítulo", () => {
  assert.equal(
    resolveCalendarMatchUnderScore({
      finished: false,
      predictedMvpPlayerName: null,
    }),
    null,
  );
});

test("partido pendiente con MVP pronosticado muestra apellido conocido", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: false,
      predictedMvpPlayerName: "Pedri Gonzalez",
    }),
    { label: "Gonzalez", tone: "predicted-mvp" },
  );
});

test("partido finalizado muestra apellido del MVP oficial", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: true,
      officialMvpPlayerName: "Lamine Yamal",
    }),
    { label: "Yamal", tone: "official-mvp" },
  );
});

test("monónimo se mantiene", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: false,
      predictedMvpPlayerName: "Pedri",
    }),
    { label: "Pedri", tone: "predicted-mvp" },
  );
});

test("partido finalizado sin MVP oficial no muestra subtítulo", () => {
  assert.equal(
    resolveCalendarMatchUnderScore({
      finished: true,
      officialMvpPlayerName: null,
    }),
    null,
  );
});
