export type EventPayload =
  Record<string, unknown>;

export type EventHandler = (
  payload: EventPayload
) => void;

export type AnyEventHandler = (
  name: string,
  payload: EventPayload
) => void;

export type ExternalEmitter = (
  name: string,
  payload: EventPayload
) => void;

/*
 * In-memory typed event bus (singleton).
 *
 * Local subscribers get events through
 * on()/onAny(). The server registers one
 * external emitter (e.g. socket.io) with
 * setExternalEmitter(); every emit() is
 * forwarded there too.
 */
class EventBus {

  private handlers: Map<
    string,
    Set<EventHandler>
  > = new Map();

  private anyHandlers: Set<AnyEventHandler> =
    new Set();

  private externalEmitter:
    | ExternalEmitter
    | null = null;

  on(
    name: string,
    handler: EventHandler
  ): void {

    let set =
      this.handlers.get(name);

    if (!set) {

      set = new Set();

      this.handlers.set(name, set);
    }

    set.add(handler);
  }

  /*
   * Subscribe to every event.
   * Used by the EventLogger.
   */
  onAny(
    handler: AnyEventHandler
  ): void {

    this.anyHandlers.add(handler);
  }

  off(
    name: string,
    handler: EventHandler
  ): void {

    const set =
      this.handlers.get(name);

    if (!set) {

      return;
    }

    set.delete(handler);

    if (set.size === 0) {

      this.handlers.delete(name);
    }
  }

  offAny(
    handler: AnyEventHandler
  ): void {

    this.anyHandlers.delete(handler);
  }

  /*
   * Registered by the server at startup
   * so the frontend gets realtime events.
   */
  setExternalEmitter(
    emitter: ExternalEmitter | null
  ): void {

    this.externalEmitter =
      emitter;
  }

  emit(
    name: string,
    payload: EventPayload = {}
  ): void {

    const enriched = {
      ...payload,

      _eventName: name,

      _emittedAt:
        new Date().toISOString(),
    };

    const set =
      this.handlers.get(name);

    if (set) {

      for (const handler of set) {

        this.safeCall(
          () =>
            handler(enriched),

          name
        );
      }
    }

    for (const handler of this
      .anyHandlers) {

      this.safeCall(
        () =>
          handler(name, enriched),

        name
      );
    }

    if (this.externalEmitter) {

      this.safeCall(
        () =>
          this.externalEmitter!(
            name,
            enriched
          ),

        name
      );
    }
  }

  private safeCall(
    fn: () => void,
    name: string
  ): void {

    try {

      fn();

    } catch (error) {

      console.error(
        `[EventBus] handler failed for "${name}":`,

        error instanceof Error
          ? error.message
          : error
      );
    }
  }
}

export const eventBus =
  new EventBus();
