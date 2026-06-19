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

test("partido pendiente con MVP pronosticado muestra apellido conocido", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: false,
      groupCode: "b",
      predictedMvpPlayerName: "Pedri Gonzalez",
    }),
    { label: "Gonzalez", tone: "predicted-mvp" },
  );
});

test("partido finalizado muestra apellido del MVP oficial", () => {
  assert.deepEqual(
    resolveCalendarMatchUnderScore({
      finished: true,
      groupCode: "c",
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
      groupCode: "d",
      officialMvpPlayerName: null,
    }),
    null,
  );
});
