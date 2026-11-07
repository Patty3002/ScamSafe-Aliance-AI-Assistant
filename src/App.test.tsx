// @vitest-environment jsdom
import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import App from './App'

let root: Root | undefined
let host: HTMLDivElement | undefined

const button = (name: string) => {
  const found=[...document.querySelectorAll('button')].find(b=>b.textContent?.toLocaleLowerCase().includes(name.toLocaleLowerCase()))
  if(!found) throw new Error(`Button not found: ${name}`)
  return found as HTMLButtonElement
}
const click = async (name: string) => act(async()=>{button(name).dispatchEvent(new MouseEvent('click',{bubbles:true}))})

afterEach(async()=>{
  if(root) await act(async()=>root?.unmount())
  root=undefined; host?.remove(); host=undefined
  vi.unstubAllGlobals()
})

describe('recommendation review workflow',()=>{
  it('blocks progression until conflicting information is corrected and reanalysed',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
    vi.stubGlobal('fetch',vi.fn(async()=>({ok:false,json:async()=>({error:'AI unavailable'})})))
    host=document.createElement('div'); document.body.append(host); root=createRoot(host)
    await act(async()=>root!.render(<App/>))
    const enter=async(field:HTMLTextAreaElement,value:string)=>act(async()=>{
      Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!.call(field,value)
      field.dispatchEvent(new Event('input',{bubbles:true}))
    })
    await enter(document.querySelector('textarea')!,'I paid by bank transfer or credit card today.')
    await click('Analyse Case')
    expect(button('Continue with current information').disabled).toBe(true)
    const resolution=document.querySelector<HTMLTextAreaElement>('section[aria-label="Resolve conflicting information"] textarea')!
    expect(resolution).not.toBeNull()
    await enter(resolution,'Correction: I paid by bank transfer.')
    expect(button('Continue with current information').disabled).toBe(true)
    await click('Update Analysis')
    expect(button('Continue with current information').disabled).toBe(false)
    await click('Continue with current information')
    expect(document.body.textContent).toContain('Conditional recommendations for missing information')
  })
  it('keeps a reviewed safety recommendation visible through decisions, navigation, and report generation',async()=>{
    Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true})
    vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>String(input).includes('/api/status')
      ? {ok:true,json:async()=>({mode:'demo'})}
      : {ok:false,json:async()=>({mode:'demo'})}))
    host=document.createElement('div'); document.body.append(host); root=createRoot(host)
    await act(async()=>root!.render(<App/>))
    await click('Immediate safety concern')
    await click('Analyse Case')
    expect(document.body.textContent).toContain('Limited Demo Mode')
    expect(document.body.textContent).toContain('not full semantic AI analysis')
    expect(document.body.textContent).toContain('P1 — Immediate')
    await click('Continue with current information')
    expect(document.querySelector('[data-recommendation-id="safety"]')).not.toBeNull()
    await click('Accept')
    let card=document.querySelector('[data-recommendation-id="safety"]')!
    expect(card.textContent).toContain('Accepted · not sent')
    expect(card.textContent).toContain('Immediately escalate the reported personal safety threat')
    await click('Review analysis')
    await click('Continue with current information')
    expect(document.querySelector('[data-recommendation-id="safety"]')?.textContent).toContain('Accepted · not sent')
    await click('Change Decision')
    await click('Modify')
    const action=document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Modified proposed action"]')!
    await act(async()=>{
      const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!
      setter.call(action,'Escalate under the employee safety procedure now.')
      action.dispatchEvent(new Event('input',{bubbles:true}))
    })
    await click('Reject')
    card=document.querySelector('[data-recommendation-id="safety"]')!
    expect(card.textContent).toContain('Rejected · retained')
    expect(card.textContent).toContain('Why suggested')
    expect(card.textContent).toContain('Employee-modified proposal')
    await click('Review analysis')
    await click('Continue with current information')
    expect(document.querySelector('[data-recommendation-id="safety"]')?.textContent).toContain('Rejected · retained')
    await click('Generate Case Report')
    expect(document.body.textContent).toContain('Employee decision: rejected')
    expect(document.body.textContent).toContain('Original recommendation: Immediately escalate the reported personal safety threat')
    expect(document.body.textContent).toContain('Employee-modified action: Escalate under the employee safety procedure now.')
    expect(document.body.textContent).toContain('Original justification: The person reports a credible current or imminent personal safety danger.')
  })

  it('labels Real AI Mode only after a successful structured provider response',async()=>{
    const extraction={summary:'The person reports a current safety threat.',safetyAssessment:{status:'current_danger',evidence:['the person reports being in immediate danger']},caseTypes:[],facts:[],missingInformation:[],conflicts:[],vulnerabilityIndicators:[],riskSignals:[]}
    vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>String(input).includes('/api/status')
      ? {ok:true,json:async()=>({configuredProvider:'gemini',policyVersion:'1.0'})}
      : {ok:true,json:async()=>({mode:'gemini',analysisMode:'real_ai',requestStatus:'succeeded',provider:'gemini',model:'mock-gemini-structured',policyVersion:'1.0',analysis:extraction})}))
    host=document.createElement('div'); document.body.append(host); root=createRoot(host)
    await act(async()=>root!.render(<App/>))
    expect(document.body.textContent).toContain('Analysis not run')
    await click('Immediate safety concern')
    await click('Analyse Case')
    expect(document.body.textContent).toContain('Real AI Mode · Gemini')
    expect(document.body.textContent).toContain('P1 — Immediate')
  })

  it('keeps an older employee decision in report history when updated facts replace its recommendation',async()=>{
    vi.stubGlobal('fetch',vi.fn(async(input:RequestInfo|URL)=>String(input).includes('/api/status')
      ? {ok:true,json:async()=>({configuredProvider:'demo',policyVersion:'1.0'})}
      : {ok:false,json:async()=>({mode:'demo',error:'AI unavailable'})}))
    host=document.createElement('div'); document.body.append(host); root=createRoot(host)
    await act(async()=>root!.render(<App/>))
    await click('Immediate safety concern')
    await click('Analyse Case')
    await click('Continue with current information')
    await click('Accept')
    await click('Review analysis')
    await click('Back to intake')
    const description=document.querySelector<HTMLTextAreaElement>('textarea')!
    await act(async()=>{
      const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value')!.set!
      setter.call(description,'A person received a suspicious SMS but did not click, pay, or disclose information.')
      description.dispatchEvent(new Event('input',{bubbles:true}))
    })
    await click('Analyse Case')
    await click('Continue with current information')
    expect(document.querySelector('[data-recommendation-id="safety"]')).toBeNull()
    await click('Generate Case Report')
    expect(document.body.textContent).toContain('Superseded Recommendations / Review History')
    expect(document.body.textContent).toContain('Employee decision: accepted')
    expect(document.body.textContent).toContain('Immediately escalate the reported personal safety threat')
  })
})
