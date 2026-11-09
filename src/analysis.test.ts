import { describe,it,expect } from 'vitest'
import { evaluate, type StaffVerification } from './policy/ruleEngine'
import { workingFacts } from './policy/ruleEngine'
import { validateExtraction } from './policy/contract.mjs'
import { RULE_IDS } from './policy/policyVersion'
import { structuredScenarios } from './policy/structuredScenarios'
import { reconcileAnalysis,localAnalyze } from './analysis'
import { buildReport } from './report'
import { applyHumanOverride } from './policy/staffReview'
import type { Extraction, Sources } from './policy/types'
const run=(values:Record<string,string|string[]>,verified:StaffVerification={})=>{
 const original='Synthetic structured report for predicate testing.'
 const extraction:Extraction={summary:'',facts:Object.entries(values).flatMap(([field,v])=>(Array.isArray(v)?v:[v]).map(value=>({field,value,source:'original',evidence:[original]})))}
 return evaluate(extraction,{original,clarification:'',correction:''},verified)
}
const ids=(d:ReturnType<typeof run>)=>d.rulesFired.map(r=>r.id)

describe('urgency predicates, boundaries and evidence gates',()=>{
 it('UG01 precedes completeness; safety is never an external organisation',()=>{
  const d=run({immediate_safety_threat:'Yes'});expect(ids(d).slice(0,2)).toEqual(['UG01','SAFE01']);expect(d.urgency).toBe('Urgent');expect(d.routes).toEqual([])
 })
 it('UG02 requires reported ongoing activity; amount/time do not create urgency',()=>{
  expect(run({financial_status:'Yes',amount:'A$999999',transaction_time:'Just now'}).urgency).toBe('Priority')
  expect(run({financial_status:'Yes',ongoing_financial_activity:'No'}).urgency).toBe('Priority')
  expect(run({financial_status:'Yes',ongoing_financial_activity:'Yes'}).urgency).toBe('Urgent')
 })
 it('UG03 requires exposure, credential subtype and suspicious access',()=>{
  for(const type of ['Login credential','OTP']){
   expect(run({exposure_status:'Yes',exposure_type:type}).urgency).toBe('Priority')
   const d=run({exposure_status:'Yes',exposure_type:type,suspicious_access:'Yes',bank_account_concern:'Yes'})
   expect(d.urgency).toBe('Urgent');expect(ids(d)).toContain('UG03')
  }
  expect(run({exposure_status:'Yes',exposure_type:'BSB+account',suspicious_access:'Yes'}).urgency).toBe('Undetermined')
 })
 it('UG05 separates identity documents, receiving identifiers and stored credentials',()=>{
  expect(run({exposure_status:'Yes',exposure_type:'Identity document'}).urgency).toBe('Priority')
  const stored=run({device_credential_exposure:'credentials stored only on device'})
  expect(stored.facts.exposure_status.value).toBe('Unknown');expect(stored.routes).toEqual([]);expect(stored.urgency).toBe('Undetermined')
 })
 it('UG06 requires essentials affected or severe distress preventing progress',()=>{
  expect(run({distress_indicator:'Severe reported'}).urgency).toBe('Undetermined')
  expect(run({distress_indicator:'Severe reported',distress_prevents_proceeding:'Yes'}).urgency).toBe('Priority')
  expect(run({basic_needs_impact:'Immediate essentials affected'}).urgency).toBe('Priority')
  expect(run({language_need:'Needed',accessibility_need:'Needed'}).urgency).toBe('Undetermined')
 })
 it('UG07 cannot infer no interaction, no financial event or no disclosure from absence',()=>{
  const routine={contact_status:'Yes',contact_action:'None',financial_status:'No',exposure_status:'No'}
  expect(run(routine).urgency).toBe('Routine')
  for(const key of ['contact_action','financial_status','exposure_status']) expect(run({...routine,[key]:'Unknown'}).urgency).toBe('Undetermined')
  expect(run({...routine,immediate_safety_threat:'Yes'}).urgency).toBe('Urgent')
  expect(run({...routine,distress_indicator:'Some'}).urgency).toBe('Undetermined')
 })
 it('UG09 takes highest priority and independently verified decisive facts clear the overlay',()=>{
  const values={financial_status:'Yes',ongoing_financial_activity:'Yes',immediate_safety_threat:'Yes'}
  expect(run(values).provisional).toBe(true)
  expect(run(values,{ongoing_financial_activity:{reference:'Synthetic provider record',authorisedBy:'Synthetic staff'},immediate_safety_threat:{reference:'Synthetic safety review',authorisedBy:'Synthetic staff'}}).provisional).toBe(false)
  const verified={reference:'Synthetic record',authorisedBy:'Synthetic staff'}
  expect(run({exposure_status:'Yes',exposure_type:'Login credential'},{exposure_status:verified,exposure_type:verified}).provisional).toBe(false)
 })
 it('does not accept derived fields, forged verification or unsupported evidence',()=>{
  const base={summary:'',facts:[{field:'financial_status',value:'Yes',source:'original',evidence:['Not in source']}]}
  expect(validateExtraction(base,{original:'Original',clarification:'',correction:''})).toBe(false)
  for(const field of ['urgency_level','organisation_routes','authority_verification_status','fact_review_status']) expect(validateExtraction({...base,facts:[{...base.facts[0],field}]})).toBe(false)
  expect(()=>reconcileAnalysis(base,'Original','test')).toThrow()
  expect(validateExtraction({...base,priority:'Urgent'})).toBe(false)
 })
 it('invalid/missing extraction never becomes reassuring Routine or a successful AI result',()=>{
  expect(localAnalyze('No extraction available').priority).toBe('Priority pending confirmation')
  expect(localAnalyze('No extraction available').mode).toBe('demo')
  expect(()=>reconcileAnalysis(null,'Report','test')).toThrow()
 })
})
describe('organisation responsibility boundaries',()=>{
 it('RT09/RT10: channel alone cannot select Telecom or Platform',()=>{
  for(const contact_channel of ['SMS','Call','Web','Social']) expect(run({contact_status:'Yes',contact_channel}).routes).toEqual([])
 })
 it('RT01/RT04: bank credentials and identity recovery have separate mandates',()=>{
  expect(run({exposure_status:'Yes',exposure_type:'Login credential'}).routes).toEqual([])
  expect(run({exposure_status:'Yes',exposure_type:'Login credential',bank_account_concern:'Yes'}).routes.map(r=>r.id)).toEqual(['ORG01'])
  expect(run({exposure_status:'Yes',exposure_type:'Identity document'}).routes.map(r=>r.id)).toEqual(['ORG04'])
  expect(run({exposure_status:'Yes',exposure_type:'Other',identity_data_exposure:'Yes'}).routes.map(r=>r.id)).toEqual(['ORG04'])
 })
 it('RT02/RT03 require actionable platform/carrier issues',()=>{
  expect(run({platform_controlled_issue:'Yes'}).primary).toBe('ORG02')
  expect(run({telecom_service_issue:'Yes'}).primary).toBe('ORG03')
 })
 it('RT05 requires suspected event AND reporting need',()=>{
  expect(run({reporting_need:'Yes'}).routes).toEqual([])
  const d=run({contact_status:'Yes',reporting_need:'Yes'});expect(d.primary).toBe('ORG05');expect(ids(d)).toContain('RT05')
 })
 it('VU01–VU05/RT06/RT07 separate emotional and practical support',()=>{
  expect(run({distress_indicator:'Some'}).routes.map(r=>r.id)).toEqual(['ORG06'])
  for(const v of ([{language_need:'Needed'},{accessibility_need:'Needed'},{basic_needs_impact:'Other hardship'}] as Record<string,string>[])) expect(run(v).routes.map(r=>r.id)).toEqual(['ORG07'])
  const d=run({distress_indicator:'Some',accessibility_need:'Needed'});expect(d.routes.map(r=>r.id)).toEqual(['ORG06','ORG07']);expect(d.primary).toBe('Undetermined');expect(ids(d)).toContain('VU05')
 })
 it('RT08 honours stated dominant need only among valid mandate matches; unresolved ties stay unresolved',()=>{
  const issues={telecom_service_issue:'Yes',bank_account_concern:'Yes'}
  expect(run(issues).primary).toBe('Undetermined')
  expect(run({...issues,main_actionable_issue:'Telecom service'}).primary).toBe('ORG03')
  expect(run({...issues,main_actionable_issue:'Identity recovery'}).primary).toBe('Undetermined')
  expect(run({...issues,ongoing_financial_activity:'Yes'}).primary).toBe('ORG01')
  expect(run({financial_status:'Yes',distress_indicator:'Severe reported',distress_prevents_proceeding:'Yes'}).primary).toBe('Undetermined')
 })
 it('VE06/IR07/SP01 never authenticate authority or select a carrier from a police SMS',()=>{
  const d=run({authority_claim_present:'Yes',authority_claimed_entity:'Police',contact_channel:'SMS'})
  expect(d.urgency).toBe('Undetermined');expect(d.routes).toEqual([]);expect(d.verification.find(t=>t.id==='authority')?.reason).toContain('Never use message-provided')
  expect(ids(d)).toEqual(expect.arrayContaining(['IR07','VE06','SP01']))
  expect(d.authorityVerificationStatus).toBe('Unverified')
  const verified=run({authority_claim_present:'Yes'},{authority_verification_status:{reference:'Synthetic official check',authorisedBy:'Synthetic staff',authorityOutcome:'Independently verified through official channel'}})
  expect(verified.authorityVerificationStatus).toBe('Independently verified through official channel')
  expect(verified.verification.some(t=>t.id==='authority')).toBe(false)
 })
 it('VE07/IR08/SP01: device failure is not vulnerability, exposure, or a platform mandate',()=>{
  const d=run({device_security_indicator:'device unusable',device_credential_exposure:'credentials stored only on device'})
  expect(d.support).toEqual([]);expect(d.routes).toEqual([]);expect(d.facts.exposure_status.value).toBe('Unknown')
  expect(ids(d)).toEqual(expect.arrayContaining(['IR08','VE07','SP01']))
 })
})
describe('information, provenance and control gates',()=>{
 it('human overrides require rationale, preserve computed evidence/safety and reset approvals',()=>{
  const s=structuredScenarios.find(s=>s.id==='T11')!
  const a=reconcileAnalysis(s.extraction,s.narrative,s.id)
  expect(()=>applyHumanOverride(a,{priority:'P2 — Priority',primary:'Undetermined',reason:''})).toThrow()
  expect(()=>applyHumanOverride(a,{priority:'P2 — Priority',primary:'ORG01',reason:'Staff rationale'})).toThrow()
  a.reviewDecisions['internal-safety'].state='accepted'
  const next=applyHumanOverride(a,{priority:'P2 — Priority',primary:'Undetermined',reason:'Synthetic staff assessment recorded; safety attention continues.'})
  expect(next.priority).toBe('P1 — Immediate');expect(next.safetyReviewRequired).toBe(true)
  expect(next.humanOverrides[0].priority).toBe('P2 — Priority');expect(next.reviewDecisions['internal-safety'].state).toBe('pending')
  expect(next.decision).toEqual(a.decision);expect(buildReport(next,next.reviewDecisions)).toContain('Synthetic staff assessment recorded')
 })
 it('IR01–IR06 and VE01: applicability and task requirements, not a global all-fields gate',()=>{
  const absent=run({financial_status:'No',exposure_status:'No'})
  expect(absent.missing.some(t=>['amount','exposure_type','financial_provider'].includes(t.field||''))).toBe(false)
  const active=run({financial_status:'Yes',ongoing_financial_activity:'Yes',amount:'N/A'})
  expect(active.urgency).toBe('Urgent');expect(active.missing.some(t=>t.field==='amount')).toBe(false)
  expect(active.routes[0].status).toBe('Needs information');expect(active.missing.find(t=>t.field==='financial_provider')?.reason).toContain('handover')
  expect(ids(active)).toEqual(expect.arrayContaining(['IR01','IR03','IR06','VE01','VE04']))
 })
 it('VE02 preserves both conflict quotes and provisional financial attention',()=>{
  const s=structuredScenarios.find(s=>s.id==='T12')!
  const d=evaluate(s.extraction,{original:s.narrative,clarification:'',correction:''})
  expect(d.conflicts[0].reason).toContain('I sent $500');expect(d.conflicts[0].reason).toContain('never transferred')
  expect(d.facts.financial_status.value).toBe('Conflicting');expect(d.urgency).toBe('Priority');expect(d.missing.some(t=>t.field==='financial_status')).toBe(false)
 })
 it('VE03/VE05: correction recomputes and preserves original provenance without proving the report',()=>{
  const sources:Sources={original:'I reported a transfer.',clarification:'',correction:'Correction: I did not send money.'}
  const raw:Extraction={summary:'',facts:[{field:'financial_status',value:'Yes',source:'original',evidence:[sources.original]}]}
  const before=reconcileAnalysis(raw,sources.original,'test')
  raw.facts.push({field:'financial_status',value:'No',source:'correction',evidence:[sources.correction]})
  const after=reconcileAnalysis(raw,sources.original,'test','',sources.correction)
  expect(before.decision.primary).toBe('ORG01');expect(after.decision.routes).toEqual([])
  expect(after.originalNarrative).toBe(sources.original);expect(after.modelExtraction?.facts).toHaveLength(2)
  expect(after.decision.facts.financial_status.review).toBe('Staff-reviewed report');expect(ids(after.decision)).toContain('VE05')
  const corrected=workingFacts(raw,sources);expect(corrected.financial_status.value).toBe('No')
 })
 it('CTL01–CTL04: proposals contain rules/evidence/guidance, human gates and no execution',()=>{
  const s=structuredScenarios.find(s=>s.id==='T06')!;const a=reconcileAnalysis(s.extraction,s.narrative,s.id)
  for(const r of a.recommendations){expect(r.ruleIds.length).toBeGreaterThan(0);expect(r.supportingFacts.length).toBeGreaterThan(0);expect(r.team).toBeNull();expect(r.guidance).toBeTruthy()}
  const report=buildReport(a,Object.fromEntries(a.recommendations.map(r=>[r.id,{state:'accepted' as const,editedAction:'',notes:''}])))
  expect(report).toContain('NOT SENT / NOT EXECUTED');expect(report).toContain('Provisional: true');expect(report).toContain('CTL04');expect(report).toContain(s.narrative)
 })
 it('all 48 rule IDs fire in structured scenarios or explicit predicate/control tests',()=>{
  const runs=structuredScenarios.map(s=>evaluate(s.extraction,{original:s.narrative,clarification:'',correction:''}))
  runs.push(run({contact_status:'Yes',reporting_need:'Yes'}),run({exposure_status:'Yes',exposure_type:'OTP',suspicious_access:'Yes',bank_account_concern:'Yes'}))
  const original='Synthetic initial report.';const correction='Synthetic correction.'
  runs.push(evaluate({summary:'',facts:[{field:'financial_status',value:'Yes',source:'correction',evidence:[correction]}]},{original,clarification:'',correction}))
  const covered=new Set(runs.flatMap(ids));expect(RULE_IDS).toHaveLength(48);expect([...RULE_IDS].filter(id=>!covered.has(id))).toEqual([])
 })
})
