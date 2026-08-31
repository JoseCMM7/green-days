import assert from "node:assert/strict";
import test from "node:test";
import {
  buildCalendarCells,
  monthBounds,
  parseMonth,
  shiftMonth,
} from "../src/features/calendar/month";

test("valida meses reales y rechaza formatos ambiguos", () => {
  assert.deepEqual(parseMonth("2026-08"), { year: 2026, month: 8, value: "2026-08" });
  assert.equal(parseMonth("2026-13"), null);
  assert.equal(parseMonth("agosto-2026"), null);
});

test("calcula límites y cambios de año", () => {
  assert.deepEqual(monthBounds("2028-02"), {
    start: "2028-02-01",
    end: "2028-02-29",
    days: 29,
  });
  assert.equal(shiftMonth("2026-12", 1), "2027-01");
  assert.equal(shiftMonth("2026-01", -1), "2025-12");
});

test("construye una cuadrícula semanal que comienza en lunes", () => {
  const cells = buildCalendarCells("2026-08");
  const firstDayIndex = cells.findIndex((cell) => cell.day === 1);

  assert.equal(firstDayIndex, 5);
  assert.equal(cells.length % 7, 0);
  assert.equal(cells.filter((cell) => cell.day !== null).length, 31);
});

