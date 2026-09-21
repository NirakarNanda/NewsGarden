/*
 * Process-wide concurrency gate for AI calls.
 *
 * Every agent owns its own AIService instance, so without this a
 * workflow fan-out (discovery, research, judging, writing) can
 * fire dozens of requests at Ollama/Groq at once. The semaphore
 * caps in-flight AI calls; excess callers wait their turn.
 */

export class Semaphore {

  private available: number;

  private readonly waiters: Array<
    () => void
  > = [];

  constructor(maxConcurrent: number) {

    this.available =
      Number.isFinite(maxConcurrent) &&
      maxConcurrent > 0
        ? Math.floor(maxConcurrent)
        : 1;
  }

  async acquire(): Promise<() => void> {

    if (this.available > 0) {

      this.available -= 1;

      return () => this.release();
    }

    return new Promise<() => void>(
      (resolve) => {

        this.waiters.push(() => {

          this.available -= 1;

          resolve(() => this.release());
        });
      }
    );
  }

  private release(): void {

    const waiter = this.waiters.shift();

    if (waiter) {

      waiter();

    } else {

      this.available += 1;
    }
  }
}
