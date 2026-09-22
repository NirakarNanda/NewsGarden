import {
  DailyEditionWorkflow,
  type DailyEditionOptions,
} from "../engine/workflows/DailyEditionWorkflow.js";

import {
  EditionManager,
} from "../engine/brain/EditionManager.js";

import { eventBus } from "../engine/events/EventBus.js";

export type EditionRunStatus =
  | "running"
  | "succeeded"
  | "failed";

export interface EditionRunState {
  running: boolean;

  status: EditionRunStatus | "idle";

  startedAt?: string;

  finishedAt?: string;

  editionId?: string;

  error?: string;
}

const idle: EditionRunState = {
  running: false,
  status: "idle",
};

let state: EditionRunState = { ...idle };

/*
 * On-demand edition run (POST /api/editions/run).
 *
 * At most one run at a time: a second request while a run is
 * active gets a 409. The workflow runs in the background; the
 * caller gets 202 immediately and can poll GET /api/editions/run
 * for progress.
 */
export function getEditionRunState(): EditionRunState {
  return { ...state };
}

/*
 * Called during server shutdown. Marks an active run as failed so
 * the campus UI shows a terminal state instead of "running"
 * forever; the workflow's own error handling persists what it can.
 */
export function cancelEditionRun(): boolean {

  if (!state.running) {

    return false;
  }

  state = {
    running: false,
    status: "failed",
    startedAt: state.startedAt,
    finishedAt: new Date().toISOString(),
    error: "Server shutting down.",
  };

  console.log(
    "[editionRun] Active run cancelled by shutdown."
  );

  return true;
}

export interface EditionRunOptions {
  maxArticles?: number;
  articlesPerPage?: number;
  mode?: "quick";
}

export async function startEditionRun(
  options: EditionRunOptions = {}
): Promise<{
  accepted: boolean;
  state: EditionRunState;
}> {

  if (state.running) {

    return {
      accepted: false,
      state: getEditionRunState(),
    };
  }

  // Quick mode: 4 stories on a single page.
  const isQuick = options.mode === "quick";
  const workflowOptions: DailyEditionOptions = {
    maxArticles: isQuick ? 4 : options.maxArticles,
    articlesPerPage: isQuick ? 4 : options.articlesPerPage,
  };

  // Create the edition first so the 202 response carries the editionId
  // immediately; the build then continues in the background.
  const editionManager = new EditionManager();
  const today = new Date();
  const title = isQuick
    ? `NewsGarden Quick — ${today.toISOString().slice(0, 10)}`
    : `NewsGarden — ${today.toISOString().slice(0, 10)}`;
  const edition = await editionManager.createEdition(title, today);
  const editionId = edition.editionId;

  state = {
    running: true,
    status: "running",
    startedAt: new Date().toISOString(),
    editionId,
  };

  const workflow = new DailyEditionWorkflow();

  void workflow
    .run({ ...workflowOptions, editionId, title })
    .then((summary) => {

      state = {
        running: false,
        status: "succeeded",
        startedAt: state.startedAt,
        finishedAt: new Date().toISOString(),
        editionId: summary.editionId,
      };

      console.log(
        `[editionRun] Run finished: edition ${summary.editionId} ` +
        `(${summary.storiesCompleted.length} stories, ${summary.pageCount} pages).`
      );

    })
    .catch((error: unknown) => {

      const message =
        error instanceof Error
          ? error.message
          : String(error);

      state = {
        running: false,
        status: "failed",
        startedAt: state.startedAt,
        finishedAt: new Date().toISOString(),
        editionId,
        error: message,
      };

      // Persist the failure so the live view can surface it with a Retry.
      eventBus.emit("EDITION_RUN_FAILED", {
        editionId,
        error: message,
        at: new Date().toISOString(),
      });

      console.error(
        "[editionRun] Run failed:",
        message
      );
    });

  return {
    accepted: true,
    state: getEditionRunState(),
  };
}
