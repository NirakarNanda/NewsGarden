export interface RetryOptions {

  // How many times to retry AFTER the first attempt.
  retries?: number;

  // Base delay in ms. Doubles every attempt.
  baseDelayMs?: number;

  // Max delay in ms between attempts.
  maxDelayMs?: number;

  // Decide whether an error is worth retrying.
  isTransient?: (error: unknown) => boolean;
}

const DEFAULT_RETRIES = 2;

const DEFAULT_BASE_DELAY_MS = 500;

const DEFAULT_MAX_DELAY_MS = 8000;

/*
 * Errors that usually go away if we wait
 * a little: network blips, timeouts,
 * rate limits, and 5xx responses.
 */
export function isTransientError(
  error: unknown
): boolean {

  if (!(error instanceof Error)) {

    return false;
  }

  const message =
    error.message.toLowerCase();

  const transientSignals = [
    "timeout",
    "timed out",
    "econnreset",
    "econnrefused",
    "enotfound",
    "eai_again",
    "socket hang up",
    "network",
    "fetch failed",
    "429",
    "502",
    "503",
    "504",
  ];

  return transientSignals.some(
    (signal) =>
      message.includes(signal)
  );
}

function sleep(
  ms: number
): Promise<void> {

  return new Promise(
    (resolve) =>
      setTimeout(resolve, ms)
  );
}

/*
 * Run an async function with exponential
 * backoff on transient failures.
 *
 * Non-transient errors are thrown
 * immediately without retrying.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {

  const retries =
    options.retries ??
    DEFAULT_RETRIES;

  const baseDelayMs =
    options.baseDelayMs ??
    DEFAULT_BASE_DELAY_MS;

  const maxDelayMs =
    options.maxDelayMs ??
    DEFAULT_MAX_DELAY_MS;

  const isTransient =
    options.isTransient ??
    isTransientError;

  let attempt = 0;

  for (;;) {

    try {

      return await fn();

    } catch (error) {

      const canRetry =
        attempt < retries &&
        isTransient(error);

      if (!canRetry) {

        throw error;
      }

      attempt++;

      const delay = Math.min(
        baseDelayMs *
          2 ** (attempt - 1),
        maxDelayMs
      );

      // Small jitter so concurrent retries
      // do not stampede the same endpoint.
      const jittered =
        delay +
        Math.floor(
          Math.random() * 250
        );

      console.warn(
        `[retry] attempt ${attempt}/${retries} failed (${error instanceof Error ? error.message : "unknown error"}). Retrying in ${jittered}ms...`
      );

      await sleep(jittered);
    }
  }
}
