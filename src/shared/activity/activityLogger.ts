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
