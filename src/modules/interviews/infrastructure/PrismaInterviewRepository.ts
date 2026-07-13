import { prisma } from "@/shared/database/prisma";
import type { Interview } from "@/modules/interviews/domain/Interview";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";

function toDomain(
  row: {
    id: string;
    projectId: string;
    status: string;
    currentQuestionIndex: number;
    startedAt: Date;
    completedAt: Date | null;
  },
  answers: { questionKey: string; questionText: string; answer: unknown; sequence: number }[],
): Interview {
  return {
    id: row.id,
    projectId: row.projectId,
    status: row.status === "completed" ? "completed" : "in_progress",
    currentQuestionIndex: row.currentQuestionIndex,
    startedAt: row.startedAt,
    completedAt: row.completedAt,
    answers: answers
      .sort((a, b) => a.sequence - b.sequence)
      .map((a) => ({
        questionKey: a.questionKey,
        questionText: a.questionText,
        answer: typeof a.answer === "string" ? a.answer : null,
        sequence: a.sequence,
      })),
  };
}

export class PrismaInterviewRepository implements InterviewRepository {
  async findActiveByProjectId(projectId: string): Promise<Interview | null> {
    const row = await prisma.brandInterview.findFirst({
      where: { projectId, status: "in_progress" },
      orderBy: { startedAt: "desc" },
      include: { answers: true },
    });
    if (!row) return null;
    return toDomain(row, row.answers);
  }

  async findLatestByProjectId(projectId: string): Promise<Interview | null> {
    const row = await prisma.brandInterview.findFirst({
      where: { projectId },
      orderBy: { startedAt: "desc" },
      include: { answers: true },
    });
    if (!row) return null;
    return toDomain(row, row.answers);
  }

  async create(projectId: string): Promise<Interview> {
    const row = await prisma.brandInterview.create({
      data: { projectId },
      include: { answers: true },
    });
    return toDomain(row, row.answers);
  }

  async saveAnswer(
    interviewId: string,
    answer: { questionKey: string; questionText: string; answer: string; sequence: number },
  ): Promise<void> {
    await prisma.interviewAnswer.upsert({
      where: {
        interviewId_questionKey: { interviewId, questionKey: answer.questionKey },
      },
      create: {
        interviewId,
        questionKey: answer.questionKey,
        questionText: answer.questionText,
        answer: answer.answer,
        sequence: answer.sequence,
      },
      update: {
        answer: answer.answer,
        questionText: answer.questionText,
      },
    });
  }

  async updateCurrentQuestionIndex(interviewId: string, index: number): Promise<void> {
    await prisma.brandInterview.update({
      where: { id: interviewId },
      data: { currentQuestionIndex: index },
    });
  }

  async complete(interviewId: string): Promise<Interview> {
    const row = await prisma.brandInterview.update({
      where: { id: interviewId },
      data: { status: "completed", completedAt: new Date() },
      include: { answers: true },
    });
    return toDomain(row, row.answers);
  }
}
