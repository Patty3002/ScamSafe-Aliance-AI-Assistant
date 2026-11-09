# Rulebook 1.1 migration report

Implementation and offline verification are finished on `codex/rulebook-v1-1-migration`. The replacement engine is connected to the application and exercised through the UI tests. Full live semantic acceptance is **not claimed**: no provider key is configured, and several published scenario expectations conflict with the authoritative rulebook.

No commit, merge, push or deployment was performed. Existing untracked `package-lock.json` was left untouched. The three supplied Markdown files were read before edits; the rulebook and acceptance document were copied into `docs/` unchanged. The migration prompt was treated as the user-authorised migration instructions, not as a second business specification.

## Architecture and removal evidence

The old `src/analysis.ts` implementation was replaced completely. No old urgency predicates, route-by-channel helper, policy loader, legacy fallback, old model risk signals, old scenario data or eighth external safety category remains in the active runtime. Superseded working-tree documents/fixtures are physically deleted below; Git history remains intact. Searches of tracked and new runtime files found no old execution paths. The change gate also checks obsolete filenames and legacy symbols before tests/build. CSS class names such as `p1` remain presentation-only.

Every successful provider response goes through the shared schema/evidence validator and new deterministic `evaluate` function. The rulebook Markdown is not included in provider prompts. Unknown or invalid extraction never invokes a heuristic narrative fallback or defaults to Routine. Independent verification cannot be supplied by a model. SAFE01 and SP01 produce internal human workflow tasks; only ORG01–ORG07 are external categories.

The UI retains Case Intake, AI Analysis & Clarification, and Recommended Actions / Case Report. `src/styles.css` is unchanged. Accept/Modify/Reject, staff notes, navigation and reports are tested. Original intake is immutable after analysis; clarification/correction history and superseded reviews remain available. Material changes reset approval state. Reasoned human priority/primary choices preserve computed decisions and safety alerts. No operational send/contact/execute capability was added.

## Verification results

| Check | Result |
| --- | --- |
| `pnpm run test` | PASS — 59 tests in 4 files |
| Deterministic T01–T22 | PASS — rulebook-derived structured expectations; published discrepancies explicitly documented |
| Rule-ID exercise | PASS — all 48 unique IDs exercised, plus predicate/boundary assertions |
| Provider integration | PASS — mocked Gemini/OpenAI protocol, malformed JSON, unsupported evidence, timeout, missing key and sensitive-input rejection |
| UI controls | PASS — three-screen navigation, review states, correction recomputation, immutable input and report history |
| `pnpm run typecheck` | PASS |
| `pnpm run build` | PASS — production bundle generated locally |
| `pnpm run check:policy` | PASS — canonical hash, 48 IDs, coverage map, exact T01–T22 narrative synchronization, legacy-path removal |
| `git diff --check` | PASS — no whitespace errors; Git reports normal Windows line-ending normalization notices |
| `pnpm run eval:live` | **NOT RUN** — selected provider has no configured key; status saved in `docs/provider-evaluation.json` |
| Visual screenshot comparison | NOT RUN — source styling unchanged; DOM behavior tested |

## Rule coverage

| Family | IDs | Count |
| --- | --- | --- |
| Classification | CL01–CL03 | 3 |
| Information | IR01–IR08 | 8 |
| Urgency | UG01–UG09 | 9 |
| Routing | RT01–RT10 | 10 |
| Support | VU01–VU05 | 5 |
| Verification | VE01–VE07 | 7 |
| Safety | SAFE01 | 1 |
| Controls | CTL01–CTL04 | 4 |
| Specialist | SP01 | 1 |
| Total | | **48** |

See `../RULE_COVERAGE.md` for each Rule ID, executable source, output/control and tests. F01–F45 coverage and the policy change gate are also documented there. This is rule implementation/test coverage, not a statement that a model understands every narrative.

## Unresolved limitations

