# ScamSafe Alliance frontend assistant

Synthetic educational prototype. Use fictional case data only. The existing three-screen workflow is Case Intake → AI Analysis & Clarification → Recommended Actions / Case Report. Nothing is sent or executed.

## Business authority and execution

`docs/ScamSafe_Rulebook_v1.1.md` is the sole authoritative business specification. `docs/ScamSafe_Acceptance_Tests_v1.1.md` supplies the only active scenarios, T01–T22. `RULE_COVERAGE.md` maps all 48 Rule IDs. Known specification conflicts are recorded in `docs/SPECIFICATION_DISCREPANCIES.md`; the engine follows the rulebook and never fills a gap with a superseded heuristic.

A provider extracts evidence-backed reported facts using `src/policy/contract.mjs`. The shared validator checks schema, enums, source identity and exact quotes. `src/policy/ruleEngine.ts` computes classifications, urgency, separate Provisional status, support indicators, task-level information quality and verification. `src/policy/organisationRouting.ts` applies the seven mandates and selects a primary only where a dominant actionable issue is established. `src/analysis.ts` adapts these decisions to the existing UI. The model cannot set final urgency, routes or verification outcomes. The rulebook is not inserted into the model prompt.

Internal Safety Escalation and Specialist Review are workflow tasks, not external organisations. No automatic calls, reports, referrals, account operations or device control exist. Category-level routes do not invent receiving teams. Accepted/modified proposals remain NOT SENT / NOT EXECUTED.

## Run locally

Install dependencies with `pnpm install`. Set the selected provider and key in your process environment (see `.env.example`); the server does not automatically load `.env`. Run `pnpm run dev`, then open the local URL printed by the server. Keep keys out of browser code and Git. The current configured adapters are Gemini and OpenAI; both use the same extraction schema and independent rule engine.

Without a key, on upstream failure, timeout, malformed JSON or invalid source evidence, the UI explicitly shows Limited Demo/error status and Undetermined priority. No narrative heuristics simulate successful AI understanding. Staff must assess the original narrative, including safety. Obvious identifiers, URLs and secret values are blocked before sending; this is not comprehensive personal-data detection, so synthetic-only use remains mandatory.

Original intake and case ID are locked after the first analysis attempt. Clarifications and corrections remain separate and re-run the engine. Prior decisions and corrections remain in history. Material fact/decision changes reset proposal approvals. Staff can record a priority or supported-primary decision with a required rationale; the computed result and safety alert remain visible and the override is audited. Refresh the page to start a new case. Current state is in browser memory only; it is not durable storage. Staff agreement is not independent verification. The engine accepts explicit authorised verification records for testing/integration; the UI does not certify external verification.

## Verification

- `pnpm run test`: deterministic T01–T22, predicate/boundary, provider protocol and UI control tests.
- `pnpm run typecheck`: TypeScript validation.
- `pnpm run build`: policy change gate, typecheck and production bundle.
- `pnpm run check:policy`: rulebook hash, 48 documented IDs, coverage map and exact fixture narrative synchronization.
- `pnpm run eval:live`: same T01–T22 semantic evaluation against the selected configured provider; writes `docs/provider-evaluation.json`. With no key it records NOT RUN, never PASS.

Fixtures are generated from the supplied acceptance Markdown. Human-curated structured facts are only imported by tests/evaluation, never by the runtime narrative analysis. Expected differences from the scenario prose are explicit in the discrepancy report. Mock provider tests establish request/response handling only. Exact quote validation does not prove that a model interpreted the quote correctly; live semantic evaluation and human review remain necessary.

A changed rulebook fails startup/build checks until developers review matching rule-code/test changes and explicitly update `docs/policy-lock.json`. The lock detects a change, not semantic equivalence. Do not deploy or merge this feature branch without approval.
