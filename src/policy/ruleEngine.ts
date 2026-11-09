import { fieldDefinitions, multiFields, validateExtraction } from './contract.mjs'
import { organisationRouting } from './organisationRouting'
import type { DecisionResult, EvidenceFact, Extraction, Facts, Sources, Task } from './types'

export type StaffVerification = Record<string,{reference:string; authorisedBy:string; authorityOutcome?: 'Independently verified through official channel'|'Impersonation confirmed by authorised source'}>
export function workingFacts(extraction:Extraction, sources:Sources, verified:StaffVerification={}): Facts {
  if(!validateExtraction(extraction,sources)) throw new Error('Extraction schema or source evidence is invalid. Analysis not performed.')
  const facts:Facts={}
  for(const key of Object.keys(fieldDefinitions)) {
    const all=extraction.facts.filter(f=>f.field===key)
    const corrections=all.filter(f=>f.source==='correction')
    const evidence=corrections.length?corrections:all
    const values=[...new Set(evidence.map(f=>f.value))]
    const known=values.filter(v=>!['Unknown','unknown'].includes(v))
    const conflict=known.includes('Conflicting') || (!multiFields.includes(key) && known.length>1)
    const resolved=conflict?['Conflicting']:known.length?known:['Unknown']
    const confirmed=verified[key]?.reference.trim() && verified[key]?.authorisedBy.trim()
    facts[key]={value:resolved.join(', '),values:resolved,evidence,review:conflict?'Conflicting':confirmed?'Independently verified':corrections.length?'Staff-reviewed report':'Reported'}
  }
  return facts
}

