import assert from "node:assert/strict";
import test from "node:test";
import {
  isStackSubpage,
  resolvePageNavDirection,
} from "@/lib/layout/page-navigation";
import { isExactMainTabRoot } from "@/lib/layout/main-tabs";

test("isExactMainTabRoot acepta solo raíces de pestaña", () => {
  assert.equal(isExactMainTabRoot("/"), true);
  assert.equal(isExactMainTabRoot("/quiz"), true);
  assert.equal(isExactMainTabRoot("/predictions"), true);
  assert.equal(isExactMainTabRoot("/predictions/knockout"), false);
  assert.equal(isExactMainTabRoot("/predictions/abc"), false);
  assert.equal(isExactMainTabRoot("/profile/uuid"), false);
});

test("isStackSubpage marca subpáginas navegables con stack", () => {
  assert.equal(isStackSubpage("/predictions/abc"), true);
  assert.equal(isStackSubpage("/quiz/play"), true);
  assert.equal(isStackSubpage("/predictions"), false);
  assert.equal(isStackSubpage("/uso"), true);
});

test("resolvePageNavDirection detecta push al entrar más profundo", () => {
  const result = resolvePageNavDirection(["/predictions"], "/predictions/abc");
  assert.equal(result.direction, "push");
  assert.deepEqual(result.nextStack, ["/predictions", "/predictions/abc"]);
});

test("resolvePageNavDirection detecta pop al volver", () => {
  const result = resolvePageNavDirection(
    ["/predictions", "/predictions/abc"],
    "/predictions"
  );
  assert.equal(result.direction, "pop");
  assert.deepEqual(result.nextStack, ["/predictions"]);
});

test("resolvePageNavDirection detecta cambio de pestaña", () => {
  const result = resolvePageNavDirection(["/predictions/abc"], "/ranking");
  assert.equal(result.direction, "tab");
  assert.deepEqual(result.nextStack, ["/ranking"]);
});
