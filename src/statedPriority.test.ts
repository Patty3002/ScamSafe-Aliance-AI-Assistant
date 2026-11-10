import { describe, it, expect } from 'vitest'
import { evaluate } from './policy/ruleEngine'
import { STATED_PRIORITY } from './policy/organisationRouting'
import scenarios from './policy/scenarios.json'
import type { EvidenceFact } from './policy/types'

const n = (id: string) => scenarios.find(s => s.id === id)!.narrative
const fact = (field: string, value: string, evidence: string, source: EvidenceFact['source'] = 'original'): EvidenceFact => ({ field, value, source, evidence: [evidence] })
const run = (original: string, facts: EvidenceFact[], clarification = '') => evaluate({ summary: '', facts }, { original, clarification, correction: '' })

describe('RT08: model-inferred main issue does not select the primary route', () => {
  it('T20: "need someone to talk to" read as main issue → primary stays Undetermined, both support routes kept', () => {
    const t = n('T20')
    const d = run(t, [fact('distress_indicator', 'Severe reported', 'After a scam I feel very anxious'), fact('accessibility_need', 'Needed', 'I also cannot use the online reporting form because it is not accessible to me.'), fact('main_actionable_issue', 'Emotional support', 'need someone to talk to.')])
    expect(d.routes.map(r => r.id)).toEqual(['ORG06', 'ORG07'])
    expect(d.primary).toBe('Undetermined')
  })
  it('T21: telecom read as main issue → primary Undetermined, ORG01 and ORG03 both offered to staff', () => {
    const t = n('T21')
    const d = run(t, [fact('telecom_service_issue', 'Yes', 'My mobile number suddenly stopped working.'), fact('bank_account_concern', 'Yes', 'I am also concerned about bank verification messages.'), fact('main_actionable_issue', 'Telecom service', 'My mobile number suddenly stopped working.')])
    expect(d.routes.map(r => r.id)).toEqual(['ORG01', 'ORG03'])
    expect(d.primary).toBe('Undetermined')
  })
  it('a priority stated in a staff clarification is honoured', () => {
    const t = n('T21'); const c = 'The person says the SIM takeover is the most urgent issue for them.'
    const d = run(t, [fact('telecom_service_issue', 'Yes', 'My mobile number suddenly stopped working.'), fact('bank_account_concern', 'Yes', 'I am also concerned about bank verification messages.'), fact('main_actionable_issue', 'Telecom service', c, 'clarification')], c)
    expect(d.primary).toBe('ORG03')
  })
  it('single-route cases are unaffected (e.g. T05 bank stays primary)', () => {
    const t = n('T05')
    const d = run(t, [fact('financial_status', 'Yes', 'Someone made three deductions from my account and it is still happening now.'), fact('ongoing_financial_activity', 'Yes', 'and it is still happening now.'), fact('main_actionable_issue', 'Financial/account', 'Someone made three deductions from my account and it is still happening now.')])
    expect(d.primary).toBe('ORG01'); expect(d.urgency).toBe('Urgent')
  })
  it('no T01–T22 narrative states a priority, so no scenario primary depends on the model ranking', () => {
    for (const s of scenarios) expect(STATED_PRIORITY.test(s.narrative)).toBe(false)
  })
})