export function evaluate(extraction:Extraction,sources:Sources,verified:StaffVerification={}):DecisionResult {
  const f=workingFacts(extraction,sources,verified)
  const result:DecisionResult={facts:f,urgency:'Undetermined',provisional:false,safety:false,routes:[],primary:'Undetermined',missing:[],conflicts:[],verification:[],rulesFired:[],questions:[],support:[],specialist:[],handoverReviewStatus:'Draft',authorityVerificationStatus:'N/A'}
  const is=(k:string,v='Yes')=>f[k]?.values.includes(v)??false
  const unknown=(k:string)=>is(k,'Unknown')||is(k,'unknown')
  const evidence=(fields:string[])=>fields.flatMap(k=>f[k]?.evidence??[])
  const fire=(id:string,fields:string[],outcome:string)=>{
    result.rulesFired.push({id,fields,supportingFacts:evidence(fields),outcome,assumptions:['Synthetic educational mandate; reported facts are not proof.'],uncertainties:fields.filter(k=>unknown(k)||is(k,'Conflicting')),review:'Human review required; NOT SENT / NOT EXECUTED'})
  }
  const task=(list:Task[],id:string,ruleIds:string[],text:string,reason:string,status:Task['status'],field?:string)=>list.push({id,ruleIds,task:text,reason,status,field})
  const need=(field:string,rule:string,reason:string,question:string)=>{
    if(!unknown(field)) return
    if(!result.missing.some(t=>t.field===field)) task(result.missing,`missing-${field}`,[rule,'VE01'],question,reason,'Needs information',field)
    if(!result.questions.includes(question)) result.questions.push(question)
  }
  const verify=(id:string,rules:string[],text:string,fields:string[])=>{
    if(fields.some(k=>f[k]?.review!=='Independently verified')) task(result.verification,id,rules,text,'Reported or staff-reviewed wording is not independent verification.','Pending Verification')
  }
  const urgency:{level:'Urgent'|'Priority'|'Routine';fields:string[]}[]=[]
  const setUrgency=(id:string,level:'Urgent'|'Priority'|'Routine',fields:string[])=>{urgency.push({level,fields});fire(id,fields,level)}
  // UG01 / SAFE01 execute before information requirements and external routing.
  if(is('immediate_safety_threat')) {
    result.safety=true;setUrgency('UG01','Urgent',['immediate_safety_threat'])
    fire('SAFE01',['immediate_safety_threat'],'Internal Safety Escalation: authorised staff follow internal emergency protocol immediately; no automatic call.')
    task(result.verification,'safety',['SAFE01','VE04'],'Immediate authorised human safety attention','Do not wait for timing, location, classification or handover details.','Awaiting review')
    result.questions.push('If safe to answer, what is the current safety situation and location for authorised staff?')
  }
  for(const [field,id] of [['contact_status','CL01'],['financial_status','CL02'],['exposure_status','CL03']]) fire(id,[field],`${field}=${f[field].value}; absence remains Unknown`)
  fire('IR01',['contact_status','financial_status','exposure_status','immediate_safety_threat'],'Preserve original narrative and task-relevant reported evidence')
  const financial=is('financial_status')||is('financial_status','Conflicting')
  const exposure=is('exposure_status')
  const credential=is('exposure_type','Login credential')||is('exposure_type','OTP')
  if(is('ongoing_financial_activity')) setUrgency('UG02','Urgent',['ongoing_financial_activity'])
  if(exposure&&credential&&is('suspicious_access')) setUrgency('UG03','Urgent',['exposure_status','exposure_type','suspicious_access'])
  const hasUrgent=urgency.some(u=>u.level==='Urgent')
  if(financial&&!hasUrgent) setUrgency('UG04','Priority',['financial_status'])
  if(!hasUrgent&&exposure&&(credential||is('exposure_type','Identity document')||is('identity_misuse'))) setUrgency('UG05','Priority',credential||is('exposure_type','Identity document')?['exposure_status','exposure_type']:['exposure_status','identity_misuse'])
  if(!result.safety&&(is('basic_needs_impact','Immediate essentials affected')||(is('distress_indicator','Severe reported')&&is('distress_prevents_proceeding')))) setUrgency('UG06','Priority',is('basic_needs_impact','Immediate essentials affected')?['basic_needs_impact']:['distress_indicator','distress_prevents_proceeding'])
  const warning=is('immediate_safety_threat')||is('immediate_safety_threat','Conflicting')||is('ongoing_financial_activity')||is('distress_indicator','Some')||is('distress_indicator','Severe reported')||is('basic_needs_impact','Immediate essentials affected')||is('basic_needs_impact','Other hardship')
  // UG07: explicit event negatives and no interaction; V2/V3 alone do not raise urgency.
  if(!urgency.length && is('contact_status')&&is('contact_action','None')&&is('financial_status','No')&&is('exposure_status','No')&&!warning) setUrgency('UG07','Routine',['contact_status','contact_action','financial_status','exposure_status'])
  if(urgency.length) {
    const rank={Urgent:3,Priority:2,Routine:1}
    result.urgency=urgency.reduce((a,b)=>rank[a.level]>=rank[b.level]?a:b).level
    const decisive=urgency.filter(u=>u.level===result.urgency).flatMap(u=>u.fields)
    result.provisional=decisive.some(k=>f[k].review!=='Independently verified')
    fire('UG09',decisive,`Maximum triggered urgency ${result.urgency}; Provisional=${result.provisional}`)
  } else {
    fire('UG08',['contact_status','financial_status','exposure_status'],'Undetermined; do not infer low risk')
    need('financial_status','IR01','Financial event changes urgency and mandate','Was there a scam-related payment or unexpected transaction?')
    need('exposure_status','IR01','Disclosure changes urgency and protection task','Was information entered or shared, and of what category? Do not provide secret values.')
    need('contact_status','IR01','Clarify whether this is a suspected scam event','What happened and what makes the contact or loss suspicious?')
  }
  if(is('contact_status')) {
    fire('IR02',['contact_channel','contact_action','contact_time'],'Check contact details for triage and relevant tasks')
    need('contact_action','IR02','No-interaction evidence is required for Routine','What action was taken after the contact?')
    need('contact_channel','IR02','Contact description for assessment','Through which channel did the contact occur?')
    need('contact_time','IR02','Approximate time for incident assessment','Approximately when did the contact occur?')
  }
  if(financial) {
    fire('IR03',['financial_event_type','amount','transaction_time','financial_provider','transaction_authorisation','ongoing_financial_activity','provider_contacted'],'Check transaction-specific requirements; unknown amount does not delay attention')
    for(const [key,reason,question] of [
      ['ongoing_financial_activity','Urgency reassessment','Are further unexpected transactions continuing?'],
      ['financial_provider','Named-provider handover only','Which provider or provider category is involved?'],
      ['financial_event_type','Transaction assessment','Was this an induced transfer, unexplained transaction or reported scam-related loss?'],
      ['transaction_authorisation','Transaction assessment','Do you recognise or recall authorising the transaction?'],
      ['provider_contacted','Avoid duplicate next steps','Has the responsible provider been contacted?'],
      ['transaction_time','Transaction assessment','Approximately when did the transaction occur?'],
      ['amount','Transaction assessment; does not block preliminary advice','What approximate synthetic amount was involved?'],
    ]) need(key,'IR03',reason,question)
    verify('financial-assessment',['IR03','VE03'], 'Provider transaction assessment requires authorised verification',['financial_status'])
  }
  if(exposure) {
    fire('IR04',['exposure_type','exposure_time','suspicious_access','identity_misuse'],'Check exposure category and applicable misuse signals')
    need('exposure_type','IR04','Exposure subtype determines protection','What category of information was exposed? Do not provide the actual values.')
    need('exposure_time','IR04','Exposure assessment','Approximately when was the information shared?')
    if(credential) need('suspicious_access','IR04','UG03 versus UG05','Has suspicious account access or active misuse been noticed?')
    if(credential) need('bank_account_concern','IR04','Account mandate depends on bank linkage','Was the affected credential linked to a bank/payment account or another service? State the category only.')
    if(is('exposure_type','Identity document')) need('identity_misuse','IR04','Identity recovery assessment','Have any signs of identity misuse been reported?')
    verify('exposure-assessment',['IR04','VE03'],'Exposure/protection assessment remains unverified',['exposure_status'])
  }
  const supports=[
    ['distress_indicator','VU01','V1 · Emotional recovery',is('distress_indicator','Some')||is('distress_indicator','Severe reported')],
    ['language_need','VU02','V2 · Language assistance',is('language_need','Needed')],
    ['accessibility_need','VU03','V3 · Digital/accessibility assistance',is('accessibility_need','Needed')],
    ['basic_needs_impact','VU04','V4 · Basic-needs support',is('basic_needs_impact','Immediate essentials affected')||is('basic_needs_impact','Other hardship')],
  ] as const
  for(const [field,rule,title,active] of supports) if(active) {result.support.push({field,rule,title});fire(rule,[field],title)}
  if(result.support.length) {
    fire('IR05',result.support.map(s=>s.field),'Check distinct support task and requested assistance')
    need('support_details','IR05','Appropriate support handover','What specific support and communication method would help?')
  }
  if(result.support.some(s=>s.rule==='VU01')&&result.support.some(s=>s.rule!=='VU01')) fire('VU05',result.support.map(s=>s.field),'Separate emotional recovery and practical support tasks')
  if(is('distress_indicator','Severe reported')) need('distress_prevents_proceeding','IR05','UG06 requires material impact on proceeding','Is the distress preventing the person from proceeding?')
  if(is('authority_claim_present')) {
    const authorityReview=verified.authority_verification_status
    result.authorityVerificationStatus=authorityReview?.reference.trim()&&authorityReview?.authorisedBy.trim()&&authorityReview.authorityOutcome?authorityReview.authorityOutcome:'Unverified'
    fire('IR07',['authority_claim_present','authority_claimed_entity','authority_contact_action','authority_request'],'Clarify claimed entity, request, pressure and actions without assuming authenticity')
    need('authority_claimed_entity','IR07','Official-channel verification','What type of authority was claimed?')
    need('authority_request','IR07','Verification checklist','What action, deadline or payment/information request was made, and was a link or number supplied?')
    need('authority_contact_action','IR07','Determine subsequent risk','What actions were taken in response to the claimed official message?')
    if(result.authorityVerificationStatus==='Unverified') {
      fire('VE06',['authority_claim_present'],'Authenticity unverified; use independently sourced official contact details, never message links/numbers')
      task(result.verification,'authority',['VE06','SP01'],'Verify claimed authority through independently sourced official contact details','Neither authenticity nor fraud can be established from wording. Never use message-provided links/numbers.','Pending Verification')
      result.specialist.push('Authority authenticity is outside the seven external mandates.')
    }
  }
  const device=f.device_security_indicator.values.some(v=>!['Unknown','unknown','N/A','none reported'].includes(v)) || f.device_action_taken.values.some(v=>!['Unknown','unknown','N/A'].includes(v)) || f.device_credential_exposure.values.some(v=>!['Unknown','unknown','N/A'].includes(v))
  if(device) {
    fire('IR08',['device_security_indicator','device_action_taken','device_credential_exposure'],'Check device actions and entered versus stored credentials; no malware/exposure inference')
    for(const [key,q] of [['device_action_taken','Were files downloaded, software installed, permissions granted or remote access enabled?'],['device_credential_exposure','Were credentials entered on the suspicious page or only stored on the device? Do not provide secret values.'],['suspicious_access','Have account access anomalies been noticed?']]) need(key,'IR08','Qualified device/account assessment',q)
    fire('VE07',['device_security_indicator','device_action_taken','device_credential_exposure'],'Pending qualified device assessment; no automatic device control')
    task(result.verification,'device',['VE07','SP01'],'Qualified device-security assessment','A device anomaly does not establish malware or disclosure.','Pending Specialist Review')
    result.specialist.push('Device-security assessment is outside the seven external mandates.')
  }
  for(const [key,fact] of Object.entries(f)) if(fact.value==='Conflicting') {
    fire('VE02',[key],'Preserve conflicting source statements; authorised staff clarify')
    task(result.conflicts,`conflict-${key}`,['VE02'],`Resolve ${key}`,fact.evidence.flatMap(e=>e.evidence).join(' | '),'Pending Verification',key)
    result.questions.unshift(`Which statement about ${key.replace(/_/g,' ')} should be used, and why?`)
  }
  result.routes=organisationRouting(f)
  result.primary=result.routes.find(r=>r.primary)?.id??'Undetermined'
  fire('RT10',['contact_channel','platform_controlled_issue','telecom_service_issue'],'Channel alone does not select an organisation')
  fire('RT09',result.routes.flatMap(r=>r.fields),'Require actionable mandate and exclusions for every route; no forced match')
  if(result.routes.length>1) fire('RT08',['main_actionable_issue',...result.routes.flatMap(r=>r.fields)],`Primary=${result.primary}; distinct additional tasks only`)
  for(const r of result.routes) {
    fire(r.rule,r.fields,r.rationale)
    fire('IR06',r.fields,`${r.id}: check task-specific handover and authorised review`)
    if(r.id==='ORG01') need('financial_provider','IR06','Named provider destination required only for handover','Which provider or provider category is involved?')
    if(r.id==='ORG02') need('platform_evidence','IR06','Identify the platform controlling the content for handover','What platform or service category controls the implicated content/account? No live links or identifiers.')
    if(r.id==='ORG03') need('telecom_evidence','IR06','Identify the carrier-service issue for handover','Which carrier/service and type of SIM, number or abuse issue are involved? No real phone numbers.')
    const destinationMissing=(r.id==='ORG01'&&unknown('financial_provider'))||(r.id==='ORG02'&&unknown('platform_evidence'))||(r.id==='ORG03'&&unknown('telecom_evidence'))
    r.status=destinationMissing?'Needs information':'Pending Verification'
    task(result.verification,`handover-${r.id}`,['IR06','VE04','CTL01'],`${r.id} handover review`,destinationMissing?'Named destination missing; category-level advice remains available.':'Staff must review destination, permitted summary, consent and relevant reported facts.',r.status)
    fire('CTL04',r.fields,`${r.id}: mandate checked; ${r.primary?'Primary: dominant actionable task':'Additional: distinct task; primary unresolved if tied'}`)
  }
  if(!result.routes.length && !result.safety && result.urgency==='Undetermined') result.specialist.push('No organisation mandate is established; clarify scope with authorised staff.')
  if(result.conflicts.length) result.specialist.push('Conflicting material facts require authorised human resolution.')
  if(result.specialist.length) fire('SP01',['device_security_indicator','authority_claim_present',...result.conflicts.flatMap(t=>t.field?[t.field]:[])],result.specialist.join(' '))
  if(result.missing.length) fire('VE01',result.missing.flatMap(t=>t.field?[t.field]:[]),'Only applicable, task-required Unknown fields are missing; N/A excluded')
  fire('VE03',Object.keys(f).filter(k=>f[k].evidence.length>0),'Reported and staff-reviewed wording remain distinct from independent verification')
  if(sources.clarification||sources.correction) fire('VE05',extraction.facts.filter(e=>e.source!=='original').map(e=>e.field),'Recompute all decisions; preserve source and review history; invalidate changed approvals')
  if(result.verification.length||result.conflicts.length||result.missing.length) fire('VE04',[],'Task-specific review states do not suspend urgency or preliminary advice')
  fire('CTL01',[],'Mandatory human review; no automatic external or consequential action')
  fire('CTL02',[],'Synthetic categories only; never request actual secrets or full identifiers')
  fire('CTL03',Object.keys(f).filter(k=>f[k].evidence.length>0),'Attach rule IDs, evidence, uncertainty and human review state to every decision')
  result.handoverReviewStatus=result.missing.length?'Needs info':result.routes.length?'Awaiting review':'Draft'
  result.questions=[...new Set(result.questions)].slice(0,3)
  return result
}
