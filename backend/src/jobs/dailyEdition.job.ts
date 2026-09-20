import {
  Scheduler,
  type ScheduledJob,
} from "../engine/brain/Scheduler.js";

import {
  DailyEditionWorkflow,
} from "../engine/workflows/DailyEditionWorkflow.js";

import {
  SCHEDULES,
} from "../config/schedules.js";

export interface DailyEditionJobDeps {

  scheduler?: Scheduler;

  workflow?: DailyEditionWorkflow;

  // 5-field cron. Defaults to the
  // configured daily edition schedule.
  cron?: string;
}

/*
 * Wires the scheduler to the daily
 * edition workflow.
 *
 * The cron comes from config/schedules.ts
 * (DAILY_EDITION_CRON env override) and
 * defaults to 07:00 daily.
 */
export function startDailyEditionJob(
  deps: DailyEditionJobDeps = {}
): ScheduledJob {

  const scheduler =
    deps.scheduler ??
    new Scheduler();

  const workflow =
    deps.workflow ??
    new DailyEditionWorkflow();

  const cron =
    deps.cron ??
    SCHEDULES.dailyEditionCron;

  return scheduler.schedule(
    cron,

    "daily-edition",

    async () => {

      console.log(
        "[dailyEdition.job] Starting daily edition workflow..."
      );

      try {

        const summary =
          await workflow.run();

        console.log(
          `[dailyEdition.job] Edition ${summary.editionId} finished: ${summary.storiesCompleted.length} stories, ${summary.pageCount} pages, status ${summary.status}.`
        );

      } catch (error) {

        console.error(
          "[dailyEdition.job] Daily edition failed:",

          error instanceof Error
            ? error.message
            : error
        );
      }
    }
  );
}
