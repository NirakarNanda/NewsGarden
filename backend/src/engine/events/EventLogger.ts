import {
  randomUUID,
} from "crypto";

import {
  eventBus,
  type EventPayload,
} from "./EventBus.js";

interface ActivityEventModelLike {

  create(
    doc: unknown
  ): Promise<unknown>;
}

interface ActivityEventModule {

  ActivityEvent?: ActivityEventModelLike;
}

/*
 * Persists every bus event to the
 * ActivityEvent collection for the
 * activity feed / audit trail.
 *
 * The import stays lazy and every
 * failure is swallowed with a single
 * warning: a logger must never crash
 * the event bus.
 *
 * Doc shape matches the API area's
 * ActivityEvent model: eventId, name,
 * agentId, payload, emittedAt.
 */
class EventLogger {

  private started = false;

  private warnedMissingModel =
    false;

  private warnedWriteFailed =
    false;

  private modelPromise: Promise<
    ActivityEventModelLike | null
  > | null = null;

  start(): void {

    if (this.started) {

      return;
    }

    this.started = true;

    eventBus.onAny(
      (name, payload) => {

        void this.persist(
          name,
          payload
        );
      }
    );
  }

  private async getModel(): Promise<ActivityEventModelLike | null> {

    if (!this.modelPromise) {

      this.modelPromise =
        this.loadModel();
    }

    return this.modelPromise;
  }

  private async loadModel(): Promise<ActivityEventModelLike | null> {

    try {

      const mod =
        (await import(
          "../../models/ActivityEvent.js"
        )) as unknown as ActivityEventModule;

      if (
        mod &&
        mod.ActivityEvent &&
        typeof mod.ActivityEvent
          .create === "function"
      ) {

        return mod.ActivityEvent;
      }

    } catch {

      // Model file missing or broken.
    }

    if (!this.warnedMissingModel) {

      this.warnedMissingModel =
        true;

      console.warn(
        "[EventLogger] ActivityEvent model not available; events will not be persisted."
      );
    }

    return null;
  }

  private async persist(
    name: string,
    payload: EventPayload
  ): Promise<void> {

    try {

      const model =
        await this.getModel();

      if (!model) {

        return;
      }

      // Never let a slow or missing DB
      // stall the logger: race the write
      // against a short timeout.
      await Promise.race([

        model.create({

          eventId:
            randomUUID(),

          name,

          agentId:
            typeof payload.agentId ===
            "string"
              ? payload.agentId
              : undefined,

          payload,

          emittedAt:
            new Date(),
        }),

        new Promise(
          (_resolve, reject) =>
            setTimeout(
              () =>
                reject(
                  new Error(
                    "ActivityEvent write timed out"
                  )
                ),

              5000
            )
        ),
      ]);

    } catch (error) {

      if (
        !this.warnedWriteFailed
      ) {

        this.warnedWriteFailed =
          true;

        console.warn(
          "[EventLogger] Failed to persist event:",

          error instanceof Error
            ? error.message
            : error
        );
      }
    }
  }
}

export const eventLogger =
  new EventLogger();
