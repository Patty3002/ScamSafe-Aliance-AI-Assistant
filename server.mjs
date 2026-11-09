import http from 'node:http'
import { readFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import { createServer as createViteServer } from 'vite'
import { extractionSchema, extractionInstructions, validateExtraction, containsSensitiveData } from './src/policy/contract.mjs'
import { toGeminiResponseSchema } from './server/geminiSchema.mjs'
export { containsSensitiveData } from './src/policy/contract.mjs'
export const POLICY_VERSION='1.1'
export const analysisMode=env=>{
  const provider=(env.AI_PROVIDER||'gemini').toLowerCase()
  return provider==='gemini'&&env.GEMINI_API_KEY?.trim()?'gemini':provider==='openai'&&env.OPENAI_API_KEY?.trim()?'openai':'demo'
}
export const validateModelShape=validateExtraction
export async function loadBusinessPolicy(){
  const text=await readFile(new URL('./docs/ScamSafe_Rulebook_v1.1.md',import.meta.url),'utf8')
  const lock=JSON.parse(await readFile(new URL('./docs/policy-lock.json',import.meta.url),'utf8'))
  if(createHash('sha256').update(text.replace(/\r\n/g,'\n')).digest('hex')!==lock.rulebookSha256) throw new Error('Rulebook changed: update executable rules, tests and policy lock before running.')
  return {version:POLICY_VERSION}
}
export async function extractCase(input,{env=process.env,fetchImpl=fetch,timeoutMs=30000}={}){
  const provider=analysisMode(env)
  if(provider==='demo') throw new Error('Selected provider has no API key. Semantic extraction NOT RUN.')
  if(typeof input.narrative!=='string'||!input.narrative.trim()||input.narrative.length>16000) throw new Error('A bounded synthetic narrative is required.')
  if([input.clarification,input.correction].some(x=>x!==undefined&&(typeof x!=='string'||x.length>16000))) throw new Error('Invalid employee input.')
  const sources={original:input.narrative,clarification:input.clarification||'',correction:input.correction||''}
  if(Object.values(sources).some(containsSensitiveData)) throw new Error('Use synthetic categories only. Remove URLs, contact details and actual secret/identifier values.')
  const prompt=JSON.stringify(sources)
  const model=provider==='gemini'?(env.GEMINI_MODEL||'gemini-3.8-flash'):(env.OPENAI_MODEL||'gpt-6-astra')
  const controller=new AbortController()
  let timer
  const expired=new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(new Error('Provider request timed out.'))},timeoutMs)})
  try {
    const request=provider==='gemini'
      ? ['https://generativelanguage.googleapis.com/v1beta/models/'+encodeURIComponent(model)+':generateContent',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json','x-goog-api-key':env.GEMINI_API_KEY},body:JSON.stringify({systemInstruction:{parts:[{text:extractionInstructions}]},contents:[{role:'user',parts:[{text:prompt}]}],generationConfig:{temperature:0.1,responseMimeType:'application/json',responseSchema:toGeminiResponseSchema(extractionSchema)}})}]
      : ['https://api.openai.com/v1/responses',{method:'POST',signal:controller.signal,headers:{'content-type':'application/json',authorization:`Bearer ${env.OPENAI_API_KEY}`},body:JSON.stringify({model,store:false,instructions:extractionInstructions,input:prompt,text:{format:{type:'json_schema',name:'scamsafe_extraction',strict:true,schema:extractionSchema}}})}]
    const work=(async()=>{
      const response=await fetchImpl(...request)
      if(!response.ok) throw new Error('Provider unavailable. No successful semantic extraction.')
      const payload=await response.json()
      const raw=provider==='gemini'?payload.candidates?.[0]?.content?.parts?.map(p=>p.text||'').join(''):payload.output?.flatMap(p=>p.content||[]).filter(p=>p.type==='output_text').map(p=>p.text||'').join('')
      const extraction=JSON.parse(raw||'null')
      if(!validateExtraction(extraction,sources)) throw new Error('Provider output failed schema or exact source-evidence validation.')
      return {mode:provider,analysisMode:'real_ai',provider,model,policyVersion:POLICY_VERSION,requestStatus:'succeeded',analysis:extraction}
    })()
    return await Promise.race([work,expired])
  } finally {clearTimeout(timer)}
}
const send=(res,status,data)=>{res.writeHead(status,{'content-type':'application/json'});res.end(JSON.stringify(data))}
const readBody=req=>new Promise((resolve,reject)=>{let body='';req.on('data',chunk=>{body+=chunk;if(body.length>60000)reject(new Error('Request too large.'))});req.on('end',()=>resolve(body));req.on('error',reject)})
export async function createAppServer({env=process.env,fetchImpl=fetch}={}){
  await loadBusinessPolicy()
  const vite=await createViteServer({server:{middlewareMode:true},appType:'spa'})
  const server=http.createServer(async(req,res)=>{
    if(req.url==='/api/status'&&req.method==='GET') return send(res,200,{configuredProvider:analysisMode(env),policyVersion:POLICY_VERSION})
    if(req.url==='/api/analyze'&&req.method==='POST'){
      try{return send(res,200,await extractCase(JSON.parse(await readBody(req)),{env,fetchImpl}))}
      catch(e){return send(res,analysisMode(env)==='demo'?503:502,{mode:'demo',analysisMode:'limited_demo',requestStatus:'failed',error:e instanceof Error?e.message:'Extraction failed.'})}
    }
    vite.middlewares(req,res)
  })
  server.on('close',()=>vite.close())
  return server
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
  const port=Number(process.env.PORT||5173);const server=await createAppServer();server.listen(port,()=>console.log(`ScamSafe running at http://localhost:${port} (${analysisMode(process.env)} mode)`))
}
