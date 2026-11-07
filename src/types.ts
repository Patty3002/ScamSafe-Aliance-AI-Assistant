export const CASE_TYPES = ['Suspicious scam contact', 'Suspected Financial Loss', 'Possible identity or account credential disclosure'] as const
export type CaseType = typeof CASE_TYPES[number]
export type Priority = 'P1 — Immediate' | 'P2 — Priority' | 'P3 — Standard' | 'Priority pending confirmation'
export type ReviewState = 'pending' | 'accepted' | 'modified' | 'rejected'
export type RecommendationKind = 'Primary Recommendation' | 'Additional Recommendation' | 'Necessary Parallel Action' | 'Follow-up / Reporting Suggestion'
export type AnalysisMode = 'gemini' | 'openai' | 'demo'
export type FactOrigin = 'case_intake' | 'gemini_extracted' | 'openai_extracted' | 'rule_derived' | 'employee_clarification' | 'employee_correction' | 'demo_extracted'
export type OrganizationCategory = 'Banks and Payment Providers' | 'Digital Platforms' | 'Telecommunications Providers' | 'Identity Recovery Services' | 'Government Scam Reporting Services' | 'Victim Support Organisations' | 'Community Support Organisations' | "Reporting Organisation's Designated Emergency Safety Contact"
export type Fact = { label: string; value: string; origin: FactOrigin; evidence?: string }
export type Vulnerability = { title: string; evidence: string; suggestion: string; origin: FactOrigin }
export type Recommendation = {
  id: string; kind: RecommendationKind; organisation: OrganizationCategory | null; team: string | null
  routingStatus: 'proposed' | 'pending_clarification'; action: string; reason: string; condition?: string; origin: 'rule_derived'
}
export type Decision = { state: ReviewState; editedAction: string; editedTeam?: string; notes: string }
export type ReviewHistoryEntry = { analysisVersion: number; recommendation: Recommendation; decision: Decision }
export type RedFlag = { description: string; evidence: string }
export type ModelExtraction = {
  redFlags?: RedFlag[]
  summary: string
  safetyAssessment: { status: 'current_danger' | 'no_current_danger' | 'uncertain' | 'not_mentioned'; evidence: string[] }
  caseTypes: { value: CaseType; evidence: string }[]
  facts: { key: 'payment_route' | 'transaction_status' | 'amount' | 'contact_channel' | 'credential_disclosure' | 'account_control' | 'authorization' | 'institution_contact' | 'protective_action'; value: string; evidence: string; certainty: 'reported' | 'possible' | 'unclear' }[]
  missingInformation: { key: 'payment_route' | 'transaction_status' | 'institution_contact' | 'protective_action' | 'authorization' | 'credential_type' | 'current_account_access' | 'contact_channel' | 'other'; reason: string; question: string }[]
  conflicts: { topic: 'payment_route' | 'amount' | 'transaction_status' | 'authorization' | 'identity_or_credentials' | 'contact_channel' | 'other'; statements: string[]; evidence: string[]; explanation: string }[]
  vulnerabilityIndicators: { kind: 'severe_emotional_distress' | 'language_barrier' | 'digital_access' | 'accessibility' | 'essential_needs'; evidence: string }[]
  riskSignals: { kind: 'imminent_payment' | 'recent_payment_unprotected' | 'ongoing_unauthorised_debits' | 'credentials_disclosed_unprotected' | 'account_control_lost' | 'immediate_physical_danger' | 'immediate_self_harm'; evidence: string }[]
}
export type Analysis = {
  caseId: string; mode: AnalysisMode; analysisVersion: number; originalNarrative: string; workerClarifications: string; employeeCorrections: string
  policyVersion: string; model: string | null
  redFlags: RedFlag[]
  redFlagsStatus: 'unavailable' | 'missing' | 'unsupported' | 'identified' | 'none'
  summary: string; summaryOrigin: 'gemini_extracted' | 'openai_extracted' | 'case_intake' | 'demo_extracted'; caseTypes: CaseType[]; reportedFacts: Fact[]
  priority: Priority; priorityRule: string; priorityEvidence: string[]; interimAction: string
  safetyReviewRequired: boolean; safetyReviewMessage: string
  vulnerabilityIndicators: Vulnerability[]; missingInfo: string[]; conflicts: string[]; pendingVerification: string[]
  clarifyingQuestions: string[]; modelExtraction: ModelExtraction | null; recommendations: Recommendation[]
  reviewDecisions: Record<string, Decision>
  retainedAiConflicts?: string[]
}
