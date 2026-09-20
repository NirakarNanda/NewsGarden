export function isNonEmptyString(
  value: unknown
): value is string {

  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

export function isValidStatus<T extends string>(
  value: unknown,
  allowed: readonly T[]
): value is T {

  return (
    typeof value === "string" &&
    (allowed as readonly string[]).includes(value)
  );
}

// Parses a positive integer from query input.
// Falls back and clamps to a maximum on bad input.
export function parsePositiveInt(
  value: unknown,
  fallback: number,
  max: number
): number {

  const parsed =
    typeof value === "string" ? Number(value) : NaN;

  if (!Number.isFinite(parsed) || parsed <= 0) {

    return fallback;
  }

  return Math.min(Math.floor(parsed), max);
}
