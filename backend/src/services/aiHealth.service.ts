import { AIService } from "../engine/tools/ai/AIService.js";

/*
 * Startup reachability check for the configured AI provider.
 *
 * Runs once at boot (server.ts) with a short timeout so a dead
 * provider cannot stall startup. The result is served by
 * GET /api/health as `ai: { provider, reachable }` and drives
 * the offline-fallback labelling in the UI.
 */

export interface AIHealth {
  provider: string;

  reachable: boolean;

  model?: string;

  error?: string;

  checkedAt: string;
}

const CHECK_TIMEOUT_MS = 15000;

let health: AIHealth | null = null;

function aiModel(): string | undefined {

  const provider =
    process.env.AI_PROVIDER ?? "ollama";

  if (provider === "openai") {

    return process.env.AI_MODEL;
  }

  if (provider === "gemini") {

    return process.env.GEMINI_MODEL;
  }

  return process.env.OLLAMA_MODEL;
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number
): Promise<T> {

  let timer: ReturnType<typeof setTimeout>;

  const timeout = new Promise<never>(
    (_, reject) => {

      timer = setTimeout(
        () => reject(new Error(`AI check timed out after ${ms}ms`)),
        ms
      );
    }
  );

  return Promise.race([promise, timeout]).finally(
    () => clearTimeout(timer)
  );
}

export async function checkAIHealth(): Promise<AIHealth> {

  const provider =
    process.env.AI_PROVIDER ?? "ollama";

  const checkedAt =
    new Date().toISOString();

  try {

    const service = new AIService();

    await withTimeout(
      service.generateText("Reply with exactly: ok"),
      CHECK_TIMEOUT_MS
    );

    health = {
      provider,
      reachable: true,
      model: aiModel(),
      checkedAt,
    };

    console.log(
      `[aiHealth] Provider "${provider}" reachable.`
    );

  } catch (error) {

    const message =
      error instanceof Error
        ? error.message
        : String(error);

    health = {
      provider,
      reachable: false,
      model: aiModel(),
      error: message,
      checkedAt,
    };

    console.warn(
      `[aiHealth] Provider "${provider}" unreachable: ${message}. ` +
      `Editions will be built with the offline fallback and labelled as such.`
    );
  }

  return health;
}

export function getAIHealth(): AIHealth | null {

  return health;
}
