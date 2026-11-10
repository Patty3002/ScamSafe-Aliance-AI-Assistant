// Sends the 22 synthetic T01–T22 narratives to a running ScamSafe server's /api/analyze and records raw responses.
// Usage: node scripts/run-live-e2e.mjs [baseUrl] [runs] [gapMs]
//   e.g. node scripts/run-live-e2e.mjs https://scamsafe-aliance-ai-assistant.onrender.com 3 5000
// Then score with: pnpm run eval:e2e:score
// Synthetic scenario text only. Uses the server's configured provider key; nothing is sent elsewhere.
import { readFile, writeFile } from 'node:fs/promises'
const [base = 'http://localhost:5173', runs = '3', gap = '5000'] = process.argv.slice(2)
const scenarios = JSON.parse(await readFile(new URL('../src/policy/scenarios.json', import.meta.url), 'utf8'))
const status = await fetch(new URL('/api/status', base)).then(r => r.json())
console.log(`Server ${base}: provider=${status.configuredProvider}, policy=${status.policyVersion}`)
if (status.configuredProvider === 'demo') { console.log('No provider key configured on server: live E2E NOT RUN.'); process.exit(2) }
const records = []
for (let run = 1; run <= Number(runs); run++) for (const s of scenarios) {
  const t0 = Date.now(); let rec
  try {
    const r = await fetch(new URL('/api/analyze', base), { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ narrative: s.narrative }) })
    rec = { run, id: s.id, http: r.status, ms: Date.now() - t0, body: await r.json() }
  } catch (e) { rec = { run, id: s.id, error: String(e) } }
  records.push(rec); console.log(`run ${run} ${s.id}: HTTP ${rec.http ?? 'ERR'} ${rec.body?.error ?? ''}`)
  await new Promise(r => setTimeout(r, Number(gap))) // stay under provider rate limits
}
await writeFile(new URL('../docs/live-e2e-runs.json', import.meta.url), JSON.stringify({ base, status, recordedAt: new Date().toISOString(), records }, null, 2) + '\n')
console.log('Saved docs/live-e2e-runs.json')
