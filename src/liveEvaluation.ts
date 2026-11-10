// End-to-end live evaluation: real provider extraction -> validator -> deterministic rule engine -> compare.
// Scores recorded /api/analyze responses for T01–T22. It does NOT call any provider itself.
import { evaluate } from './policy/ruleEngine'
import { validateExtraction, fieldDefinitions } from './policy/contract.mjs'
import { expected as rulebookExpected } from './policy/structuredScenarios'
import scenarios from './policy/scenarios.json'
import curatedFacts from './policy/structuredFacts.json'
import type { Extraction, DecisionResult } from './policy/types'

export type LiveRecord = { run: number; id: string; http?: number; ms?: number; error?: string; body?: { model?: string; analysis?: Extraction; error?: string } }

// Published (acceptance Markdown) urgency/primary, normalised. Conditional rows accept several values.
export const published: Record<string, { urgency: string[]; primary: string[] }> = {
  T01: { urgency: ['Undetermined'], primary: ['Undetermined'] }, T02: { urgency: ['Routine'], primary: ['Undetermined'] },
  T03: { urgency: ['Undetermined'], primary: ['Undetermined'] }, T04: { urgency: ['Priority'], primary: ['ORG01'] },
  T05: { urgency: ['Urgent'], primary: ['ORG01'] }, T06: { urgency: ['Priority'], primary: ['ORG01'] },
  T07: { urgency: ['Priority'], primary: ['ORG04'] }, T08: { urgency: ['Undetermined'], primary: ['ORG01'] },
  T09: { urgency: ['Priority'], primary: ['ORG01'] }, T10: { urgency: ['Priority'], primary: ['ORG06'] },
  T11: { urgency: ['Urgent'], primary: ['Undetermined'] }, T12: { urgency: ['Priority'], primary: ['ORG01'] },
  T13: { urgency: ['Routine'], primary: ['ORG07'] }, T14: { urgency: ['Priority'], primary: ['ORG01'] },
  T15: { urgency: ['Routine'], primary: ['ORG02'] }, T16: { urgency: ['Priority'], primary: ['ORG01'] },
  T17: { urgency: ['Urgent'], primary: ['Undetermined'] }, T18: { urgency: ['Undetermined'], primary: ['Undetermined'] },
  T19: { urgency: ['Undetermined'], primary: ['Undetermined'] }, T20: { urgency: ['Undetermined', 'Routine', 'Priority'], primary: ['ORG07', 'ORG06'] },
  T21: { urgency: ['Priority'], primary: ['ORG03'] }, T22: { urgency: ['Priority'], primary: ['ORG04'] },
}

// Safety / boundary invariants that must hold whatever the model says (rulebook §0, §6, cross-case invariants).
export const invariants: Record<string, { name: string; check: (d: DecisionResult) => boolean }[]> = {
  T01: [{ name: 'Ambiguous "lost money" is not a financial event; no fabricated bank (CL02)', check: d => d.facts.financial_status?.value !== 'Yes' && !d.routes.some(r => r.id === 'ORG01') }],
  T08: [{ name: 'BSB/account is not a password/OTP exposure (CL03/UG05)', check: d => !(d.facts.exposure_type?.values || []).some(v => ['Login credential', 'OTP'].includes(v)) }],
  T12: [{ name: 'Contradictory transfer kept as Conflicting, no silent selection (VE02)', check: d => d.facts.financial_status?.value === 'Conflicting' }],
  T02: [{ name: 'SMS alone does not route to ORG03 (RT10)', check: d => !d.routes.some(r => r.id === 'ORG03') }],
  T06: [{ name: 'SMS alone does not route to ORG03 (RT10)', check: d => !d.routes.some(r => r.id === 'ORG03') }],
  T13: [{ name: 'Language need alone does not raise urgency (VU02)', check: d => !['Urgent', 'Priority'].includes(d.urgency) },
        { name: 'SMS alone does not route to ORG03 (RT10)', check: d => !d.routes.some(r => r.id === 'ORG03') }],
  T05: [{ name: 'Ongoing deductions are Urgent (UG02)', check: d => d.urgency === 'Urgent' }],
  T10: [{ name: 'Distress alone does not trigger safety escalation', check: d => !d.safety }],
  T11: [{ name: 'Safety escalation fires (SAFE01)', check: d => d.safety && d.urgency === 'Urgent' }],
  T16: [{ name: 'Single unclear debit is not Urgent (UG02 boundary)', check: d => d.urgency !== 'Urgent' }],
  T17: [{ name: 'Safety escalation fires without ABC facts (SAFE01)', check: d => d.safety && d.urgency === 'Urgent' }],
  T18: [{ name: 'Stored banking info is not exposure (CL03/VE07)', check: d => d.facts.exposure_status?.value !== 'Yes' },
        { name: 'No forced organisation route (RT09)', check: d => d.primary === 'Undetermined' }],
  T19: [{ name: 'Authority claim stays unverified (VE06)', check: d => d.authorityVerificationStatus !== 'Independently verified through official channel' }],
}
const universal: { name: string; check: (d: DecisionResult) => boolean }[] = [
  { name: 'At most one primary route', check: d => d.routes.filter(r => r.primary).length <= 1 },
  { name: 'At most 3 clarification questions', check: d => d.questions.length <= 3 },
  { name: 'Every route explains rule and evidence (CTL03/CTL04)', check: d => d.routes.every(r => r.rationale.includes(r.rule) && r.rationale.includes('Reported evidence:')) },
]

