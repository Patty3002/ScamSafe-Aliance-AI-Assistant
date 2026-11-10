import { describe, it, expect } from 'vitest'
import { extractiveSummary, reconcileAnalysis } from './analysis'
import scenarios from './policy/scenarios.json'

describe('case summary', () => {
  it('keeps every sentence of each T01–T22 narrative (no silent truncation)', () => {
    for (const s of scenarios) expect(extractiveSummary(s.narrative)).toBe(s.narrative)
  })
  it('T16 summary includes the second, A$1,000 deduction', () => {
    const t16 = scenarios.find(s => s.id === 'T16')!
    expect(reconcileAnalysis({ summary: '', facts: [] }, t16.narrative, 'T16').summary).toContain('another A$1,000 has been deducted')
  })
  it('marks long narratives instead of silently cutting them', () => {
    const long = Array.from({ length: 40 }, (_, i) => `Sentence ${i} about the synthetic case.`).join(' ')
    const out = extractiveSummary(long)
    expect(out.length).toBeLessThan(700)
    expect(out).toContain('[continues in reported narrative]')
    expect(long.startsWith(out.replace(' … [continues in reported narrative]', ''))).toBe(true)
  })
})
