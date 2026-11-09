import { readFile,writeFile } from 'node:fs/promises'
import { analysisMode,extractCase,loadBusinessPolicy } from '../server.mjs'
import { fieldDefinitions } from '../src/policy/contract.mjs'
await loadBusinessPolicy()
const scenarios=JSON.parse(await readFile(new URL('../src/policy/scenarios.json',import.meta.url),'utf8'))
const expected=JSON.parse(await readFile(new URL('../src/policy/structuredFacts.json',import.meta.url),'utf8'))
const provider=analysisMode(process.env)
const report={policyVersion:'1.1',provider,model:null,status:provider==='demo'?'NOT RUN':'RUNNING',reason:provider==='demo'?'No key configured for selected provider. Mock and deterministic tests do not prove semantic extraction.':null,cases:[]}
if(provider!=='demo') {
 for(const scenario of scenarios){
  try{
   const response=await extractCase({narrative:scenario.narrative});report.model=response.model
   const actual=response.analysis.facts
   const assertions={...expected[scenario.id]}
   for(const field of ['contact_status','financial_status','exposure_status']) assertions[field]??='Unknown'
   const failures=[]
   for(const [field,value] of Object.entries(assertions)){
    if(!fieldDefinitions[field][1])continue // Narrative/text normalization is not exact prose matching.
    const records=actual.filter(f=>f.field===field)
    const values=[...new Set(records.map(f=>f.value))].filter(v=>!['Unknown','unknown'].includes(v))
    const observed=values.includes('Conflicting')||(values.includes('Yes')&&values.includes('No'))?['Conflicting']:values.length?values:['Unknown']
    for(const wanted of Array.isArray(value)?value:[value]) if(!observed.includes(wanted)) failures.push({field,expected:wanted,actual:observed})
   }
   // Ban unsupported positive vulnerabilities/mandates and urgency predicates, not just misses.
   for(const field of ['immediate_safety_threat','ongoing_financial_activity','suspicious_access','platform_controlled_issue','telecom_service_issue','bank_account_concern','reporting_need','distress_prevents_proceeding','language_need','accessibility_need']){
    if(!assertions[field]&&actual.some(f=>f.field===field&&['Yes','Needed'].includes(f.value))) failures.push({field,expected:'No supported affirmative in curated report',actual:'Positive; requires human adjudication'})
   }
   report.cases.push({id:scenario.id,status:failures.length?'FAIL':'PASS',failures,extraction:response.analysis})
  }catch(error){report.cases.push({id:scenario.id,status:'ERROR',error:error.message})}
  console.log(`${scenario.id}: ${report.cases.at(-1).status}`)
 }
 report.status=report.cases.every(c=>c.status==='PASS')?'PASS':'FAIL'
}
await writeFile(new URL('../docs/provider-evaluation.json',import.meta.url),JSON.stringify(report,null,2)+'\n')
console.log(`Live semantic evaluation: ${report.status}. ${report.reason||''}`)
if(report.status==='FAIL')process.exitCode=1
