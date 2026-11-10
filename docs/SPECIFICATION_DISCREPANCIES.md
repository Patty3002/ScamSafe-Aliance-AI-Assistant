# Specification discrepancies and conservative resolutions

The supplied documents are preserved verbatim. The rulebook is authoritative; this file records interpretation conflicts and limitations, not replacement business policy. No exception threshold or extra organisation has been introduced. Deterministic scenario tests describe rulebook-derived results and do **not** claim that all published expectations pass unchanged.

| Scenario / source | Conflict or ambiguity | Implemented result |
| --- | --- | --- |
| T07 expected B=No | The narrative does not deny a financial event. CL02 and the normative truth-status principle require Unknown for silence. | B=Unknown; identity exposure still gives Priority and ORG04. |
| T15 expected Routine | No sharing/payment is explicit, but no-interaction is not; UG07 requires explicit no interaction. | Undetermined; ORG02 and ORG07 still match their separate tasks. |
| T21 expected Priority, citing UG04 | A SIM service issue and concern about verification messages do not establish B=Yes or affirmative financial loss. RT03 explicitly has no independent urgency effect. | Undetermined pending transaction/account clarification; no invented SIM urgency rule. |
| T21 expected ORG03 primary | Telecom takeover and a bank verification concern both match mandates. The report does not explicitly state which task is most immediate; RT08 forbids a fixed global ranking. | Both ORG03 and ORG01 are candidates; primary remains Undetermined until a dominant issue is established. An explicit telecom main need can select ORG03; reported ongoing debits select the urgent bank assessment. |
| T08 Bank candidate | BSB/account identifiers alone establish C, but the ORG01 trigger requires a financial or bank-account security issue; UG05 explicitly excludes receiving identifiers alone. The narrative explicitly denies unusual transactions. | Undetermined with exposure clarification; no bank route without a separately supported actionable bank concern. |
| T04, T05, T08, T14 unconditional government-reporting additions | RT05 requires a reporting/public-information need; these narratives do not state one. | ORG05 suppressed until reporting need is reported. T14 retains platform and bank tasks. |
| T09 Bank primary | Immediate essentials and a financial event are both material actionable needs. RT08 says unresolved dominance stays Undetermined, without a global hierarchy. | ORG01 + ORG07, primary Undetermined; an explicit main need resolves the tie. Priority remains unchanged. |
| T17 no confirmed external route | “I am frightened” is explicit emotional distress. RT06 permits emotional support, while safety remains the immediate internal task. | SAFE01 immediately; ORG06 emotional aftercare is Additional, never a substitute for safety or an automatic referral. Primary remains Undetermined. |
| T20 either support organisation primary | Both needs are supported; the narrative does not choose a main need. RT08 requires an unresolved tie to remain Undetermined. | Both distinct support routes, primary Undetermined; no inferred severe distress or Priority. |
| UG03 generic login/OTP versus ORG01 bank mandate | UG03's routing description names ORG01, but ORG01 requires bank/payment linkage and RT09 requires exclusions/mandate fit. | Urgent can trigger on the explicit UG03 conjunction, but ORG01 requires separately supported bank linkage; otherwise clarify the affected account category. |
| Provisional on Routine | UG09 and the normative principle attach provisional when decisive facts lack independent verification; scenarios often omit the overlay for Routine. | Routine is a separate level; its decisive reported facts also carry Provisional until independently verified. |

## Team decision — 2026-11-10 (iteration 3)

After Gemini thinking was enabled, live runs showed the model filling `main_actionable_issue` from context rather than from an explicitly stated main need (T20 "need someone to talk to" → Emotional support; T21 → Telecom service; T15 → Scam reporting). The routing code took that value as the primary directly, so the model, not the deterministic tie-break, chose the primary route. In T20/T21 this matched the published acceptance rows but contradicted the RT08 adjudications above.

| Item | Decision | Reason | Trade-off accepted |
| --- | --- | --- | --- |
| T20, T21 (and any multi-route case) | Keep primary **Undetermined** unless the person states a priority. `organisationRouting.ts` now honours `main_actionable_issue` only when its quoted evidence contains explicit priority wording (`STATED_PRIORITY`: main, most important/urgent, first, priority, above all …). | Keeps the design boundary "the model extracts, code decides"; RT08 forbids a fixed global ranking and says unresolved ties go to staff. | Staff must pick the primary in these cases. T21's published row (ORG03 primary) and ORG03's "Primary when the SIM/number is the principal compromised service" clause were considered and not hard-coded; staff can select ORG03, and a stated priority in a clarification selects it automatically. |
| T08 | **No change.** Adjudication above stands (no route). | Live model sometimes sets `bank_account_concern=Yes` from BSB/account disclosure, giving ORG01 primary. Either outcome is safe and urgency stays Undetermined; fixing it needs prompt tuning and repeated live runs. | Recorded as a known model limitation; staff review applies. |

Offline re-score of the 66 recorded real extractions (`docs/live-e2e-runs.json`) with this change: PASS 45 → 49, MISMATCH 14 → 10, FAIL and ERROR unchanged. T21 3/3 PASS; T20 primary Undetermined 3/3 (two runs still add ORG05 from `reporting_need`); T15 primary Undetermined (ORG02 still missed).

The urgency engine chooses maximum triggered urgency and never uses monetary size, recency alone, unknown protective action or a single uncertain debit as an Urgent trigger. Routine requires the stated explicit event negatives and no interaction; language/access assistance alone does not raise urgency (T13).

## Validation limits

Live provider evaluation has not run without a configured key; see `provider-evaluation.json`. A provider may misunderstand negation, timing, speaker or claim semantics while quoting real text. The shared validator rejects fabricated quotes, invalid schemas/enums, derived outputs and model verification claims, but exact substring checks do not establish semantic entailment. Every result is staff-reviewed decision support. The live harness must be run and failures adjudicated for the intended provider/model before claiming semantic acceptance.

No visual browser screenshot comparison has been performed. CSS, branding assets and the three-screen navigation structure are preserved; DOM tests verify human review, navigation and report behavior. No external verification or persistent case storage has been added. The existing UI permits employee-modified proposals with history; it cannot perform consequential actions or certify provider/authority authenticity.
