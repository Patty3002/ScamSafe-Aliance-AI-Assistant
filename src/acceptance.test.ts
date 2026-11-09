import { describe,it,expect } from 'vitest'
import { evaluate } from './policy/ruleEngine'
import { structuredScenarios } from './policy/structuredScenarios'
import { reconcileAnalysis } from './analysis'

describe('T01–T22 rulebook-derived deterministic acceptance (published discrepancies documented)',()=>{
 it.each(structuredScenarios)('$id: $title',s=>{
   const d=evaluate(s.extraction,{original:s.narrative,clarification:'',correction:''})
   expect(d.urgency).toBe(s.rulebookExpected.urgency)
   expect(d.primary).toBe(s.rulebookExpected.primary)
   expect(d.routes.map(r=>r.id)).toEqual(s.rulebookExpected.routes)
   expect(d.questions.length).toBeLessThanOrEqual(3)
   expect(d.routes.filter(r=>r.primary).length).toBeLessThanOrEqual(1)
   for(const route of d.routes){expect(route.rationale).toContain(route.rule);expect(route.rationale).toContain('Reported evidence:')}
   for(const trace of d.rulesFired) for(const fact of trace.supportingFacts) for(const quote of fact.evidence) expect(s.narrative).toContain(quote)
   const a=reconcileAnalysis(s.extraction,s.narrative,s.id)
   expect(a.policyVersion).toBe('1.1')
   expect(a.recommendations.every(r=>a.reviewDecisions[r.id].state==='pending')).toBe(true)
 })
 it('contains exactly the new 22 scenarios',()=>expect(structuredScenarios.map(s=>s.id)).toEqual(Array.from({length:22},(_,i)=>`T${String(i+1).padStart(2,'0')}`)))
})
