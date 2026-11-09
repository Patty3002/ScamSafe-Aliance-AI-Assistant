import type { Analysis, AnalysisMode, Fact, ModelExtraction, Recommendation, OrganizationCategory } from './types'
import { evaluate } from './policy/ruleEngine'
import { validateExtraction, fieldDefinitions } from './policy/contract.mjs'
import { organisations } from './policy/organisationRouting'
import { POLICY_VERSION } from './policy/policyVersion'
import scenarios from './policy/scenarios.json'

export const fixtures = scenarios.map(s=>[`${s.id} — ${s.title}`,s.narrative] as const)
export const validateModelExtraction = validateExtraction
const id=()=>`SSA-${Date.now()}`
function adapt(raw:ModelExtraction,narrative:string,caseId:string,clarification:string,correction:string,mode:AnalysisMode,model:string|null):Analysis {
  const decision=evaluate(raw,{original:narrative,clarification,correction})
  const provenance=mode==='openai'?'openai_extracted':mode==='gemini'?'gemini_extracted':'demo_extracted'
  const reportedFacts:Fact[]=Object.entries(decision.facts).filter(([,f])=>f.evidence.length && !['Unknown','N/A'].includes(f.value)).map(([key,f])=>({label:`${fieldDefinitions[key][0]} · ${key.replace(/_/g,' ')}`,value:f.value,origin:f.evidence.some(e=>e.source==='correction')?'employee_correction':f.evidence.some(e=>e.source==='clarification')?'employee_clarification':provenance,evidence:[...new Set(f.evidence.flatMap(e=>e.evidence))].join(' | ')}))
  const fingerprint=JSON.stringify({facts:decision.facts,urgency:decision.urgency,provisional:decision.provisional,primary:decision.primary,missing:decision.missing,conflicts:decision.conflicts,verification:decision.verification})
  const recommendations:Recommendation[]=decision.routes.map(r=>({id:r.id,kind:r.primary?'Primary Recommendation':r.id==='ORG05'?'Follow-up / Reporting Suggestion':'Additional Recommendation',organisation:organisations[r.id] as OrganizationCategory,team:null,routingStatus:r.status==='Needs information'?'pending_clarification':'proposed',action:`Staff review proposal: ${r.task}.`,reason:r.rationale,condition:`${r.status}. ${r.primary?'Primary: dominant actionable issue.':`Distinct additional task. Primary: ${decision.primary}.`} Synthetic mandate; NOT SENT / NOT EXECUTED.`,origin:'rule_derived',ruleIds:[r.rule,'RT09','CTL01','CTL03','CTL04'],supportingFacts:r.fields.flatMap(k=>decision.facts[k]?.evidence.flatMap(e=>e.evidence)??[]),guidance:r.guidance,fingerprint}))
  if(decision.safety) recommendations.unshift({id:'internal-safety',kind:'Necessary Parallel Action',organisation:null,team:null,workflow:'Internal Safety Escalation',routingStatus:'proposed',action:'Immediately alert authorised staff to follow the internal emergency protocol. Do not wait for other details.',reason:'An explicit reported serious physical-safety threat requires immediate human attention.',condition:'Internal workflow; no automatic emergency call or external contact.',origin:'rule_derived',ruleIds:['UG01','SAFE01','CTL01'],supportingFacts:decision.facts.immediate_safety_threat.evidence.flatMap(e=>e.evidence),guidance:'If safe, explain the current situation to authorised staff. Human safety attention must not wait for case completeness.',fingerprint})
  if(decision.specialist.length) recommendations.push({id:'specialist',kind:'Necessary Parallel Action',organisation:null,team:null,workflow:'Specialist Review Required',routingStatus:'pending_clarification',action:'Authorised staff should identify qualified support or an independent official verification path.',reason:decision.specialist.join(' '),condition:'No external organisation selected for this workflow; staff review required.',origin:'rule_derived',ruleIds:['SP01','CTL01','CTL03'],supportingFacts:decision.rulesFired.filter(r=>r.id==='SP01').flatMap(r=>r.supportingFacts.flatMap(e=>e.evidence)),guidance:'Do not install software, grant remote access or use contact details in an unverified message on this assistant’s instructions.',fingerprint})
  const priority={Urgent:'P1 — Immediate',Priority:'P2 — Priority',Routine:'P3 — Standard',Undetermined:'Priority pending confirmation'} as const
  const urgencyRules=decision.rulesFired.filter(r=>r.id.startsWith('UG'))
  const interimAction=decision.safety?'Internal Safety Escalation: authorised staff must attend immediately.':decision.urgency==='Urgent'?'Prompt authorised account-security assessment; do not wait for all details.':decision.urgency==='Priority'?'Arrange prompt human assessment of the reported issue.':decision.urgency==='Routine'?'Review the reported contact and any requested reporting or access assistance.':'Urgency is Undetermined. Obtain targeted clarification and human review.'
  return {caseId,mode,analysisVersion:1,analysisHistory:[],humanOverrides:[],policyVersion:POLICY_VERSION,model,originalNarrative:narrative,workerClarifications:clarification,employeeCorrections:correction,
    // Exact source-based summary avoids presenting unverified model-generated prose as fact.
    summary:narrative.split(/(?<=[.!?])\s+/).slice(0,3).join(' '),summaryOrigin:'case_intake',caseTypes:[...(decision.facts.contact_status.value==='Yes'?['Suspicious scam contact' as const]:[]),...(decision.facts.financial_status.value==='Yes'?['Suspected Financial Loss' as const]:[]),...(decision.facts.exposure_status.value==='Yes'?['Possible identity or account credential disclosure' as const]:[])],reportedFacts,
    decision,provisional:decision.provisional,priority:priority[decision.urgency],priorityRule:urgencyRules.map(r=>`${r.id}: ${r.outcome}`).join(' · '),priorityEvidence:[...new Set(urgencyRules.flatMap(r=>r.supportingFacts.flatMap(e=>e.evidence)))],interimAction,
    safetyReviewRequired:decision.safety,safetyReviewMessage:decision.safety?'Explicit reported threat; timing/location uncertainty must not delay authorised human attention.':'',
    vulnerabilityIndicators:decision.support.map(s=>({title:s.title,evidence:decision.facts[s.field].evidence.flatMap(e=>e.evidence).join(' | '),suggestion:s.rule==='VU01'?'Emotional recovery support: ORG06.':'Practical assistance: ORG07.',origin:provenance})),
    missingInfo:decision.missing.map(t=>`${t.field}: ${t.reason}`),conflicts:decision.conflicts.map(t=>`${t.task}: ${t.reason}`),pendingVerification:decision.verification.map(t=>`${t.task} — ${t.status}. ${t.reason}`),clarifyingQuestions:decision.questions,
    modelExtraction:mode==='demo'?null:raw,recommendations,reviewDecisions:Object.fromEntries(recommendations.map(r=>[r.id,{state:'pending',editedAction:'',editedTeam:'',notes:''}]))}
}
export function reconcileAnalysis(raw:unknown,narrative:string,caseId:string,clarification='',correction='',provider:'gemini'|'openai'='gemini',version=POLICY_VERSION,model:string|null=null):Analysis {
  if(version!==POLICY_VERSION || !validateExtraction(raw,{original:narrative,clarification,correction})) throw new Error('Model extraction failed schema/evidence or policy-version validation. No successful analysis is available.')
  return adapt(raw,narrative,caseId,clarification,correction,provider,model)
}
export function localAnalyze(narrative:string,caseId=id(),clarification='',correction=''):Analysis {
  const a=adapt({summary:'',facts:[]},narrative,caseId,clarification,correction,'demo',null)
  return {...a,summary:'Semantic extraction is unavailable. The original report is preserved for authorised staff review.',safetyReviewRequired:true,safetyReviewMessage:'Extraction failed or is unavailable. Safety has not been assessed. An authorised person must review the original report immediately for safety concerns.',interimAction:'Analysis unavailable: priority remains Undetermined. Review the original report with authorised staff.'}
}
export function caseInformationFacts(facts:Fact[]):Fact[] {return facts.slice(0,8)}
