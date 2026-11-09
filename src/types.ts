import type { Extraction, DecisionResult } from './policy/types'
export const CASE_TYPES = ['Suspicious scam contact', 'Suspected Financial Loss', 'Possible identity or account credential disclosure'] as const
export type CaseType = typeof CASE_TYPES[number]
export type Priority = 'P1 — Immediate' | 'P2 — Priority' | 'P3 — Standard' | 'Priority pending confirmation'
export type ReviewState = 'pending' | 'accepted' | 'modified' | 'rejected'
export type RecommendationKind = 'Primary Recommendation' | 'Additional Recommendation' | 'Necessary Parallel Action' | 'Follow-up / Reporting Suggestion'
export type AnalysisMode = 'gemini' | 'openai' | 'demo'
export type FactOrigin = 'case_intake' | 'gemini_extracted' | 'openai_extracted' | 'rule_derived' | 'employee_clarification' | 'employee_correction' | 'demo_extracted'
export type OrganizationCategory = 'Banks and Payment Providers' | 'Digital Platforms' | 'Telecommunications Providers' | 'Identity Recovery Services' | 'Government Scam Reporting Services' | 'Victim Support Organisations' | 'Community Support Organisations'
export type Fact = { label: string; value: string; origin: FactOrigin; evidence?: string }
export type Vulnerability = { title: string; evidence: string; suggestion: string; origin: FactOrigin }
export type Recommendation = {
  id: string; kind: RecommendationKind; organisation: OrganizationCategory | null; team: string | null
  ruleIds: string[]; supportingFacts: string[]; guidance: string; fingerprint: string; workflow?: string;
  routingStatus: 'proposed' | 'pending_clarification'; action: string; reason: string; condition?: string; origin: 'rule_derived'
}
export type Decision = { state: ReviewState; editedAction: string; editedTeam?: string; notes: string }
export type ReviewHistoryEntry = { analysisVersion: number; recommendation: Recommendation; decision: Decision }
export type HumanOverride = { priority: Priority; primary: string; reason: string }
export type ModelExtraction = Extraction
export type Analysis = {
  caseId: string; mode: AnalysisMode; analysisVersion: number; originalNarrative: string; workerClarifications: string; employeeCorrections: string
  policyVersion: string; model: string | null; decision: DecisionResult; provisional: boolean; humanOverrides: HumanOverride[]; analysisHistory: { version: number; clarification: string; correction: string; decision: DecisionResult; humanOverrides?: HumanOverride[] }[]
  summary: string; summaryOrigin: 'gemini_extracted' | 'openai_extracted' | 'case_intake' | 'demo_extracted'; caseTypes: CaseType[]; reportedFacts: Fact[]
  priority: Priority; priorityRule: string; priorityEvidence: string[]; interimAction: string
  safetyReviewRequired: boolean; safetyReviewMessage: string
  vulnerabilityIndicators: Vulnerability[]; missingInfo: string[]; conflicts: string[]; pendingVerification: string[]
  clarifyingQuestions: string[]; modelExtraction: ModelExtraction | null; recommendations: Recommendation[]
  reviewDecisions: Record<string, Decision>
  retainedAiConflicts?: string[]
}
