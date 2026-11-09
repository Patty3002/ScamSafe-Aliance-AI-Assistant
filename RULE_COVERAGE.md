# Rulebook 1.1 executable coverage

The sole business specification is `docs/ScamSafe_Rulebook_v1.1.md`. These entries map all 48 rules to executable predicates, task construction or enforced orchestration controls. Source evidence, uncertainty and human-review state accompany each fired rule. Tests assert all 48 IDs are exercised and separately check predicates and boundaries; firing an ID alone is not proof of correctness.

`src/acceptance.test.ts`: exact T01–T22 narratives with human-curated structured reports. `src/analysis.test.ts`: rule predicates and boundaries. `src/App.test.tsx`: human review, navigation, original narrative and history. `server.test.mjs`: shared provider protocol and failures. See `docs/SPECIFICATION_DISCREPANCIES.md` for published expectations that conflict with the authoritative rules.

| Rule ID | Executable source | Output/control | Tests |
| --- | --- | --- | --- |
| CL01 | `src/policy/ruleEngine.ts` | A=Yes; classify channel(s); if explicit denial A=No | classification and source evidence assertions; T02, T03, T06, T14, T16, T22 |
| CL02 | `src/policy/ruleEngine.ts` | B=Yes; classify financial event | classification and source evidence assertions; T01, T04, T14, T16 |
| CL03 | `src/policy/ruleEngine.ts` | C=Yes; classify exposure type | classification and source evidence assertions; T06, T07, T08, T16, T22 |
| IR01 | `src/policy/ruleEngine.ts` | Extract basic event narrative, time, reported impact, ongoing-risk signals and supporting quotes | information applicability/N/A and task-scope tests; T01 |
| IR02 | `src/policy/ruleEngine.ts` | Check channel, interaction/action and approximate time; if digital/telecom route, capture non-sensitive channel descriptor | information applicability/N/A and task-scope tests; T03, T21 |
| IR03 | `src/policy/ruleEngine.ts` | Check event type, reported amount, approximate time, provider, authorisation, ongoing activity, previous contact | information applicability/N/A and task-scope tests; T04, T16, T21 |
| IR04 | `src/policy/ruleEngine.ts` | Check exposure category, approximate time, suspicious access / identity misuse as applicable | information applicability/N/A and task-scope tests; T08, T16 |
| IR05 | `src/policy/ruleEngine.ts` | Check the distinct support task: V1 emotional recovery; V2 language/interpretation; V3 digital literacy/accessibility; V4 basic-needs navigation | information applicability/N/A and task-scope tests; explicit predicate/control test |
| IR06 | `src/policy/ruleEngine.ts` | Check receiving destination, permitted case summary and task-specific required facts | information applicability/N/A and task-scope tests; explicit predicate/control test |
| IR07 | `src/policy/ruleEngine.ts` | Check claimed entity, requested action, any deadline/pressure, payment or credential request, contact route, actions already taken and independent verification status | information applicability/N/A and task-scope tests; T19 |
| IR08 | `src/policy/ruleEngine.ts` | Check pop-ups/redirects/persistent page/device unusable; clicked/downloaded/installed/granted permission/remote access; whether credentials were entered or only stored; any account anomaly | information applicability/N/A and task-scope tests; T03, T18 |
| UG01 | `src/policy/ruleEngine.ts` | Set Urgency=Urgent with Provisional overlay if not independently verified; trigger SAFE01 immediately; exact timing/location details must not delay authorised human attention | urgency predicates, boundaries and evidence gates; T11, T17 |
| UG02 | `src/policy/ruleEngine.ts` | Set Urgency=Urgent, Provisional until independently verified; distinguish ongoing/repeated suspicious activity from a single new transaction whose authorisation is Unknown | urgency predicates, boundaries and evidence gates; T05, T16 |
| UG03 | `src/policy/ruleEngine.ts` | Set Urgency=Urgent, Provisional until verified; suggest immediate bank/account-security assessment | urgency predicates, boundaries and evidence gates; explicit predicate/control test |
| UG04 | `src/policy/ruleEngine.ts` | At least Priority (provisional if report unverified) | urgency predicates, boundaries and evidence gates; T04, T09, T12, T14, T16, T21 |
| UG05 | `src/policy/ruleEngine.ts` | Set at least Priority (Provisional if not independently verified); route by exposure subtype | urgency predicates, boundaries and evidence gates; T06, T07, T16, T22 |
| UG06 | `src/policy/ruleEngine.ts` | Set at least Priority for prompt human support assessment; do not automatically set Urgent | urgency predicates, boundaries and evidence gates; T09, T10 |
| UG07 | `src/policy/ruleEngine.ts` | Routine (if no higher-priority rule) | urgency predicates, boundaries and evidence gates; T02, T13, T15 |
| UG08 | `src/policy/ruleEngine.ts` | Undetermined + targeted questions; cannot infer low risk | urgency predicates, boundaries and evidence gates; T01, T03, T08 |
| UG09 | `src/policy/ruleEngine.ts + src/policy/staffReview.ts + src/App.tsx` | Choose maximum Urgent > Priority > Routine; attach Provisional flag when triggering facts not independently verified | urgency predicates, boundaries and evidence gates; explicit predicate/control test |
| RT01 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG01 Bank & Payment Providers; Primary when financial/account action is the most immediate actionable issue | organisation responsibility boundaries; T04, T05, T06, T09, T14, T16 |
| RT02 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG02 Digital Platforms; Primary when the platform can act on the main content/account issue | organisation responsibility boundaries; T14, T15, T16, T22 |
| RT03 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG03 Telecommunications Providers | organisation responsibility boundaries; T21 |
| RT04 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG04 Identity Recovery Services; Primary when identity recovery/protection is the main actionable issue | organisation responsibility boundaries; T07, T22 |
| RT05 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG05 Government Scam Reporting Services; Primary only when reporting is the main/only actionable need; otherwise Additional | organisation responsibility boundaries; T02, T06, T07, T22 |
| RT06 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG06 Victim Support Organisations; Primary if emotional recovery is the main/only actionable need | organisation responsibility boundaries; T10, T20 |
| RT07 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Match ORG07 Community Support Organisations; Primary if practical access/basic-needs support is the main/only actionable need | organisation responsibility boundaries; T09, T13, T15, T20 |
| RT08 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Select one Primary by most immediate, material and actionable issue; list other valid matches as Additional; if no clear dominant issue, Primary=Undetermined | organisation responsibility boundaries; T16, T20, T21 |
| RT09 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Require explicit fit with the organisation's mandate, in-scope responsibilities and trigger; check exclusions before matching | organisation responsibility boundaries; T02, T03, T06, T07, T10, T13, T15, T18, T19, T22 |
| RT10 | `src/policy/organisationRouting.ts + src/policy/ruleEngine.ts` | Do not route solely by channel; require an actionable matter the organisation can handle | organisation responsibility boundaries; T02, T03, T13, T18, T19 |
| VU01 | `src/policy/ruleEngine.ts` | Record reported distress; flag victim-support and consider UG06; check safety separately | support separation and urgency tests; T10, T20 |
| VU02 | `src/policy/ruleEngine.ts` | Record language assistance and routing to community support | support separation and urgency tests; T13 |
| VU03 | `src/policy/ruleEngine.ts` | Record requested accessibility / assisted channel | support separation and urgency tests; T15, T20 |
| VU04 | `src/policy/ruleEngine.ts` | Record practical/basic-needs support need and route to ORG07 Community Support; only add ORG06 if separate emotional-support need is reported | support separation and urgency tests; T09 |
| VU05 | `src/policy/ruleEngine.ts` | Match ORG06 only for emotional/psychological recovery need; match ORG07 for language, digital skills, accessibility/communication or basic-needs need | support separation and urgency tests; T20 |
| VE01 | `src/policy/ruleEngine.ts` | Flag Missing with reason and target task; Not Applicable excluded | information, provenance and control gates; explicit predicate/control test |
| VE02 | `src/policy/ruleEngine.ts` | Mark Conflicting; preserve both source quotes; request staff clarification | information, provenance and control gates; T12 |
| VE03 | `src/policy/ruleEngine.ts` | Status = Staff-reviewed report; NOT Independently verified | information, provenance and control gates; explicit predicate/control test |
| VE04 | `src/policy/ruleEngine.ts` | Only THAT task = Pending Verification / Needs Info; retain urgency and preliminary advice | information, provenance and control gates; T05, T12, T17 |
| VE05 | `src/policy/ruleEngine.ts + src/analysis.ts + src/App.tsx + src/report.ts` | Re-run affected classification, urgency, routing, info requirements and recommendations; store change log | information, provenance and control gates; explicit predicate/control test |
| VE06 | `src/policy/ruleEngine.ts` | Set authority-verification task to Pending Verification; preserve claimed entity and message content; request independent official-channel verification | information, provenance and control gates; T19 |
| VE07 | `src/policy/ruleEngine.ts` | Set device assessment task to Pending Specialist Review where malware/device control cannot be established from narrative | information, provenance and control gates; T18 |
| SAFE01 | `src/policy/ruleEngine.ts` | Display Internal Safety Escalation immediately and alert authorised staff to follow the internal emergency protocol; do not wait for ABC classification or missing details | safety ordering and UI T11 review test; T11, T17 |
| CTL01 | `src/policy/ruleEngine.ts + src/analysis.ts + src/App.tsx + src/report.ts` | No scam confirmation, bank blocks, account edits, cross-org contact, or consequential autonomous decisions | proposal/report controls, server privacy and UI review tests; explicit predicate/control test |
| CTL02 | `src/policy/ruleEngine.ts + src/analysis.ts + src/App.tsx + src/report.ts + src/policy/contract.mjs + server.mjs` | Synthetic cases/guidance only; mask real PII and never request credentials, OTP or account identifiers as actual values | proposal/report controls, server privacy and UI review tests; T06 |
| CTL03 | `src/policy/ruleEngine.ts + src/analysis.ts + src/App.tsx + src/report.ts` | Display rule ID, supporting reported facts, assumptions, unknowns, and review status; no guidance match => human specialist review | proposal/report controls, server privacy and UI review tests; explicit predicate/control test |
| CTL04 | `src/policy/ruleEngine.ts` | Check ORF mandate, exclusions, route trigger, minimum information and Primary/Additional rationale | proposal/report controls, server privacy and UI review tests; explicit predicate/control test |
| SP01 | `src/policy/ruleEngine.ts` | Create Specialist Review Required task; state why no organisation mandate matches; retain candidate routes only where independently justified | device/authority/no-mandate boundary tests; T03, T18 |

