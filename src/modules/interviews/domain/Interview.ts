export interface InterviewAnswerRecord {
  questionKey: string;
  questionText: string;
  answer: string | null;
  sequence: number;
}

export interface Interview {
  id: string;
  projectId: string;
  status: "in_progress" | "completed";
  currentQuestionIndex: number;
  startedAt: Date;
  completedAt: Date | null;
  answers: InterviewAnswerRecord[];
}
