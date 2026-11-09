import { describe,it,expect,vi } from 'vitest'
import { analysisMode,extractCase,loadBusinessPolicy,validateModelShape,containsSensitiveData } from './server.mjs'
import { extractionSchema } from './src/policy/contract.mjs'
import { toGeminiResponseSchema } from './server/geminiSchema.mjs'
const narrative='I sent a synthetic payment.'
const extraction={summary:narrative,facts:[{field:'financial_status',value:'Yes',source:'original',evidence:[narrative]}]}
const envFor=provider=>provider==='gemini'?{AI_PROVIDER:provider,GEMINI_API_KEY:'synthetic-test-key'}:{AI_PROVIDER:provider,OPENAI_API_KEY:'synthetic-test-key'}
const response=(provider,raw)=>({ok:true,json:async()=>provider==='gemini'?{candidates:[{content:{parts:[{text:raw}]}}]}:{output:[{content:[{type:'output_text',text:raw}]}]}})
describe('provider-neutral extraction integration',()=>{
 it('checks the executable-policy lock without loading rulebook into model prompts',async()=>expect(await loadBusinessPolicy()).toEqual({version:'1.1'}))
 it('missing key is explicit NOT RUN; no default classification',async()=>{
  expect(analysisMode({})).toBe('demo');await expect(extractCase({narrative},{env:{}})).rejects.toThrow('NOT RUN')
 })
 for(const provider of ['gemini','openai']){
  it(`${provider}: success uses canonical facts schema and real-provider metadata`,async()=>{
   const fetchImpl=vi.fn(async()=>response(provider,JSON.stringify(extraction)))
   const result=await extractCase({narrative},{env:envFor(provider),fetchImpl})
   expect(result.analysisMode).toBe('real_ai');expect(result.policyVersion).toBe('1.1');expect(result.analysis).toEqual(extraction)
   const body=JSON.parse(fetchImpl.mock.calls[0][1].body)
   expect(JSON.stringify(body)).not.toContain('Synthetic Decision Rulebook')
   expect(JSON.stringify(body)).not.toContain('urgency_level')
   if(provider==='gemini') {
    expect(body.generationConfig.responseJsonSchema).toBeUndefined()
    expect(body.generationConfig.responseSchema).toEqual(toGeminiResponseSchema(extractionSchema))
    expect(body.generationConfig.responseMimeType).toBe('application/json')
   } else {
    expect(body.text.format.schema).toEqual(extractionSchema)
    expect(body.text.format.strict).toBe(true)
   }
  })
  it(`${provider}: malformed JSON and invented evidence fail closed`,async()=>{
   for(const raw of ['not JSON',JSON.stringify({...extraction,priority:'P1'}),JSON.stringify({...extraction,facts:[{...extraction.facts[0],evidence:['invented quote']}]})])
    await expect(extractCase({narrative},{env:envFor(provider),fetchImpl:async()=>response(provider,raw)})).rejects.toThrow()
  })
  it(`${provider}: timeout and upstream error are explicit failures`,async()=>{
   await expect(extractCase({narrative},{env:envFor(provider),fetchImpl:()=>new Promise(()=>{}),timeoutMs:10})).rejects.toThrow('timed out')
   await expect(extractCase({narrative},{env:envFor(provider),fetchImpl:async()=>({ok:false})})).rejects.toThrow('unavailable')
  })
 }
 it('rejects invalid truth states and attempts to set verification status',()=>{
  expect(validateModelShape({summary:'',facts:[{field:'financial_status',value:'Possibly',source:'original',evidence:[narrative]}]})).toBe(false)
  expect(validateModelShape({...extraction,facts:[{...extraction.facts[0],review:'Independently verified'}]})).toBe(false)
 })
 it('blocks obvious live identifiers and secrets before provider transmission',async()=>{
  for(const text of ['My password is abcdef','My account is 123456789','https://unsafe.example','person@example.test']){
   expect(containsSensitiveData(text)).toBe(true)
   const fetchImpl=vi.fn();await expect(extractCase({narrative:text},{env:envFor('gemini'),fetchImpl})).rejects.toThrow('synthetic categories');expect(fetchImpl).not.toHaveBeenCalled()
  }
 })
})
describe('Gemini schema transport compatibility without application contract changes',()=>{
 it('preserves field names, required fields and enums without unsupported or costly grammar constraints',()=>{
  const before=JSON.stringify(extractionSchema)
  const converted=toGeminiResponseSchema(extractionSchema)
  const check=(canonical,wire)=>{
   expect(wire.type).toBe(canonical.type.toUpperCase())
   expect(wire.required).toEqual(canonical.required)
   expect(wire.enum).toEqual(canonical.enum)
   for(const key of ['minLength','maxLength','minItems','maxItems','additionalProperties']) expect(wire).not.toHaveProperty(key)
   if(canonical.properties){
    expect(Object.keys(wire.properties)).toEqual(Object.keys(canonical.properties))
    expect(wire.propertyOrdering).toEqual(Object.keys(canonical.properties))
    for(const [key,child] of Object.entries(canonical.properties)) check(child,wire.properties[key])
   }
   if(canonical.items) check(canonical.items,wire.items)
  }
  check(extractionSchema,converted)
  expect(converted.properties.facts.description).toContain('At most 100 items')
  expect(converted.properties.summary.description).toContain('At most 900 characters')
  expect(JSON.stringify(extractionSchema)).toBe(before)
 })
 it('still rejects output that violates locally enforced constraints after a successful Gemini response',async()=>{
  const bad=[
   {...extraction,summary:'x'.repeat(901)},
   {...extraction,facts:Array(101).fill(extraction.facts[0])},
   {...extraction,extra:'unexpected'},
   ...[
    {...extraction.facts[0],extra:'unexpected'},
    {...extraction.facts[0],field:'invented_field'},
    {...extraction.facts[0],source:'invented_source'},
    {...extraction.facts[0],value:'x'.repeat(301)},
    {...extraction.facts[0],evidence:[]},
    {...extraction.facts[0],evidence:Array(7).fill(narrative)},
    {...extraction.facts[0],evidence:['x'.repeat(1501)]},
    {...extraction.facts[0],evidence:['']},
   ].map(fact=>({...extraction,facts:[fact]})),
  ]
  for(const invalid of bad) await expect(extractCase({narrative},{env:envFor('gemini'),fetchImpl:async()=>response('gemini',JSON.stringify(invalid))})).rejects.toThrow('schema or exact source-evidence validation')
 })
})