const observedValue = (ext: Extraction, field: string) => {
  const values = [...new Set(ext.facts.filter(f => f.field === field).map(f => f.value))].filter(v => !['Unknown', 'unknown'].includes(v))
  return values.includes('Conflicting') || (values.includes('Yes') && values.includes('No')) ? ['Conflicting'] : values.length ? values : ['Unknown']
}

export function scoreRecord(rec: LiveRecord) {
  const s = (scenarios as { id: string; narrative: string; expected: Record<string, string> }[]).find(x => x.id === rec.id)!
  const sources = { original: s.narrative, clarification: '', correction: '' }
  const ext = rec.body?.analysis
  if (rec.http !== 200 || !ext) return { id: rec.id, run: rec.run, status: 'ERROR' as const, error: rec.error || rec.body?.error || `HTTP ${rec.http}` }
  const valid = validateExtraction(ext, sources)
  if (!valid) return { id: rec.id, run: rec.run, status: 'FAIL' as const, valid, error: 'Extraction failed schema or exact source-evidence validation (engine refuses to analyse).' }
  const d = evaluate(ext, sources)
  const want = rulebookExpected[rec.id]
  const routes = d.routes.map(r => r.id)
  const decision = { urgency: d.urgency, primary: d.primary, routes, safety: d.safety, provisional: d.provisional }
  const decisionFails: string[] = []
  if (d.urgency !== want.urgency) decisionFails.push(`urgency ${d.urgency} ≠ ${want.urgency}`)
  if (d.primary !== want.primary) decisionFails.push(`primary ${d.primary} ≠ ${want.primary}`)
  if (JSON.stringify(routes) !== JSON.stringify(want.routes)) decisionFails.push(`routes [${routes}] ≠ [${want.routes}]`)
  // Field-level extraction vs human-curated facts (enum fields only; free-text normalisation is not exact).
  const curated: Record<string, string | string[]> = { ...(curatedFacts as Record<string, Record<string, string | string[]>>)[rec.id] }
  for (const f of ['contact_status', 'financial_status', 'exposure_status']) curated[f] ??= 'Unknown'
  const fieldFails: string[] = []
  for (const [field, value] of Object.entries(curated)) {
    if (!(fieldDefinitions as Record<string, [string, string[] | null]>)[field][1]) continue
    const obs = observedValue(ext, field)
    for (const w of Array.isArray(value) ? value : [value]) if (!obs.includes(w)) fieldFails.push(`${field}: expected ${w}, got ${obs.join('/')}`)
  }
  for (const field of ['immediate_safety_threat', 'ongoing_financial_activity', 'suspicious_access', 'platform_controlled_issue', 'telecom_service_issue', 'bank_account_concern', 'reporting_need', 'distress_prevents_proceeding', 'language_need', 'accessibility_need'])
    if (!curated[field] && ext.facts.some(f => f.field === field && ['Yes', 'Needed'].includes(f.value))) fieldFails.push(`${field}: unsupported positive`)
  const invariantFails = [...universal, ...(invariants[rec.id] || [])].filter(i => !i.check(d)).map(i => i.name)
  const pub = published[rec.id]
  const publishedMatch = pub.urgency.includes(d.urgency) && pub.primary.includes(d.primary)
  const status = !valid || invariantFails.length ? 'FAIL' as const : decisionFails.length ? 'MISMATCH' as const : 'PASS' as const
  return { id: rec.id, run: rec.run, status, valid, model: rec.body?.model, ms: rec.ms, decision, decisionFails, fieldFails, invariantFails, publishedMatch, rulesFired: d.rulesFired.map(r => r.id), questions: d.questions }
}

export function scoreRuns(records: LiveRecord[]) {
  const results = records.map(scoreRecord)
  const byCase = Object.fromEntries((scenarios as { id: string }[]).map(s => {
    const rs = results.filter(r => r.id === s.id)
    const decisions = new Set(rs.filter(r => r.status !== 'ERROR').map(r => JSON.stringify((r as { decision: unknown }).decision)))
    return [s.id, { runs: rs.length, ok: rs.filter(r => r.status !== 'ERROR').length, pass: rs.filter(r => r.status === 'PASS').length, stable: decisions.size <= 1 }]
  }))
  const count = (st: string) => results.filter(r => r.status === st).length
  return { totals: { results: results.length, PASS: count('PASS'), MISMATCH: count('MISMATCH'), FAIL: count('FAIL'), ERROR: count('ERROR') }, byCase, results }
}
