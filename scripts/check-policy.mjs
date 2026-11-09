import { readFile, access } from 'node:fs/promises'
import { createHash } from 'node:crypto'
const read=async name=>(await readFile(new URL('../'+name,import.meta.url),'utf8')).replace(/^\uFEFF/,'').replace(/\r\n/g,'\n')
const policy=await read('docs/ScamSafe_Rulebook_v1.1.md')
const lock=JSON.parse(await read('docs/policy-lock.json'))
if(createHash('sha256').update(policy).digest('hex')!==lock.rulebookSha256)throw Error('Rulebook changed: review/update implementation, tests and policy lock.')
const rules=[...policy.matchAll(/^#### ((?:CL|IR|UG|RT|VU|VE|SAFE|CTL|SP)\d+)/gm)].map(m=>m[1])
if(rules.length!==48||new Set(rules).size!==48)throw Error('Expected 48 unique canonical rules.')
const coverage=await read('RULE_COVERAGE.md')
for(const id of rules)if(!coverage.includes(`| ${id} |`))throw Error(`Missing coverage entry ${id}`)
const document=await read('docs/ScamSafe_Acceptance_Tests_v1.1.md')
const generated=[...document.matchAll(/(?:^|\n)## (T\d+) — (.*?)\n([\s\S]*?)(?=\n## |$)/g)].map(m=>({id:m[1],title:m[2],narrative:m[3].match(/- \*\*Synthetic narrative:\*\* (.*)/)?.[1]}))
const fixtures=JSON.parse(await read('src/policy/scenarios.json'))
if(generated.length!==22||JSON.stringify(generated)!==JSON.stringify(fixtures.map(({id,title,narrative})=>({id,title,narrative}))))throw Error('T01–T22 fixtures are out of sync with the acceptance document.')
for(const obsolete of ['docs/ScamSafe_AI_Decision_Policy_中文版.md','docs/ScamSafe_Acceptance_Cases.json','ScamSafe_Alliance_AI_Assistant_Rules_v4.1.docx','ScamSafe_Codex_Build_Prompt.md','AI_Assistant_Workflow_Chinese.md']) {
  const exists=await access(new URL('../'+obsolete,import.meta.url)).then(()=>true,()=>false)
  if(exists)throw Error(`Superseded policy/fixture must not return: ${obsolete}`)
}
for(const file of ['src/analysis.ts','src/types.ts','server.mjs','src/policy/ruleEngine.ts','src/policy/organisationRouting.ts']) {
  const source=await read(file)
  if(/\b(?:recentPaymentUnprotected|routeEvidence|R[1-5])\b|Designated Emergency Safety Contact|policyVersion\s*:\s*['"]1\.0['"]/.test(source))throw Error(`Legacy decision path detected in ${file}`)
}
console.log('Policy 1.1 hash, 48 Rule IDs, coverage entries, T01–T22 narratives and legacy-path removal verified.')
