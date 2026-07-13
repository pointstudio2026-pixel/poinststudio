import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "@/shared/database/prisma";
import { logger } from "@/shared/logging/logger";

export interface RecordActivityInput {
  userId?: string;
  projectId?: string;
  eventType: string;
  payload?: Record<string, unknown>;
}

/**
 * Best-effort audit trail write (activity_logs). Never throws: a logging
 * failure must not fail the calling Use Case.
 */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId: input.userId,
        projectId: input.projectId,
        eventType: input.eventType,
        payload: (input.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  } catch (err) {
    logger.error("Failed to record activity log", {
      errorCode: "ACTIVITY_LOG_WRITE_FAILED",
      eventType: input.eventType,
      userId: input.userId,
      details: err instanceof Error ? err.message : String(err),
    });
  }
}

export interface ActivityLogEntry {
  id: string;
  eventType: string;
  projectId: string | null;
  payload: Record<string, unknown>;
  createdAt: Date;
}

/** Read-side of activity_logs, used by Task-005's "최근 활동" widget. */
export async function getRecentActivity(userId: string, limit = 10): Promise<ActivityLogEntry[]> {
  const rows = await prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  return rows.map((row) => ({
    id: row.id,
    eventType: row.eventType,
    projectId: row.projectId,
    payload: row.payload as Record<string, unknown>,
    createdAt: row.createdAt,
  }));
}
