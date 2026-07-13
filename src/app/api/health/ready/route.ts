import { prisma } from "@/shared/database/prisma";
import { redis } from "@/shared/queue/redis";
import { apiSuccess, toApiError } from "@/shared/http/response";
import { InternalError } from "@/shared/errors/AppError";

export async function GET() {
  const checks = { database: false, redis: false };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = true;
  } catch {
    checks.database = false;
  }

  try {
    const pong = await redis.ping();
    checks.redis = pong === "PONG";
  } catch {
    checks.redis = false;
  }

  const ready = checks.database && checks.redis;

  if (!ready) {
    return toApiError(
      new InternalError("Dependency not ready", checks),
    );
  }

  return apiSuccess({ status: "ready", checks });
}
