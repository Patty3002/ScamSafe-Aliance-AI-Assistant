import { describe, expect, it } from 'vitest'
import { analysisMode, loadBusinessPolicy, validateModelShape, providerFailure } from './server.mjs'

const validExtraction = {
  summary: 'A person reported a suspicious contact.',
  safetyAssessment: { status: 'not_mentioned', evidence: [] },
  caseTypes: [],
  facts: [],
  missingInformation: [],
  conflicts: [],
  vulnerabilityIndicators: [],
  riskSignals: [],
}

describe('Model server safeguards', () => {
  it('distinguishes model, access and quota failures without exposing provider payloads', () => {
    expect(providerFailure('gemini',404)).toContain('model or endpoint was not found')
    expect(providerFailure('gemini',403)).toContain('Access was denied')
    expect(providerFailure('gemini',429)).toContain('Quota or rate limit')
  })
  it('loads Policy 1.0 from the sole authoritative Markdown file', async () => {
    const policy=await loadBusinessPolicy()
    expect(policy.version).toBe('1.0')
    expect(policy.text).toContain('唯一生效的业务决策政策')
    expect(policy.text).toContain('R1 — 理解当事人报告的事实')
  })

  it('defaults to Gemini per Rules v4.2 and supports explicitly selected OpenAI', () => {
    expect(analysisMode({})).toBe('demo')
    expect(analysisMode({ GEMINI_API_KEY: 'configured' })).toBe('gemini')
    expect(analysisMode({ OPENAI_API_KEY: '  ' })).toBe('demo')
    expect(analysisMode({ AI_PROVIDER: 'openai', OPENAI_API_KEY: 'configured' })).toBe('openai')
  })

  it('accepts the extraction contract and rejects unsupported fields', () => {
    expect(validateModelShape(validExtraction)).toBe(true)
    expect(validateModelShape({ ...validExtraction, priority: 'P1 — Immediate' })).toBe(false)
    expect(validateModelShape({ ...validExtraction, safetyAssessment: { status: 'current_danger', evidence: [null] } })).toBe(false)
  })
})
