import { describe, expect, it } from 'vitest'
import { localAnalyze, analyzeCase } from './analysis'
import type { ModelExtraction } from './types'
import { conditionalActions } from './conditionalActions'

describe('conditional actions and conflict corrections', () => {
  it('accepts the supplier invoice correction without requiring a currency prefix', () => {
    const narrative='The supplier invoice was A$18,460. The payment was reported as A$17,460 by bank transfer.'
    const corrected=localAnalyze(narrative,'AU-EX-2606-01','','The amount is 18460 not 17460')
    expect(corrected.conflicts).toEqual([])
    expect(corrected.reportedFacts.find(f=>f.label==='Reported Amount')?.value).toBe('AUD 18,460')
    expect(localAnalyze(narrative,'test','','The account number is 18460').conflicts.length).toBeGreaterThan(0)
    expect(localAnalyze(narrative,'test','','Maybe the amount is 18460 not 17460').conflicts.length).toBeGreaterThan(0)
  })
  it('does not reintroduce AI conflicts resolved by explicit corrections', () => {
    const narrative='I paid by bank transfer for AUD 500. I also said credit card for AUD 50.'
    const model: ModelExtraction={summary:narrative,safetyAssessment:{status:'not_mentioned',evidence:[]},caseTypes:[],facts:[],missingInformation:[],vulnerabilityIndicators:[],riskSignals:[],conflicts:[
      {topic:'payment_route',statements:['bank transfer','credit card'],evidence:['bank transfer','credit card'],explanation:'Different routes reported.'},
      {topic:'amount',statements:['AUD 500','AUD 50'],evidence:['AUD 500','AUD 50'],explanation:'Different amounts reported.'},
    ]}
    const corrected=analyzeCase(narrative,'test','','Correction: bank transfer for AUD 500, not AUD 50.',model,'gemini')
    expect(corrected.conflicts).toEqual([])
    expect(corrected.reportedFacts.find(f=>f.label==='Reported Amount')?.value).toBe('AUD 500')
    const partial=analyzeCase(narrative,'test','','Correction: bank transfer.',model,'gemini')
    expect(partial.conflicts.some(c=>/amount/i.test(c))).toBe(true)
    expect(partial.conflicts.some(c=>/route/i.test(c))).toBe(false)
    const uncertain=analyzeCase(narrative,'test','','Maybe bank transfer for AUD 500.',model,'gemini')
    expect(uncertain.conflicts.length).toBeGreaterThan(0)
  })
  it('does not mistake an authorised employee safety question for payment authorisation', () => {
    const a=localAnalyze('A suspicious message was received.')
    a.clarifyingQuestions=['Is the person in immediate danger right now, and can an authorised employee safely confirm their current situation?']
    expect(conditionalActions(a)[0].cases[0][1]).toContain('Designated Safety Contact')
  })
  it('provides distinct payment routes for an unanswered payment question', () => {
    const a = localAnalyze('I paid a scammer today.')
    const groups = conditionalActions(a)
    expect(groups.find(g => /payment made/.test(g.question))?.cases).toHaveLength(4)
  })
  it('keeps uncertain corrections blocked and permits a clear route correction', () => {
    const narrative = 'I paid by bank transfer or credit card today.'
    expect(localAnalyze(narrative).conflicts.length).toBeGreaterThan(0)
    expect(localAnalyze(narrative, 'test', '', 'Maybe credit card.').conflicts.length).toBeGreaterThan(0)
    expect(localAnalyze(narrative, 'test', '', 'Correction: I paid by bank transfer.').conflicts).toEqual([])
  })
  it('resolves conflicting amounts only with a clear single corrected amount', () => {
    const narrative = 'I transferred $100 today, but I also said $200.'
    expect(localAnalyze(narrative).conflicts.some(c => c.includes('Amount conflict'))).toBe(true)
    expect(localAnalyze(narrative, 'test', '', 'Correction: the amount was $100.').conflicts.some(c => c.includes('Amount conflict'))).toBe(false)
  })
})
