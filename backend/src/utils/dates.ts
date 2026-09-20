export function startOfDay(
  date: Date
): Date {

  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  return result;
}

// Date-only ISO string, e.g. "2026-09-20".
export function formatDateISO(
  date: Date
): string {

  return date.toISOString().slice(0, 10);
}
