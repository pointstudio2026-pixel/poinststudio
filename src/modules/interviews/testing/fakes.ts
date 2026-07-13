import type { Interview } from "@/modules/interviews/domain/Interview";
import type { InterviewRepository } from "@/modules/interviews/domain/InterviewRepository";

export class FakeInterviewRepository implements InterviewRepository {
  interviews: Interview[] = [];
  private nextId = 1;

  async findActiveByProjectId(projectId: string) {
    return (
      this.interviews.find((i) => i.projectId === projectId && i.status === "in_progress") ??
      null
    );
  }

  async findLatestByProjectId(projectId: string) {
    const matches = this.interviews
      .filter((i) => i.projectId === projectId)
      .sort((a, b) => b.startedAt.getTime() - a.startedAt.getTime());
    return matches[0] ?? null;
  }

  async create(projectId: string) {
    const interview: Interview = {
      id: `interview-${this.nextId++}`,
      projectId,
      status: "in_progress",
      currentQuestionIndex: 0,
      startedAt: new Date(),
      completedAt: null,
      answers: [],
    };
    this.interviews.push(interview);
    return interview;
  }

  async saveAnswer(
    interviewId: string,
    answer: { questionKey: string; questionText: string; answer: string; sequence: number },
  ) {
    const interview = this.interviews.find((i) => i.id === interviewId);
    if (!interview) return;
    const existing = interview.answers.find((a) => a.questionKey === answer.questionKey);
    if (existing) {
      existing.answer = answer.answer;
      existing.questionText = answer.questionText;
    } else {
      interview.answers.push({ ...answer });
    }
  }

  async updateCurrentQuestionIndex(interviewId: string, index: number) {
    const interview = this.interviews.find((i) => i.id === interviewId);
    if (interview) interview.currentQuestionIndex = index;
  }

  async complete(interviewId: string) {
    const interview = this.interviews.find((i) => i.id === interviewId);
    if (!interview) throw new Error("interview not found");
    interview.status = "completed";
    interview.completedAt = new Date();
    return interview;
  }
}
