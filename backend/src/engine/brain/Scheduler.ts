/*
 * Minimal cron matcher.
 *
 * Supports the standard 5-field form:
 *   minute hour dayOfMonth month dayOfWeek
 * e.g. "0 7 * * *" (daily at 07:00).
 *
 * Fields support "*", single numbers,
 * ranges (1-5), steps (*\/15), and lists
 * (1,15). Names (MON, JAN) are not
 * supported — keep schedules numeric.
 */

interface CronParts {

  minute: number[];

  hour: number[];

  dayOfMonth: number[];

  month: number[];

  dayOfWeek: number[];
}

function parseField(
  field: string,
  min: number,
  max: number
): number[] {

  const values = new Set<number>();

  const add = (
    from: number,
    to: number,
    step: number
  ) => {

    for (
      let v = from;
      v <= to;
      v += step
    ) {

      if (
        v >= min &&
        v <= max
      ) {

        values.add(v);
      }
    }
  };

  for (const part of field.split(
    ","
  )) {

    const [range, stepStr] =
      part.split("/");

    const step = stepStr
      ? Number(stepStr)
      : 1;

    if (
      !Number.isInteger(step) ||
      step < 1
    ) {

      throw new Error(
        `Invalid cron step: ${part}`
      );
    }

    if (
      range === "*" ||
      range === undefined ||
      range === ""
    ) {

      add(min, max, step);

    } else if (
      range.includes("-")
    ) {

      const [a, b] =
        range.split("-");

      const from = Number(a);

      const to = Number(b);

      if (
        !Number.isInteger(
          from
        ) ||
        !Number.isInteger(to)
      ) {

        throw new Error(
          `Invalid cron range: ${part}`
        );
      }

      add(from, to, step);

    } else {

      const value = Number(
        range
      );

      if (
        !Number.isInteger(
          value
        )
      ) {

        throw new Error(
          `Invalid cron value: ${part}`
        );
      }

      add(value, value, step);
    }
  }

  return [...values].sort(
    (a, b) => a - b
  );
}

export function parseCron(
  expression: string
): CronParts {

  const fields =
    expression.trim().split(/\s+/);

  if (
    fields.length !== 5
  ) {

    throw new Error(
      `Cron expression must have 5 fields, got ${fields.length}: "${expression}"`
    );
  }

  const [
    minute,
    hour,
    dayOfMonth,
    month,
    dayOfWeek,
  ] = fields as [
    string,
    string,
    string,
    string,
    string,
  ];

  return {

    minute: parseField(
      minute,
      0,
      59
    ),

    hour: parseField(
      hour,
      0,
      23
    ),

    dayOfMonth: parseField(
      dayOfMonth,
      1,
      31
    ),

    month: parseField(
      month,
      1,
      12
    ),

    dayOfWeek: parseField(
      dayOfWeek,
      0,
      6
    ),
  };
}

export function cronMatches(
  parts: CronParts,
  date: Date
): boolean {

  // Sunday is 0; some crons use 7.
  const dow =
    date.getDay() % 7;

  const dowAlt =
    date.getDay() === 0
      ? 7
      : date.getDay();

  return (

    parts.minute.includes(
      date.getMinutes()
    ) &&

    parts.hour.includes(
      date.getHours()
    ) &&

    parts.dayOfMonth.includes(
      date.getDate()
    ) &&

    parts.month.includes(
      date.getMonth() + 1
    ) &&

    (parts.dayOfWeek.includes(
      dow
    ) ||
      parts.dayOfWeek.includes(
        dowAlt
      ))
  );
}

export interface ScheduledJob {

  name: string;

  stop(): void;
}

/*
 * node-cron is not installed, so this
 * scheduler ticks every minute and fires
 * handlers whose cron expression matches
 * the current minute. Each job fires at
 * most once per minute.
 */
export class Scheduler {

  private jobs: ScheduledJob[] =
    [];

  private timer: NodeJS.Timeout | null =
    null;

  schedule(
    cronExpression: string,
    name: string,
    handler: () => void | Promise<void>
  ): ScheduledJob {

    const parts =
      parseCron(
        cronExpression
      );

    let lastFiredMinute = "";

    const job: ScheduledJob = {

      name,

      stop: () => {

        this.jobs =
          this.jobs.filter(
            (j) => j !== job
          );

        if (
          this.jobs.length ===
            0
        ) {

          this.stopTicker();
        }
      },
    };

    const tick = () => {

      const now = new Date();

      if (
        !cronMatches(
          parts,
          now
        )
      ) {

        return;
      }

      const minuteKey = [
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        now.getHours(),
        now.getMinutes(),
      ].join("-");

      if (
        minuteKey ===
        lastFiredMinute
      ) {

        return;
      }

      lastFiredMinute =
        minuteKey;

      console.log(
        `[Scheduler] Firing job "${name}"`
      );

      try {

        const result =
          handler();

        if (
          result instanceof
          Promise
        ) {

          result.catch(
            (error) => {

              console.error(
                `[Scheduler] Job "${name}" failed:`,

                error instanceof
                  Error
                  ? error.message
                  : error
              );
            }
          );
        }

      } catch (error) {

        console.error(
          `[Scheduler] Job "${name}" threw:`,

          error instanceof Error
            ? error.message
            : error
        );
      }
    };

    this.jobs.push(job);

    this.startTicker(tick);

    console.log(
      `[Scheduler] Scheduled "${name}" (${cronExpression})`
    );

    return job;
  }

  jobCount(): number {

    return this.jobs.length;
  }

  stopAll(): void {

    this.jobs = [];

    this.stopTicker();
  }

  private tickers: (() => void)[] =
    [];

  private startTicker(
    tick: () => void
  ): void {

    this.tickers.push(tick);

    if (!this.timer) {

      this.timer =
        setInterval(
          () => {

            for (const t of this
              .tickers) {

              t();
            }
          },

          60 * 1000
        );

      // Do not keep the process alive
      // for the scheduler alone.
      this.timer.unref?.();
    }
  }

  private stopTicker(): void {

    this.tickers = [];

    if (this.timer) {

      clearInterval(
        this.timer
      );

      this.timer = null;
    }
  }
}
