/**
 * "MonthlyResetJob" (19_PRD_Subscription.md / Task-017): rather than a cron
 * job that physically zeroes a counter, usage for the current period is
 * always computed as "usage_logs since the start of the current calendar
 * month" — the reset is implicit and can't drift out of sync with a job
 * that failed to run.
 */
export function getCurrentBillingPeriodStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0));
}
