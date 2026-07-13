/**
 * BullMQ bundles its own copy of ioredis, which TypeScript treats as a
 * distinct (incompatible) type from the top-level `ioredis` package used
 * by src/shared/queue/redis.ts elsewhere. Passing plain connection options
 * (rather than a live client instance) sidesteps that type clash entirely
 * -- BullMQ creates its own client internally.
 */
const url = new URL(process.env.REDIS_URL ?? "redis://localhost:6379");

export const bullMqConnectionOptions = {
  host: url.hostname,
  port: url.port ? Number(url.port) : 6379,
  ...(url.password ? { password: url.password } : {}),
  maxRetriesPerRequest: null,
};
