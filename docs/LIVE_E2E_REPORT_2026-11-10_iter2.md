# Live end-to-end evaluation — iteration 2 (2026-11-10)

> Synthetic T01–T22 narratives only. Compares the first live run with two runs after commit `fcda6da` (Gemini `thinkingLevel: 'medium'`, temperature 0.1 → 0.2). Prompt, rule engine and routing are unchanged between iterations (identical SHA-256).

## What changed and how it was measured

| Dataset | Config | Where | Runs |
| --- | --- | --- | --- |
| Iter 1 | no thinking, temp 0.1 | deployed site | 3 × 22 |
| Iter 2a | thinking medium, temp 0.2 | team local server (`docs/live-e2e-runs.json`) | 3 × 22 |
| Iter 2b | thinking medium, temp 0.2 | deployed site (server.mjs hash = `fcda6da`) | 3 × 22, 5 s spacing |

All scored with the same `src/liveEvaluation.ts` (self-check 22/22 PASS before scoring). Model in all runs: `gemini-3.5-flash-lite`.

## Totals

| | PASS | MISMATCH | FAIL | ERROR | PASS / valid | Median latency |
| --- | --- | --- | --- | --- | --- | --- |
| Iter 1 | 39 | 18 | 3 | 6 | 65 % | 1.5 s |
| Iter 2a | 45 | 14 | 1 | 6 | 75 % | 4.2 s |
| Iter 2b | 41 | 16 | **0** | 9 | 72 % | 4.6 s (max 9.4 s) |

Safety invariants held in every valid run of every iteration (SAFE01 on T11/T17, no SMS-only ORG03, T16 never Urgent, T18 no exposure, T19 unverified).

## Per-scenario change (iteration 2 = 2a + 2b combined)

| Case | Iter 1 | Iter 2 | Note |
| --- | --- | --- | --- |
| T01 | 2/3, 1 FAIL | **6/6** | No longer invents a financial event from "I lost money" |
| T06 | 2/3 | **6/6** | Bank linkage of disclosed banking password now extracted |
| T09 | 2/3 | **5/5** | No longer infers a main issue; primary Undetermined as adjudicated |
| T13 | 0/3 | 3/4 | Routine reached when negatives extracted |
| T16 | 2/2 | **6/6** | Stable |
| T12 | 0/2, 2 FAIL | 3/4 pass, 1 FAIL, 2 validation ERROR | Conflict now usually detected; remaining outputs often rejected by validator |
| T08 | 3/3 | 4/6 | **New:** BSB+account read as bank concern → ORG01 primary (matches *published* row, not team adjudication) |
| T11 | 0/3 | 2/6 | ORG06 still added from "I fear immediate physical danger" |
| T14 | 0/3 | 0/6 | `platform_controlled_issue` never set for "fake marketplace" → ORG02 missing |
| T15 | 0/3 | 0/6 | Primary ORG05 (scam reporting) instead of ORG02 |
| T20 | 0/3 | 0/6 | Primary ORG06 (allowed by published row) |
| T21 | 1/2 | 0/5 | Now consistently ORG03 primary (matches published row) |

## Findings

1. **Thinking improved extraction quality** (FAIL 3 → 1 over twice the runs; PASS/valid 65 % → 73 %), at ~3× latency.
2. **Provider errors increased** (iter 2b: 5 "unavailable" in 1.4–4.4 s, i.e. provider refusals not timeouts; 4 validation rejects). With ~14 % failed requests, about one in seven analyses would show Limited Demo. Addressed in this change by one retry (below); needs re-measuring after deploy.
3. **Team decision needed — T08, T20, T21.** The model now matches the published acceptance rows while `SPECIFICATION_DISCREPANCIES.md` adjudicates Undetermined. Per rulebook §6, record the chosen reading before changing expectations or prompts.
4. **Remaining prompt gaps — T14/T15** (platform-controlled marketplace/social account) and **T11** (fear of danger ≠ emotional-support request).

## Code changes in this iteration

- `server.mjs`: one retry (1 s back-off) for provider refusals and rejected outputs, inside the existing 30 s timeout. Every attempt passes the same validator; failure after the retry still fails closed. Response records `attempts`. Tests: retry-then-success, retry-then-fail-closed, attempts=1, timeout.
- `src/analysis.ts`: case summary no longer keeps only the first three sentences (T16 lost "another A$1,000 has been deducted"). Short reports are shown in full; long reports are cut at a sentence boundary and marked. Tests: all 22 narratives preserved, T16 deduction present, long-report marker.

`pnpm run test`: 78 passed. `typecheck` and `build` pass.
