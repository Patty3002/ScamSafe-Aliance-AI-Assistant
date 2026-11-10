// @vitest-environment jsdom
import { act } from 'react'
import { createRoot,type Root } from 'react-dom/client'
import { afterEach,describe,expect,it,vi } from 'vitest'
import App from './App'
import { structuredScenarios } from './policy/structuredScenarios'
let root:Root|undefined;let host:HTMLDivElement|undefined
const click=async(name:string)=>act(async()=>{
 const button=[...document.querySelectorAll('button')].find(b=>b.textContent?.includes(name))
 if(!button)throw new Error(`Missing button ${name}`)
 button.dispatchEvent(new MouseEvent('click',{bubbles:true}))
})
const mount=async()=>{Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});host=document.createElement('div');document.body.append(host);root=createRoot(host);await act(async()=>root!.render(<App/>))}
const edit=async(element:HTMLTextAreaElement,value:string)=>act(async()=>{Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(element,value);element.dispatchEvent(new Event('input',{bubbles:true}))})
afterEach(async()=>{if(root)await act(async()=>root?.unmount());root=undefined;host?.remove();vi.unstubAllGlobals();vi.useRealTimers()})
describe('preserved three-screen human review workflow',()=>{
 it('explains disabled staff recording and briefly confirms completed review actions',async()=>{
  const s=structuredScenarios.find(s=>s.id==='T11')!
  vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/api/status')?{ok:true,json:async()=>({policyVersion:'1.1'})}:{ok:true,json:async()=>({mode:'gemini',provider:'gemini',analysisMode:'real_ai',requestStatus:'succeeded',model:'mock-test',policyVersion:'1.1',analysis:s.extraction})}))
  await mount();await click('T11 —');await click('Analyse Case')
  vi.useFakeTimers()
  const record=[...document.querySelectorAll('button')].find(button=>button.textContent==='Record staff decision')!
  const rationale=document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Staff decision rationale"]')!
  const help=document.getElementById('staff-rationale-help')!
  const status=document.querySelector('[role="status"]')!

  expect(record.disabled).toBe(true)
  expect(help.textContent).toContain('Enter a rationale')
  await edit(rationale,'Contact staff@example.com for review.')
  expect(record.disabled).toBe(true)
  expect(help.textContent).toContain('Remove sensitive information')
  await edit(rationale,'The reported safety concern requires immediate review.')
  expect(record.disabled).toBe(false)
  expect(record.classList.contains('primary')).toBe(true)
  await click('Record staff decision')
  expect(status.textContent).toBe('Staff decision recorded.')
  await click('Update Analysis')
  expect(status.textContent).toBe('Analysis updated.')
  expect(record.disabled).toBe(true)
  await act(async()=>{vi.advanceTimersByTime(3000)})
  expect(status.textContent).toBe('')
 })
 it('supports Accept/Modify/Reject, navigation, evidence and NOT SENT report for T11',async()=>{
  const s=structuredScenarios.find(s=>s.id==='T11')!
  vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL)=>String(url).includes('/api/status')?{ok:true,json:async()=>({policyVersion:'1.1'})}:{ok:true,json:async()=>({mode:'gemini',provider:'gemini',analysisMode:'real_ai',requestStatus:'succeeded',model:'mock-test',policyVersion:'1.1',analysis:s.extraction})}))
  await mount();await click('T11 —');await click('Analyse Case')
  expect(document.body.textContent).toContain('P1 — Immediate');expect(document.body.textContent).toContain('Provisional')
  await click('Continue with current information');expect(document.body.textContent).toContain('Internal Safety Escalation')
  await click('Accept');expect(document.body.textContent).toContain('Accepted · not sent')
  await click('Review analysis');await click('Continue with current information');expect(document.body.textContent).toContain('Accepted · not sent')
  await click('Modify');await edit(document.querySelector('textarea[aria-label="Modified proposed action"]')!,'Staff safety procedure proposal.')
  await click('Reject');expect(document.body.textContent).toContain('Rejected · retained')
  await click('Generate Case Report');expect(document.body.textContent).toContain('NOT SENT / NOT EXECUTED');expect(document.body.textContent).toContain('SAFE01');expect(document.body.textContent).toContain(s.narrative)
 })
 it('recomputes a correction, resets changed approvals and preserves original plus history',async()=>{
  const s=structuredScenarios.find(s=>s.id==='T04')!
  vi.stubGlobal('fetch',vi.fn(async(url:RequestInfo|URL,opts?:RequestInit)=>{
   if(String(url).includes('/api/status'))return {ok:true,json:async()=>({policyVersion:'1.1'})}
   const input=JSON.parse(String(opts?.body))
   const raw={...s.extraction,facts:[...s.extraction.facts,...(input.correction?[{field:'financial_status',value:'No',source:'correction',evidence:[input.correction]}]:[])]}
   return {ok:true,json:async()=>({mode:'openai',provider:'openai',analysisMode:'real_ai',requestStatus:'succeeded',model:'mock-test',policyVersion:'1.1',analysis:raw})}
  }))
  await mount();await click('T04 —');await click('Analyse Case');await click('Continue with current information');await click('Accept');await click('Review analysis')
  await edit(document.querySelector('textarea[placeholder="What should be understood differently?"]')!,'Correction: no financial event occurred.');await click('Update Analysis');await click('Continue with current information')
  expect(document.querySelector('[data-recommendation-id="ORG01"]')).toBeNull()
  await click('Generate Case Report');expect(document.body.textContent).toContain('Superseded Recommendations / Review History');expect(document.body.textContent).toContain('Employee decision: accepted');expect(document.body.textContent).toContain(s.narrative)
 })
 it('missing API/invalid data displays limited status and Undetermined, never a successful risk result',async()=>{
  vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'API unavailable'})})))
  await mount();await click('T11 —');await click('Analyse Case')
  expect(document.body.textContent).toContain('Limited Demo Mode');expect(document.body.textContent).toContain('Priority pending confirmation');expect(document.querySelector('.priority strong')?.textContent).toBe('Priority pending confirmation');expect(document.body.textContent).toContain('Safety has not been assessed')
  await click('Back to intake')
  const description = document.querySelector('textarea')!
  expect(description.value).toBe('')
  expect(description.readOnly).toBe(false)
  expect(document.querySelector<HTMLInputElement>('input[placeholder="e.g. Online store concern"]')?.value).toBe('')
  expect(document.body.textContent).toContain('Analysis not run')
  expect(document.querySelector('.error')).toBeNull()
  await edit(description, 'A new fictional case.')
  await click('Analyse Case')
  expect(document.body.textContent).toContain('AI Analysis & Clarification')
 })
})
