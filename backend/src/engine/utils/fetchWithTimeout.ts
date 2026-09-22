/*
 * fetch with a hard timeout. AI provider
 * calls must never hang forever: a hung
 * call used to stall an edition at the
 * "Reviewing" stage indefinitely. With a
 * timeout the call fails fast, the
 * caller's retry/fallback path kicks in,
 * and the pipeline keeps moving.
 */
export async function fetchWithTimeout(
  url: string,
  init: RequestInit = {},
  timeoutMs: number = 120_000
): Promise<Response> {

  const controller =
    new AbortController();

  const timer = setTimeout(
    () => controller.abort(),
    timeoutMs
  );

  try {

    return await fetch(url, {

      ...init,

      signal: controller.signal,
    });

  } catch (error) {

    if (
      error instanceof Error &&
      error.name === "AbortError"
    ) {

      throw new Error(
        `Request timed out after ${timeoutMs}ms: ${url}`,
        { cause: error }
      );
    }

    throw error;

  } finally {

    clearTimeout(timer);
  }
}
