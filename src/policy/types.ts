export type Sources = { original: string; clarification: string; correction: string }
export type EvidenceFact = { field: string; value: string; source: keyof Sources; evidence: string[] }
export type Extraction = { summary: string; facts: EvidenceFact[] }
export type ReviewStatus = 'Reported' | 'Staff-reviewed report' | 'Independently verified' | 'Conflicting'
export type WorkingFact = { value: string; values: string[]; evidence: EvidenceFact[]; review: ReviewStatus }
export type Facts = Record<string, WorkingFact>
export type RuleTrace = { id: string; fields: string[]; supportingFacts: EvidenceFact[]; outcome: string; assumptions: string[]; uncertainties: string[]; review: string }
export type Task = { id: string; field?: string; ruleIds: string[]; task: string; reason: string; status: 'Needs information' | 'Pending Verification' | 'Pending Specialist Review' | 'Awaiting review' }
export type OrgId = 'ORG01'|'ORG02'|'ORG03'|'ORG04'|'ORG05'|'ORG06'|'ORG07'
export type Route = { id: OrgId; rule: string; fields: string[]; task: string; rationale: string; primary: boolean; guidance: string; status: Task['status'] }
export type DecisionResult = {
  facts: Facts; urgency: 'Urgent'|'Priority'|'Routine'|'Undetermined'; provisional: boolean; safety: boolean;
  routes: Route[]; primary: OrgId | 'Undetermined'; missing: Task[]; conflicts: Task[]; verification: Task[];
  rulesFired: RuleTrace[]; questions: string[]; support: { field: string; rule: string; title: string }[];
  specialist: string[]; handoverReviewStatus: 'Draft'|'Needs info'|'Awaiting review';
  authorityVerificationStatus: 'Unverified'|'Independently verified through official channel'|'Impersonation confirmed by authorised source'|'N/A';
}
