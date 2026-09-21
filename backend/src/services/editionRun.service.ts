import {
  DailyEditionWorkflow,
} from "../engine/workflows/DailyEditionWorkflow.js";

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

export function startEditionRun(): {
  accepted: boolean;
  state: EditionRunState;
} {

  if (state.running) {

    return {
      accepted: false,
      state: getEditionRunState(),
    };
  }

  state = {
    running: true,
    status: "running",
    startedAt: new Date().toISOString(),
  };

  const workflow = new DailyEditionWorkflow();

  void workflow
    .run()
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
        error: message,
      };

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
