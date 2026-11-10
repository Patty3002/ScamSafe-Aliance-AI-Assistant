import { describe, it, expect } from 'vitest'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { scoreRecord, scoreRuns, type LiveRecord } from './liveEvaluation'
import { structuredScenarios } from './policy/structuredScenarios'

const asRecord = (id: string, analysis: unknown, run = 0): LiveRecord => ({ run, id, http: 200, body: { analysis: analysis as never } })

describe('live E2E scorer', () => {
  it('scores the human-curated extractions as 22/22 PASS (scorer self-check)', () => {
    const s = scoreRuns(structuredScenarios.map(x => asRecord(x.id, x.extraction)))
    expect(s.totals).toMatchObject({ results: 22, PASS: 22, MISMATCH: 0, FAIL: 0, ERROR: 0 })
  })
  it('flags a safety-invariant break as FAIL (T17 without safety threat)', () => {
    const t17 = structuredScenarios.find(x => x.id === 'T17')!
    const broken = { ...t17.extraction, facts: t17.extraction.facts.filter(f => f.field !== 'immediate_safety_threat') }
    const r = scoreRecord(asRecord('T17', broken))
    expect(r.status).toBe('FAIL')
    expect('invariantFails' in r && r.invariantFails).toContain('Safety escalation fires without ABC facts (SAFE01)')
  })
  it('flags fabricated evidence quotes as FAIL', () => {
    const t02 = structuredScenarios.find(x => x.id === 'T02')!
    const r = scoreRecord(asRecord('T02', { ...t02.extraction, facts: [{ field: 'contact_status', value: 'Yes', source: 'original', evidence: ['not in the narrative'] }] }))
    expect(r.status).toBe('FAIL')
  })
  it('reports provider failures as ERROR, never PASS', () => {
    expect(scoreRecord({ run: 1, id: 'T10', http: 502, body: { error: 'Provider output failed schema or exact source-evidence validation.' } }).status).toBe('ERROR')
  })
  // Scores recorded live runs (scripts/run-live-e2e.mjs). Only `pnpm run eval:e2e:score` writes the report, so a plain
  // `pnpm test` never rewrites committed evidence. Records results; does not gate CI on model quality.
  it.runIf(existsSync('docs/live-e2e-runs.json') && process.env.npm_lifecycle_event === 'eval:e2e:score')('scores recorded live runs into docs/live-e2e-report.json', () => {
    const { records, base, status, recordedAt } = JSON.parse(readFileSync('docs/live-e2e-runs.json', 'utf8'))
    const report = { base, provider: status, recordedAt, ...scoreRuns(records) }
    writeFileSync('docs/live-e2e-report.json', JSON.stringify(report, null, 2) + '\n')
    console.table(Object.entries(report.byCase).map(([id, c]) => ({ id, ...c })))
    console.log(report.totals)
    expect(report.totals.results).toBe(records.length)
  })
})
