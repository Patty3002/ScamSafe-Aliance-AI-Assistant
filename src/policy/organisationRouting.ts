import type { Facts, Route, OrgId } from './types'
export const organisations: Record<OrgId,string> = {
  ORG01:'Banks and Payment Providers', ORG02:'Digital Platforms', ORG03:'Telecommunications Providers',
  ORG04:'Identity Recovery Services', ORG05:'Government Scam Reporting Services', ORG06:'Victim Support Organisations', ORG07:'Community Support Organisations',
}
export function organisationRouting(f: Facts): Route[] {
  const is = (k:string,v='Yes')=>f[k]?.values.includes(v) ?? false
  const financial = is('financial_status') || (is('financial_status','Conflicting') && f.financial_status.evidence.length>0)
  const exposure = is('exposure_status')
  const routes: Route[]=[]
  const add=(id:OrgId,rule:string,fields:string[],task:string,guidance:string)=>{
    const evidence=fields.flatMap(k=>f[k]?.evidence.flatMap(e=>e.evidence)??[])
    routes.push({id,rule,fields,task,guidance,primary:false,status:'Pending Verification',rationale:`${rule} · ${id}: ${task}. Reported evidence: ${[...new Set(evidence)].map(e=>`“${e}”`).join(' ')}`})
  }
  if(financial || is('bank_account_concern')) add('ORG01','RT01',['financial_status','bank_account_concern','exposure_type'],'Assess the reported payment or bank-account security issue','Ask authorised staff about the responsible provider’s assessment and protective options. Recovery or blocking is not guaranteed; do not share secret values.')
  if(is('platform_controlled_issue')) add('ORG02','RT02',['platform_controlled_issue','platform_evidence'],'Review the implicated platform-controlled account, listing or content','Preserve a non-sensitive description for staff to review through the platform’s own reporting process.')
  if(is('telecom_service_issue')) add('ORG03','RT03',['telecom_service_issue','telecom_evidence'],'Assess the reported SIM, number or carrier-service abuse issue','Ask staff about the carrier’s service-security or abuse process. This does not authenticate an official message.')
  if((exposure && (is('exposure_type','Identity document') || is('identity_data_exposure'))) || is('identity_misuse')) add('ORG04','RT04',['exposure_status','exposure_type','identity_data_exposure','identity_misuse'],'Assess identity protection and recovery needs','Describe the identity-data category and suspected misuse to authorised staff; do not provide document images or numbers.')
  if(is('reporting_need') && (is('contact_status') || financial || exposure)) add('ORG05','RT05',['reporting_need','contact_status','financial_status','exposure_status'],'Prepare suspected-scam reporting information for human review','Staff can explain appropriate reporting channels. This draft has not been submitted and does not guarantee investigation.')
  if(is('distress_indicator','Some') || is('distress_indicator','Severe reported')) add('ORG06','RT06',['distress_indicator'],'Discuss emotional recovery, supportive listening and aftercare','Ask what emotional support is wanted and discuss consent and a safe contact method with staff.')
  if(is('language_need','Needed') || is('accessibility_need','Needed') || is('basic_needs_impact','Immediate essentials affected') || is('basic_needs_impact','Other hardship')) add('ORG07','RT07',['language_need','accessibility_need','basic_needs_impact'],'Arrange practical language, accessibility or basic-needs navigation','Describe the specific assistance and preferred communication method. Staff can discuss accessible service or practical support options.')
  // RT08: explicit main need wins only among independently justified candidates.
  // Otherwise uniquely urgent operational issue, then sole actionable task; ties stay unresolved.
  const domains: Record<string,OrgId> = {'Financial/account':'ORG01','Platform content/account':'ORG02','Telecom service':'ORG03','Identity recovery':'ORG04','Scam reporting':'ORG05','Emotional support':'ORG06','Practical support':'ORG07'}
  let primary: OrgId | undefined=domains[f.main_actionable_issue?.value]
  if(!routes.some(r=>r.id===primary)) {
    const urgent = routes.filter(r=>r.id==='ORG01' && (is('ongoing_financial_activity') || (exposure && (is('exposure_type','Login credential')||is('exposure_type','OTP')) && is('suspicious_access'))))
    const operational=routes.filter(r=>!['ORG05','ORG06','ORG07'].includes(r.id))
    // ORG02's mandate makes content additional when a financial/identity action dominates.
    const material=operational.filter(r=>r.id!=='ORG02')
    primary=urgent.length===1?urgent[0].id:material.length===1?material[0].id:operational.length===1?operational[0].id:routes.length===1?routes[0].id:undefined
    // Immediate essentials and a financial issue can both be material. Without a stated
    // dominant need the rulebook requires staff selection, not a global bank-first rank.
    if(!urgent.length && (is('basic_needs_impact','Immediate essentials affected') || (is('distress_indicator','Severe reported') && is('distress_prevents_proceeding'))) && routes.length>1) primary=undefined
    // A current physical safety threat is the dominant issue; emotional aftercare
    // can remain additional, but does not own that immediate safety action.
    if(is('immediate_safety_threat') && !operational.length) primary=undefined
  }
  for(const r of routes) r.primary=r.id===primary
  return routes
}
