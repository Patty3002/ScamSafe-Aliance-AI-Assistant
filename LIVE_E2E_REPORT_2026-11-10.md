# Live end-to-end evaluation — 2026-11-10

> Synthetic T01–T22 narratives only. First live semantic run of the deployed prototype (previously `provider-evaluation.json` = NOT RUN).

## Setup

| Item | Value |
| --- | --- |
| Target | `https://scamsafe-aliance-ai-assistant.onrender.com` (`/api/analyze`) |
| Provider / model | Gemini · `gemini-3.5-flash-lite` (server-configured) |
| Code under test | Deployed `ruleEngine.ts`, `organisationRouting.ts`, `contract.mjs` — SHA-256 identical to commit `e2e8187` |
| Pipeline | narrative → live LLM extraction → server evidence validator → deterministic `evaluate()` → `src/liveEvaluation.ts` scorer |
| Runs | 3 × 22 = 66 requests (run 1 at 1.5 s spacing, runs 2–3 at 5 s) |
| Scorer self-check | Curated extractions score 22/22 PASS; broken-safety and fabricated-quote cases score FAIL |

Status meanings: **PASS** = urgency, primary and routes equal the team's rulebook-adjudicated expectation and all invariants hold. **MISMATCH** = invariants hold but the decision differs. **FAIL** = a safety/boundary invariant broke or evidence was invalid. **ERROR** = no successful extraction (UI shows Limited Demo).

## Totals

| PASS | MISMATCH | FAIL | ERROR |
| --- | --- | --- | --- |
| 39 | 18 | 3 | 6 (4 provider unavailable, 2 validation rejects) |

Median latency of successful calls 1.5 s (max 3.3 s). All 60 successful extractions passed exact-quote validation; SAFE01 fired on every T11/T17 run; no SMS-only case was routed to ORG03; T16 was never escalated to Urgent; T18 never treated stored banking data as exposure; T19 authority claim stayed unverified.

## Per scenario (valid runs)

| Case | Result | Observed decision(s) | Cause |
| --- | --- | --- | --- |
| T02 T03 T04 T05 T07 T08 T19 T22 | 3/3 PASS | as expected | — |
| T10 T16 T17 T18 | 2/2 PASS | as expected | run 1 ERROR only |
| T01 | 2 PASS, 1 **FAIL** | run 2: Priority / ORG01 | model set `financial_status=Yes` from "I lost money" (CL02 boundary) |
| T12 | 0/2 — **FAIL** both | Priority / ORG01 | model cites both contradictory quotes but labels `Yes`, not `Conflicting` (VE02). Decision matches; safeguard fails |
| T06 | 2/3 | run 2: Priority / no route | `bank_account_concern` omitted although "banking password" disclosed |
| T09 | 2/3 | run 1: ORG01 primary | model inferred `main_actionable_issue` (primary matches published, not team reading) |
| T21 | 1/2 | run 2: ORG03 primary | model inferred `main_actionable_issue=Telecom service` (primary matches published) |
| T11 | 0/3 MISMATCH | + ORG06 additional | "I fear immediate physical danger" read as severe distress |
| T13 | 0/3 MISMATCH | Undetermined (expected Routine) | model never emits `exposure_status=No` from "did not … share information" |
| T14 | 0/3 MISMATCH | ORG01 only | `platform_controlled_issue` never set for "fake marketplace" → ORG02 missing |
| T15 | 0/3 MISMATCH | Routine / ORG05 primary | model sets `reporting_need` + `main_actionable_issue=Scam reporting`; platform issue missed |
| T20 | 0/3 MISMATCH | ORG06 primary | `main_actionable_issue=Emotional support` inferred (allowed by published row) |

## Findings and recommended actions

1. **Conflict detection is not reliable with the live model (T12, VE02).** Recommend a prompt example for contradictions, plus a staff-review prompt whenever a four-state fact cites two or more evidence spans.
2. **`main_actionable_issue` is inferred, not "explicitly stated"** (T09, T15, T20, T21). This is the largest driver of primary-route deviation. Tighten the instruction or ignore the field unless the narrative uses explicit "main/most important" wording.
3. **Under-extraction of negatives and platform context** (T13 `exposure_status=No`; T14/T15 `platform_controlled_issue`). These fail safe (Undetermined / fewer routes) but lose the published Routine/ORG02 outcomes.
4. **Rate limiting on fast consecutive requests** (run 1, 4 ERRORs at ~300 ms). In the demo video, wait several seconds between analyses; consider a retry with back-off on HTTP 429.
5. **Occasional schema/evidence rejects** (T10, T12 run 1). The validator correctly refuses; a single automatic retry would reduce Limited Demo screens.

## Re-running

```
node scripts/run-live-e2e.mjs https://scamsafe-aliance-ai-assistant.onrender.com 3 5000   # writes docs/live-e2e-runs.json
pnpm run eval:e2e:score                                                                    # writes docs/live-e2e-report.json
```

Rerun after any prompt, model or provider change (cross-case invariant: same T01–T22 semantic evaluation). Keep the raw JSON as test evidence.
