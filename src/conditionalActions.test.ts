import { expect,it } from 'vitest'
import { reconcileAnalysis,localAnalyze } from './analysis'
import { conditionalActions } from './conditionalActions'
import type { Extraction } from './policy/types'
it('derives alternative urgency from current policy without mutating the case',()=>{
 const narrative='A financial loss was reported.'
 const raw:Extraction={summary:narrative,facts:[{field:'financial_status',value:'Yes',source:'original',evidence:[narrative]}]}
 const a=reconcileAnalysis(raw,narrative,'test')
 const before=JSON.stringify(a)
 const groups=conditionalActions(a)
 expect(groups.flatMap(g=>g.cases).some(c=>c[1].includes('Urgent'))).toBe(true)
 expect(JSON.stringify(a)).toBe(before)
})
it('does not invent extraction when AI is unavailable',()=>{
 expect(conditionalActions(localAnalyze('A report.')).every(g=>g.cases.length===0)).toBe(true)
})