## Field and orchestration coverage

- F01/F02: immutable case ID/original narrative in Analysis; clarification and correction are separate sources, with full decision history.
- F03–F27/F37–F41/F43: canonical extraction contract, allowed states, exact source spans and deterministic working facts. Context fields expand F02/F08/F09/F23 to describe actionable issues without accepting model-selected organisations.
- F28/F29: source evidence and per-field review status. Staff-reviewed wording is never independent proof.
- F30–F36: urgency, separate Provisional flag, routes, missing information, verification tasks, handover state and rule trace. Employee decisions remain separate human controls.
- F42: authorised `StaffVerification.authority_verification_status`, never model-supplied. The current UI cannot certify independent verification.
- F44/F45: specialist reasons and mandate/primary/additional rationale with Rule IDs and evidence.

## Change gate and live evaluation

`pnpm run check:policy`, pretest, prebuild and server startup check the rulebook SHA-256. The check verifies the 48 canonical IDs, this map and exact T01–T22 narrative synchronization. A rulebook edit blocks execution until developers review the engine/tests and explicitly update the lock; this detects change but cannot prove semantic equivalence.

`pnpm run eval:live` checks the same 22 synthetic narratives against the selected configured provider for fields, negatives, Unknown/conflicts, exact evidence and unsupported positive mandate/support signals. Results are recorded in `docs/provider-evaluation.json`. Mock tests do not prove model understanding. Provider changes require a fresh run. Human adjudication is required for semantic failures and specification ambiguities.

Staff priority/primary decisions require a rationale, preserve the computed result and safety alert, invalidate proposal approvals and remain in report/history (`src/policy/staffReview.ts`; human override tests). Primary selection is limited to mandate-supported candidates or Undetermined.
