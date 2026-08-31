const monthPattern = /^(\d{4})-(\d{2})$/;

export type CalendarCell = {
  key: string;
  day: number | null;
  date: string | null;
};

export function parseMonth(value: string) {
  const match = monthPattern.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (year < 2000 || year > 2100 || month < 1 || month > 12) return null;

  return { year, month, value: `${year}-${String(month).padStart(2, "0")}` };
}

export function monthInTimeZone(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}`;
}

export function monthBounds(value: string) {
  const parsed = parseMonth(value);
  if (!parsed) throw new Error("INVALID_MONTH");

  const lastDay = new Date(Date.UTC(parsed.year, parsed.month, 0)).getUTCDate();
  return {
    start: `${parsed.value}-01`,
    end: `${parsed.value}-${String(lastDay).padStart(2, "0")}`,
    days: lastDay,
  };
}

export function shiftMonth(value: string, amount: number) {
  const parsed = parseMonth(value);
  if (!parsed) throw new Error("INVALID_MONTH");
  const shifted = new Date(Date.UTC(parsed.year, parsed.month - 1 + amount, 1));
  return `${shifted.getUTCFullYear()}-${String(shifted.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function formatMonth(value: string) {
  const parsed = parseMonth(value);
  if (!parsed) throw new Error("INVALID_MONTH");
  const label = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(parsed.year, parsed.month - 1, 1)));
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function buildCalendarCells(value: string): CalendarCell[] {
  const parsed = parseMonth(value);
  if (!parsed) throw new Error("INVALID_MONTH");
  const { days } = monthBounds(value);
  const sundayFirst = new Date(Date.UTC(parsed.year, parsed.month - 1, 1)).getUTCDay();
  const leadingBlanks = (sundayFirst + 6) % 7;
  const occupied = leadingBlanks + days;
  const totalCells = Math.ceil(occupied / 7) * 7;

  return Array.from({ length: totalCells }, (_, index) => {
    const day = index - leadingBlanks + 1;
    if (day < 1 || day > days) return { key: `blank-${index}`, day: null, date: null };
    const date = `${parsed.value}-${String(day).padStart(2, "0")}`;
    return { key: date, day, date };
  });
}

