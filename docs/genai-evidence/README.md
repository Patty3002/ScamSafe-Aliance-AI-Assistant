# GenAI development evidence (archive)

Retained for the INFS5706 Level 5 evidence requirement (prompts and instructions, design iterations, tests and failures, revisions, tool and configuration choices). **Nothing in this folder is used at runtime or by tests.** The current authority is `docs/ScamSafe_Rulebook_v1.1.md` and `docs/ScamSafe_Acceptance_Tests_v1.1.md`.

## Superseded design files

Restored byte-for-byte from commit `71fbc8d` (2026-10-28), the last version before they were removed in `3fdc348` (2026-11-09) during the Rulebook v1.1 migration. `scripts/check-policy.mjs` blocks them from returning to their original active paths; this archive path is deliberate.

| File | What it was |
| --- | --- |
| `ScamSafe_Codex_Build_Prompt.md` | The build prompt given to Codex to generate the first prototype |
| `AI_Assistant_Workflow_Chinese.md` | Earlier workflow description (Chinese) |
| `ScamSafe_Alliance_AI_Assistant_Rules_v4.1.docx` | Rules v4.1, replaced by Rulebook v1.1 |
| `ScamSafe_AI_Decision_Policy_中文版.md` | Earlier decision policy (Chinese) |
| `ScamSafe_Acceptance_Cases.json` | Earlier acceptance fixtures, replaced by T01–T22 |

## Iteration and test evidence (elsewhere in the repo)

| Evidence | Location |
| --- | --- |
| v1.1 migration record | `docs/MIGRATION_REPORT.md` |
| Rule vs test conflicts and team decisions | `docs/SPECIFICATION_DISCREPANCIES.md` |
| Live test, iteration 1 | `docs/LIVE_E2E_REPORT_2026-11-10.md` |
| Live test, iteration 2 (thinking enabled) | `docs/LIVE_E2E_REPORT_2026-11-10_iter2.md` |
| Raw model outputs and scores | `docs/live-e2e-runs.json`, `docs/live-e2e-report.json` |
| Every change | `git log` |

Chat transcripts with AI tools (Codex, Claude, Gemini) are not stored here; keep exported copies until results are finalised.
