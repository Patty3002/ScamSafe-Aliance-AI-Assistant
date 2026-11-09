import type { Analysis, HumanOverride } from '../types'
import { containsSensitiveData } from './contract.mjs'

// A recorded human choice never rewrites the deterministic decision or verifies facts.
export function applyHumanOverride(a:Analysis,choice:HumanOverride):Analysis {
  if(!choice.reason.trim() || containsSensitiveData(choice.reason)) throw new Error('A safe, non-sensitive staff rationale is required.')
  if(!['P1 — Immediate','P2 — Priority','P3 — Standard','Priority pending confirmation'].includes(choice.priority)) throw new Error('Invalid priority.')
  if(choice.primary!=='Undetermined'&&!a.decision.routes.some(r=>r.id===choice.primary)) throw new Error('Select only a mandate-supported candidate, or Undetermined.')
  const recommendations=a.recommendations.map(r=>({...r,
    kind:r.organisation?(r.id===choice.primary?'Primary Recommendation' as const:r.id==='ORG05'?'Follow-up / Reporting Suggestion' as const:'Additional Recommendation' as const):r.kind,
    fingerprint:r.fingerprint+JSON.stringify(choice),
  }))
  return {...a,humanOverrides:[...a.humanOverrides,{...choice,reason:choice.reason.trim()}],recommendations,
    reviewDecisions:Object.fromEntries(recommendations.map(r=>[r.id,{state:'pending',editedAction:'',editedTeam:'',notes:''}]))}
}
