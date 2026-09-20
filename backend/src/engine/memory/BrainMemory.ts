interface MemoryEntry {

  value: unknown;

  // Epoch ms. null = no expiry.
  expiresAt: number | null;
}

export interface NamespacedMemory {

  set<T>(
    key: string,
    value: T,
    ttlMs?: number
  ): void;

  get<T>(
    key: string
  ): T | undefined;

  delete(key: string): void;

  clear(): void;
}

/*
 * In-memory key/value store with TTL for
 * the brain's working state.
 *
 * Keys are namespaced ("brain:...", 
 * "edition:...", "workflow:...") so areas
 * do not clobber each other.
 */
export class BrainMemory {

  private store: Map<
    string,
    MemoryEntry
  > = new Map();

  set<T>(
    key: string,
    value: T,
    ttlMs?: number
  ): void {

    this.store.set(key, {

      value,

      expiresAt:
        typeof ttlMs === "number"
          ? Date.now() + ttlMs
          : null,
    });
  }

  get<T>(
    key: string
  ): T | undefined {

    const entry =
      this.store.get(key);

    if (!entry) {

      return undefined;
    }

    if (
      entry.expiresAt !== null &&
      entry.expiresAt <= Date.now()
    ) {

      this.store.delete(key);

      return undefined;
    }

    return entry.value as T;
  }

  delete(key: string): void {

    this.store.delete(key);
  }

  clear(): void {

    this.store.clear();
  }

  /*
   * Remove expired entries.
   * Called opportunistically; get() also
   * expires lazily.
   */
  sweep(): number {

    const now = Date.now();

    let removed = 0;

    for (const [
      key,
      entry,
    ] of this.store) {

      if (
        entry.expiresAt !== null &&
        entry.expiresAt <= now
      ) {

        this.store.delete(key);

        removed++;
      }
    }

    return removed;
  }

  size(): number {

    return this.store.size;
  }

  /*
   * Scoped view so a subsystem only sees
   * its own keys.
   */
  namespaced(
    namespace: string
  ): NamespacedMemory {

    const prefix = `${namespace}:`;

    const parent = this;

    return {

      set<T>(
        key: string,
        value: T,
        ttlMs?: number
      ): void {

        parent.set(
          prefix + key,
          value,
          ttlMs
        );
      },

      get<T>(
        key: string
      ): T | undefined {

        return parent.get<T>(
          prefix + key
        );
      },

      delete(key: string): void {

        parent.delete(
          prefix + key
        );
      },

      clear(): void {

        for (const key of [
          ...parent.store.keys(),
        ]) {

          if (
            key.startsWith(prefix)
          ) {

            parent.store.delete(
              key
            );
          }
        }
      },
    };
  }
}

export const brainMemory =
  new BrainMemory();
