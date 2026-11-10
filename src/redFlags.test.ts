import { expect,it } from 'vitest'
import { reconcileAnalysis,validateModelExtraction } from './analysis'
it('rejects legacy red-flag payloads instead of accepting a mixed contract',()=>{
 expect(validateModelExtraction({summary:'',facts:[],redFlags:[]})).toBe(false)
 expect(validateModelExtraction({summary:'',facts:[],safetyAssessment:{status:'not_mentioned',evidence:[]}})).toBe(false)
})
it('requires evidence to match the named source for current extractions',()=>{
 expect(()=>reconcileAnalysis({summary:'',facts:[{field:'contact_status',value:'Yes',source:'original',evidence:['invented quote']}]},'A report.','test')).toThrow()
 expect(reconcileAnalysis({summary:'',facts:[]},'A report.','test').mode).toBe('gemini')
})
