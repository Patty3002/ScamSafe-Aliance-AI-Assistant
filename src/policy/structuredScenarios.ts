import structuredFacts from './structuredFacts.json'
import scenarios from './scenarios.json'
import type { Extraction } from './types'
// Human-curated structured reports for deterministic tests; NOT a runtime narrative extractor.
// Original narratives and published expectations are generated from the canonical Markdown.
const inputs:Record<string,Record<string,string|string[]>>=structuredFacts
export const expected:Record<string,{urgency:string;primary:string;routes:string[]}>={
 T01:{urgency:'Undetermined',primary:'Undetermined',routes:[]}, T02:{urgency:'Routine',primary:'Undetermined',routes:[]},
 T03:{urgency:'Undetermined',primary:'Undetermined',routes:[]}, T04:{urgency:'Priority',primary:'ORG01',routes:['ORG01']},
 T05:{urgency:'Urgent',primary:'ORG01',routes:['ORG01']}, T06:{urgency:'Priority',primary:'ORG01',routes:['ORG01']},
 T07:{urgency:'Priority',primary:'ORG04',routes:['ORG04']}, T08:{urgency:'Undetermined',primary:'Undetermined',routes:[]},
 T09:{urgency:'Priority',primary:'Undetermined',routes:['ORG01','ORG07']}, T10:{urgency:'Priority',primary:'ORG06',routes:['ORG06']},
 T11:{urgency:'Urgent',primary:'Undetermined',routes:[]}, T12:{urgency:'Priority',primary:'ORG01',routes:['ORG01']},
 T13:{urgency:'Routine',primary:'ORG07',routes:['ORG07']}, T14:{urgency:'Priority',primary:'ORG01',routes:['ORG01','ORG02']},
 T15:{urgency:'Undetermined',primary:'ORG02',routes:['ORG02','ORG07']}, T16:{urgency:'Priority',primary:'ORG01',routes:['ORG01']},
 T17:{urgency:'Urgent',primary:'Undetermined',routes:['ORG06']}, T18:{urgency:'Undetermined',primary:'Undetermined',routes:[]},
 T19:{urgency:'Undetermined',primary:'Undetermined',routes:[]}, T20:{urgency:'Undetermined',primary:'Undetermined',routes:['ORG06','ORG07']},
 T21:{urgency:'Undetermined',primary:'Undetermined',routes:['ORG01','ORG03']}, T22:{urgency:'Priority',primary:'ORG04',routes:['ORG04']},
}
export const structuredScenarios=scenarios.map(s=>{
 const facts=Object.entries(inputs[s.id]).flatMap(([field,values])=>(Array.isArray(values)?values:[values]).map(value=>({field,value,source:'original' as const,evidence:value==='Conflicting'?['I sent $500 yesterday.','Later I said I never transferred any money.']:[s.narrative]})))
 return {...s,extraction:{summary:s.narrative,facts} as Extraction,rulebookExpected:expected[s.id]}
})
