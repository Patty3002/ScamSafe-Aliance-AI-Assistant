import { expect, it } from 'vitest'
import { reconcileAnalysis, localAnalyze, validateModelExtraction } from './analysis'
import type { ModelExtraction } from './types'

const narrative='The email used a lookalike supplier domain and requested new bank details.'
const extraction: ModelExtraction={summary:narrative,safetyAssessment:{status:'not_mentioned',evidence:[]},caseTypes:[],facts:[],missingInformation:[],conflicts:[],vulnerabilityIndicators:[],riskSignals:[],redFlags:[
  {description:'A lookalike domain may indicate supplier impersonation.',evidence:'lookalike supplier domain'},
  {description:'Unexpected payment instructions warrant scrutiny.',evidence:'requested new bank details'},
  {description:'Pressure to pay immediately.',evidence:'pay immediately or be arrested'},
]}
it('shows only AI red flags supported by supplied evidence',()=>{
  const a=reconcileAnalysis(extraction,narrative,'test')
  expect(a.mode).toBe('gemini')
  expect(a.redFlags).toHaveLength(2)
  expect(a.redFlags[0].description).toContain('impersonation')
})
it('does not invent AI red flags in demo mode',()=>expect(localAnalyze(narrative).redFlags).toEqual([]))
it('distinguishes omitted, empty and unsupported assessments',()=>{
  const {redFlags: omitted,...legacy}=extraction
  expect(reconcileAnalysis(legacy,narrative,'test').redFlagsStatus).toBe('missing')
  expect(reconcileAnalysis({...extraction,redFlags:[]},narrative,'test').redFlagsStatus).toBe('none')
  expect(reconcileAnalysis({...extraction,redFlags:[{description:'Threat',evidence:'not in the narrative'}]},narrative,'test').redFlagsStatus).toBe('unsupported')
})
it('accepts typographic differences without accepting invented evidence',()=>{
  const a=reconcileAnalysis({...extraction,redFlags:[{description:'Impersonation',evidence:'"look-alike supplier’s domain"'}]},'The email used a look‑alike supplier’s domain.','test')
  expect(a.redFlagsStatus).toBe('identified')
})
it('rejects malformed flags and accepts an empty list',()=>{
  expect(validateModelExtraction({...extraction,redFlags:[{description:'Warning',evidence:12}]})).toBe(false)
  expect(validateModelExtraction({...extraction,redFlags:[]})).toBe(true)
})