1. `SPECIFICATION_DISCREPANCIES.md` records exact conflicts involving T07, T08, T09, T15, T17, T20, T21 and unconditional reporting additions in T04/T05/T08/T14. The rulebook wins: missing statements remain Unknown; unsupported urgency/route assumptions are not invented; unresolved primary ties remain Undetermined. The supplied documents are not silently edited.
2. No live model semantics have been validated. `pnpm run eval:live` must be rerun for the intended configured provider/model, with human adjudication of failures. Exact quote/schema validation does not prove semantic entailment; a model can misread a genuine quote. Mock tests establish protocol only.
3. No visual browser comparison was performed. The styling file and three-screen architecture remain unchanged, with minimal result/review additions and 22 replacement samples.
4. Obvious secret/identifier inputs are rejected, but this is not comprehensive personal-data detection. Use synthetic data only. No external provider/authority verification or durable case database was added; case state remains in browser memory. Independent-verification records are supported by the engine contract but not certified through the current UI.
5. Summary rendering is conservative and extractive from the original narrative rather than trusting model-generated prose. This avoids unsupported summary claims but may be less polished than a validated model summary.

## Exact file inventory

### Deleted (5)

- `AI_Assistant_Workflow_Chinese.md`
- `ScamSafe_Alliance_AI_Assistant_Rules_v4.1.docx`
- `ScamSafe_Codex_Build_Prompt.md`
- `docs/ScamSafe_AI_Decision_Policy_中文版.md`
- `docs/ScamSafe_Acceptance_Cases.json`

### Modified (11)

- `README.md` — Replaced setup/architecture instructions and active-policy claims; documented limited mode, change gate and live evaluation.
- `package.json` — Added policy checks before tests/build, standalone check and provider-neutral live evaluation command.
- `server.mjs` — Removed policy injection and legacy schema. Shared fact contract, exact evidence validation, explicit failures, timeout and startup hash check.
- `server.test.mjs` — Replaced legacy expectations with both-provider success, malformed/unsupported output, timeout, no-key and privacy checks.
- `src/App.test.tsx` — Replaced old scenarios with T11/T04 review/navigation/report/correction and unavailable-provider tests.
- `src/App.tsx` — Kept three screens and styling; added Provisional, evidence/guidance, separate workflows, immutable intake, quality-state fix, audit history and reasoned staff decisions.
- `src/acceptance.test.ts` — Replaced the entire scenario test suite with T01–T22 using rulebook-derived structured expectations.
- `src/analysis.test.ts` — Replaced old heuristic assertions with deterministic predicate, mandate, task-scope, provenance, controls and 48-ID coverage tests.
- `src/analysis.ts` — Entire legacy engine removed; now validation, deterministic orchestration, UI adaptation and an explicit no-extraction state.
- `src/report.ts` — Added Provisional, primary, Rule IDs, guidance, structured evidence/decision history and staff decisions; kept NOT SENT / NOT EXECUTED.
- `src/types.ts` — Removed safety as an external organisation and legacy extraction fields; added canonical decision, audit and human-control types.

### Added (19)

- `RULE_COVERAGE.md`
- `docs/MIGRATION_REPORT.md`
- `docs/SPECIFICATION_DISCREPANCIES.md`
- `docs/ScamSafe_Acceptance_Tests_v1.1.md`
- `docs/ScamSafe_Rulebook_v1.1.md`
- `docs/policy-lock.json`
- `docs/provider-evaluation.json`
- `scripts/check-policy.mjs`
- `scripts/evaluate-provider.mjs`
- `src/policy/contract.d.mts`
- `src/policy/contract.mjs`
- `src/policy/organisationRouting.ts`
- `src/policy/policyVersion.ts`
- `src/policy/ruleEngine.ts`
- `src/policy/scenarios.json`
- `src/policy/staffReview.ts`
- `src/policy/structuredFacts.json`
- `src/policy/structuredScenarios.ts`
- `src/policy/types.ts`

### Preserved

`src/styles.css`, `src/main.tsx`, `index.html`, Vite configuration, TypeScript configuration, `.env.example` and `pnpm-lock.yaml` were not changed. The pre-existing untracked `package-lock.json` was not changed.
