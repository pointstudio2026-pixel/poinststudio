import type { HardConstraintSet, SoftPreferenceSet } from "@/modules/promptPriority/domain/HardConstraint";
import type { ConflictResult } from "@/modules/promptPriority/domain/conflictDetection";
import type { PromptComplianceResult } from "@/modules/promptPriority/domain/promptComplianceCheck";

export interface PromptDecisionRecord {
  id: string;
  promptVersionId: string;
  hardConstraints: HardConstraintSet;
  softPreferences: SoftPreferenceSet;
  dbCandidatesFound: string[];
  dbCandidatesUsed: string[];
  conflicts: ConflictResult[];
  complianceCheck: PromptComplianceResult;
  createdAt: Date;
}

export interface CreatePromptDecisionRecordInput {
  promptVersionId: string;
  hardConstraints: HardConstraintSet;
  softPreferences: SoftPreferenceSet;
  dbCandidatesFound: string[];
  dbCandidatesUsed: string[];
  conflicts: ConflictResult[];
  complianceCheck: PromptComplianceResult;
}
