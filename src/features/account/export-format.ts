export function exportFilename(date = new Date()) {
  return `green-days-${date.toISOString().slice(0, 10)}.json`;
}

