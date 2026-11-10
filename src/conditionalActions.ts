import type { Analysis } from './types'
import { fieldDefinitions } from './policy/contract.mjs'
import { evaluate } from './policy/ruleEngine'
import { organisations } from './policy/organisationRouting'

// Evaluate alternatives with the current policy; hypothetical facts never enter
// the saved case, employee decisions or provider extraction.
export function conditionalActions(a: Analysis) {
  return a.clarifyingQuestions.map(question => {
    const field=a.decision.missing.find(task=>task.task===question)?.field
    const allowed=field ? fieldDefinitions[field]?.[1] : null
    const values=(allowed??[]).filter(value=>!['Unknown','unknown','Conflicting','N/A'].includes(value))
    const cases: [string,string][]=[]
    if(field && a.modelExtraction) for(const value of values) {
      const evidence='Hypothetical answer for conditional guidance only.'
      const result=evaluate({summary:'',facts:[...a.modelExtraction.facts.filter(f=>f.field!==field),{field,value,source:'correction',evidence:[evidence]}]},
        {original:a.originalNarrative,clarification:a.workerClarifications,correction:a.employeeCorrections+'\n'+evidence})
      const actions=[result.safety?'Internal Safety Escalation: authorised staff follow the emergency protocol immediately.':'',
        ...result.routes.map(route=>organisations[route.id]+': '+route.task),...result.specialist].filter(Boolean)
      const action='Priority: '+result.urgency+'. '+(actions.join(' ')||'Obtain targeted clarification and authorised staff review before selecting an organisation.')
      const existing=cases.find(item=>item[1]===action)
      if(existing) existing[0]+=' / '+value
      else cases.push([value,action])
    }
    return {question,cases}
  })
}
