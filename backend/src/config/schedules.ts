export const SCHEDULES = {

  // Cron expression for the daily edition run.
  // Default: every day at 07:00.
  dailyEditionCron:
    process.env.DAILY_EDITION_CRON ?? "0 7 * * *",

  // How often agents report they are alive.
  heartbeatIntervalMs:
    Number(process.env.HEARTBEAT_INTERVAL_MS) || 15000,
};
