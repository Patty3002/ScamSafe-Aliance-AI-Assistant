# Codex Build Prompt — ScamSafe Alliance Frontline AI Assistant

You are a senior full-stack engineer, product designer, and AI application architect. Build a **working, polished, interactive web prototype** for the UNSW INFS5706 *AI in Action* ScamSafe Alliance team project. **Implement it in the repository; do not stop at explaining, wireframing, or providing pseudocode.** Inspect the repository, reuse its existing stack and conventions when reasonable; if it is empty, scaffold a compact TypeScript + React + Vite application with Tailwind CSS and a minimal server-side API for LLM calls. Install dependencies, run automated checks, fix failures, and provide startup instructions.

## Reference documents and order of precedence

If present, read `docs/ScamSafe_Rules_v4.1.md` and `docs/AI_Assistant_Workflow_Chinese.md` before coding. They are included in the optional project bundle. Follow their substantive scam-response policies, but implement the specific UX refinements below **instead of copying older UI proposals in those files**. This prompt is self-contained if the two documents are not present. Do not recreate removed rules, identifiers, or fact-status taxonomies.

## Product goal and non-negotiable scope

Build an AI **decision-support tool for authorised frontline workers**, not a consumer chatbot. Its purpose is to take a natural-language report of a suspected scam, identify urgent risks and support needs, expose missing/contradictory information, propose responsible organisational teams and actions, allow **per-recommendation human review**, and generate a clear **case report**. The tool must not contact third parties, send referrals, freeze money, modify accounts, execute actions, or claim to confirm that a crime/scam actually occurred. Everything must use **synthetic fictional cases** for the prototype. Show a persistent unobtrusive banner: `Synthetic prototype · Human review required · Nothing is sent`.

Only three main case types exist, possibly overlapping (use descriptive titles, never C1/C2/C3 codes in the UI):
- Suspicious scam contact: texts, calls, email, websites, social platform ads/messages, attempted payment inducement.
- Reported or suspected financial loss: bank transfer, card transaction, payment wallet, platform-held balance.
- Possible disclosure of identity information or account credentials: ID documents, card details, passwords, verification codes, account takeover indicators.

The only approved routing targets are these **eight**, using the following *fictional* teams; never invent another organisation or recommend it as a routing target:
1. **Banks and Payment Providers:** `Fraud / Scam Response`, `Card Fraud / Disputes`, `Payment Provider Fraud`, `Account Security`.
2. **Digital Platforms:** `Trust & Safety`, `Account Security`, `Platform Balance Support`.
3. **Telecommunications Providers:** `Scam Messaging Reporting`, `Fraud & SIM Security`.
4. **Identity Recovery Services:** `Identity Recovery Support`.
5. **Government Scam Reporting Services:** `Scam Reporting & Case Coordination`.
6. **Victim Support Organisations:** `Victim Support & Follow-up` (emotionally distressed people; do not default here for digital-access difficulty).
7. **Community Support Organisations:** `Community Access & Practical Support` (language, digital literacy, accessibility, essential living support).
8. **The reporting organisation's Designated Emergency Safety Contact:** `Designated Safety Contact` (immediate threats to personal safety).

## The exact UX: three pages + report preview (not a mandatory fourth workflow step)

Design a professional, restrained front-office dashboard: responsive 1440px desktop first and mobile friendly; clear typography, neutral surfaces, restrained teal/navy accents, red/amber urgency hierarchy, accessible contrast, keyboard interactions, visible progress stepper (`Case Intake → AI Analysis → Recommended Actions`), loading/error/empty states. Prioritise usability over decorative effects. English UI labels and microcopy; concise, natural wording. Do not clutter the interface with internal rule codes, algorithms, `CONFIRMED / DENIED / UNKNOWN` labels, or multiple technical status schemes.

### Page 1 — Case Intake

- A prominent editable multiline textarea **Case Description** (free text; no rigid intake wizard or forced payment-method dropdown).
- Optional case title and fictional internal case ID; show optional sample-case chips/buttons: (a) suspicious online store/card debit and digital help; (b) bank transfer scam; (c) suspicious SMS with no loss; (d) identity document disclosed; (e) ambiguous payment channel; (f) contradictory report; (g) acute safety warning. Clicking a sample loads editable fictional text into the textarea.
- `Analyze Case` button triggers **real processing**. Validate nonempty input. Visible progress state. Do not display pre-baked fixed analysis regardless of what the worker types.
- A short notice: `Only synthetic information. Do not enter real personal or confidential data.` Do not solicit real card numbers, passwords, OTPs, passports or account numbers.

### Page 2 — AI Analysis & Clarification

Once analysis finishes, show these sections in **this exact vertical order**:

**A. Urgency first.** Always show `P1 — Immediate`, `P2 — Priority`, `P3 — Standard`, or `Priority requires clarification`. P1 is visually prominent and immediately includes a short **interim protective recommendation** and the relevant routing target if known. A P1 case must NEVER be blocked while missing information is clarified. Don't burden the primary urgency card with lengthy justifications; the case summary displays supporting facts. For immediate personal safety threats, override with the `Designated Safety Contact` as the highest-priority safety action; do not suppress independently urgent payment/account actions.

**B. Vulnerability indicator cards, ONLY when triggered.** Show the observed evidence and an explicit support suggestion. Serious emotional distress → ask whether victim-support assistance is wanted. Language difficulty, digital literacy, understanding, accessibility needs → ask whether **community support** assistance is wanted, subject to consent and availability. Basic living hardship → community support. Never assume age alone implies vulnerability. This is particularly important: *if the case says the person cannot use their banking app, the analysis and subsequent actions must include a recommendation for Community Support Organisations*. This is an **additional recommendation** alongside the bank action, not a replacement for it. Do not assume a referral has already been accepted or completed.

**C. Case Analysis — include an actual narrative CASE SUMMARY.** Start with a clear 2–4-sentence **Case Summary**, automatically generated from the worker's original text. It must capture what reportedly happened, relevant timeline, payment or exposure, and current concerns, using `reported`, `suspected`, or `possible` rather than certifying a scam. Under it, show small data points as available: main case type(s), reported amount or `Not reported`, transaction status as a natural-language statement, payment route or `Not specified`, relevant organisation/channel, possible credential exposure and existing protective steps. Do not fabricate absent values, and don't make employees re-enter known values.

**D. Information Quality Review.** Display `Missing Information`, `Conflict Flag`, and `Pending Verification` as **human-readable headings/indicators, not separately numbered rules**. Missing = materially absent fact; conflict = two mutually inconsistent statements; uncertain = a fact explicitly reported as unsure. `Pending Verification` appears if one of these unresolved facts could materially change urgency, routing, or actions; it is *not* a fourth urgency level. Display up to **three targeted clarifying questions** relevant to the actual case. If no critical gap exists, state `No decision-critical gaps identified`. Do not ask for a full bank transaction ID, actual password, OTP, CVV or other sensitive secrets. Do not demand proof before suggesting a team; the institution will verify. The labels can be compact when there is nothing to flag.

**E. Employee Review / Clarification, NOT a separate compulsory verification form.** This is a chance to review the AI's interpretation and *optionally* correct it. Don't present mandatory dropdowns for payment method or ask employees to manually re-enter facts already stated in Case Intake. Use an expandable `Correct AI understanding` edit area and targeted free-text `Add clarification` answers only where a decision-critical gap exists. Worker may press `Update Analysis` to re-run with the original narrative + annotated corrections/new facts, preserving distinction between original reported facts and added worker information. Worker may also choose `Continue with current information` at any point. Missing information must not disable this navigation, especially P1. If information is insufficient for a unique receiving team, show **conditional alternatives**, not simultaneous instructions to contact every institution.

### Page 3 — Recommendations & Human Review

Use the most recent case interpretation (including any employee clarification). Display **one** prioritised `Primary Recommendation` with organisation, exact fictional team, concrete proposed next step, urgency, and short case-specific rationale. If institution is genuinely indeterminate, show a small set of labelled *conditional routing alternatives* for worker selection; do not arbitrarily guess a single team.

Then render any genuinely applicable **separate, clearly differentiated cards**:
- `Additional Recommendations`: e.g. for the suspicious shopping website case, **Community Support Organisations — Community Access & Practical Support** because the affected person reports difficulty using the banking app. The frontline worker should **ask whether help is wanted**; an actual referral would require consent and service confirmation.
- `Necessary Parallel Actions`: only where a genuinely separate urgent risk needs its own institution/team (e.g. bank login credentials were also exposed, or personal safety issue). Do not inflate suggestions with repeated actions.
- `Follow-up / Reporting Suggestions`: optional lower priority scam content reporting/evidence-preservation steps.

**Every recommendation card is independently reviewable**. It has `Accept`, `Modify`, and `Reject` controls, an editable modification text area when `Modify` is chosen, and an optional staff comment/reason. Never ask for just one global accept/reject decision. When a decision changes, visually reflect it; accept and modified-accepted items are recorded as **proposed/approved by employee but NOT sent, referred or executed**. If there are conditional routing alternatives, the worker must select which is applicable before accepting it; rejected/undecided alternatives must not appear as approved referrals.

A prominent `Generate Case Report` button creates a formal, readable **report preview** within this page, in a drawer, modal, or expandable panel. Report generation is a **document assembly action only**, not external case submission. Ideally provide print/PDF and copy/download Markdown export using actual functioning browser behavior. The report must reflect the current case and human review selections — not generic sample text — with:
1. Fictional Case ID; generated date/time; `Synthetic Case Report — Not Sent` status.
2. Full narrative Case Summary and structured reported facts (as reported, not independently verified).
3. P1/P2/P3 priority or pending, vulnerability/support indicators where applicable.
4. Missing information, conflicting details and clarifying questions, if any; unresolved items remain visibly unresolved.
5. Primary recommended organisation/team and any separate secondary/support recommendation with reasons.
6. **Employee's per-action decisions**, including accepted, modified, rejected and still-pending items; accepted items listed as **planned handovers, not completed referrals**. Include staff notes and any modification text.
7. Human responsibility notice and `No external communication or referral has been sent`.

**Do NOT implement Send, Email, Notify, Auto-Refer or real external integration.** It is deliberately deferred. You may show a small disabled `Send / Transfer (Future Phase)` label or a note about potential future integration, but never a fake working send button. Report sharing/dispatch is explicitly out of scope for this version.

## Domain rules: R1–R5 in plain language (do not display rules as UI codes)

- **R1 Intake:** extract what is actually stated, plus reasonable risk indicators; keep unknowns unknown. Do not repeatedly verify reported facts before routing.
- **R2 Urgency:** P1 when an active or recently unprotected suspected scam payment, ongoing unauthorised debit, exposed bank/payment credentials needing urgent protection, or current account takeover. P2 when important exposure or historical financial risk needs prompt review but no ongoing serious harm is reported. P3 for suspicious contact with no reported payment/exposure/current account threat. If insufficient facts to make a defensible classification, `Priority requires clarification`. No separate `Severity` grade.
- **R3 Routing:** follow whoever controls the **payment rail, account, phone number or reported content**, not merely where the scam advertisement was seen. Bank transfer → `Fraud / Scam Response`; card charges or card disputes → `Card Fraud / Disputes`; third-party wallet → `Payment Provider Fraud`; digital platform's *own internal* balance → `Platform Balance Support`; bank account credentials → bank `Account Security`; platform credentials → platform `Account Security`; suspected platform ad/account → `Trust & Safety`; SMS/call → `Scam Messaging Reporting`; identity docs → `Identity Recovery Support`; related SIM/number issue → `Fraud & SIM Security`; broad report/unknown contact channel → `Scam Reporting & Case Coordination` (NOT money recovery). Victim support vs community support as specified above.
- **R4 Action:** if information is enough, one main routing recommendation; allow justified different-risk parallel actions and support recommendations. Explicitly distinguish (i) **unauthorised card payment**, (ii) **cardholder knowingly paid a suspected scam merchant**, and (iii) **ordinary merchant delivery/refund dispute**. The second is NOT an unauthorised transaction. A missing confirmation alone does not establish a scam; normal delivery delay alone must NOT cause automatic P1. Recommendations are only suggestions for authorised workers, not actions the AI takes.
- **R5 Pending Verification:** combine missing, uncertain and conflicting decision-critical information. Up to 1–3 precise questions; if routing is ambiguous present conditional options. For P1 provide the immediate interim action first. Do not demand irrelevant complete details or delay urgent care.

Immediate self-harm / personal safety risk: visibly flag and route to `Designated Safety Contact` before general steps. Do not diagnose people or make unsupported claims. No other independent organisations beyond the eight above.

## Implement REAL analysis rather than a scripted fake

Use an LLM server-side if appropriate credentials are configured (reuse an existing provider if the repository already has one; otherwise support `OPENAI_API_KEY` via server-side environment variables, never browser-exposed). Implement a clear model instruction/prompt based on R1–R5 and enforce **structured JSON output** validated with a schema. AI performs **natural-language summarisation, extraction and targeted follow-up generation**; enforce routing targets, review states, priority safety overrides and limited approved organisation/team vocabulary in deterministic post-processing where practical. Never allow a model's generated text to directly trigger external side effects.

Create an internal typed model containing at least: `caseId`, `originalNarrative`, `workerClarifications`, `summary`, `caseTypes`, `reportedFacts`, `priority`, `interimAction`, `vulnerabilityIndicators`, `missingInfo`, `conflicts`, `pendingVerification`, `clarifyingQuestions`, `recommendations` (unique id, kind, organisation, team, action, reason, condition), and `reviewDecisions` (per-id accept/modify/reject/pending, edited action, notes). You may adapt structure to the existing stack; don't surface internal field names unnecessarily in the UI. Strictly prevent the model from claiming to have validated bank records, identifying the scammer, or contacting anyone.

If no API key exists, provide an **explicitly labelled `Local Rule-Based Demo Mode`** using **dynamic analysis from the user's current input**, not hard-coded fixed outputs from sample buttons. A clear banner must indicate that real LLM analysis requires a configured API key. The app should nevertheless function offline for demonstration: text extraction by simple patterns/heuristics, rule-based routing, and editable manual review. Do not present rule-only fallback as genuine LLM output or claim that an API call occurred when it did not. Include `.env.example` and setup steps for model-backed operation.

On provider timeout or malformed JSON, show a non-crashing user-friendly error and a retry control; optionally offer the transparent demo fallback. Persist review choices correctly across navigation and **invalidate/reconcile choices if fresh analysis replaces an action**. Use no real sensitive data; prefer in-memory state instead of permanent storage.

## Synthetic acceptance scenario (must work end-to-end)

Intake text:
`A person found an online store with unusually cheap goods, entered payment information and completed a card payment of AUD 280. Their card shows the charge, but they received no order confirmation or delivery details. They are worried the site may be fraudulent. They say they cannot use their banking app and need help.`

Expected:
- Nonempty **Case Summary** mentioning the website, reported AUD 280 card charge, missing confirmation and uncertainty about merchant legitimacy, with careful language.
- **P1 if the newly reported suspect payment is still unprotected** under prototype's synthetic guidance; not a claim that scam or unauthorised transaction is proven.
- Primary: **Banks and Payment Providers → Card Fraud / Disputes**. Explain assessment of suspicious merchant / goods-not-received dispute and card protection. Do **not** classify as an unauthorised charge merely because no confirmation exists.
- Separate **Additional Recommendation: Community Support Organisations → Community Access & Practical Support**, because the person cannot operate the banking app. Wording: ask whether they want support, get consent and confirm service capability before arranging a referral.
- Ask relevant targeted clarification if information would change treatment (e.g. what banking/credential data was entered, whether card protection was already sought); do not require the worker to manually reselect `card payment` because the description already provides it.
- Worker can independently **Accept primary**, **Accept/Modify/Reject community support**, and generate a report showing both individual decisions and the receiving teams. Nothing is transmitted.

## Additional acceptance checks

Test or manually verify at least these fictional cases:
1. Suspicious SMS, no reported payment or credential exposure → generally P3 and telecom reporting.
2. Recent bank transfer to suspected scam recipient → P1 and bank `Fraud / Scam Response`.
3. Unauthorised card charge → `Card Fraud / Disputes`; do not call it authorised merchant dispute.
4. Clearly ordinary delayed shipping with no concrete scam indicators → not automatically P1 / confirmed fraud.
5. Bank password/OTP disclosed → P1; bank `Account Security`; never request the secret itself.
6. ID document disclosed → identity recovery and typically P2 absent active emergency facts.
7. Payment confirmed but channel unknown → conditional routing options + Pending Verification; no guessed institution.
8. Two contradictory payment amounts → conflict indicator, specific question, preserve known risk.
9. Serious emotional distress → victim-support recommendation, not digital-literacy support unless also indicated.
10. Digital accessibility difficulty → community support; **no automatic victim support**.
11. Credible immediate personal safety threat → `Designated Safety Contact` priority and any separate justified financial action.
12. On all cases, per-card acceptance/modification/rejection must be reflected accurately in the generated report.

## Final development instructions and definition of done

- Examine current files and choose the least disruptive architecture. Build all three functioning screens and the case-report preview/export; do not leave placeholder buttons or static-only mockups.
- Include a small set of synthetic demo fixtures and a clear switch to them; no real integrations.
- Write clean modular components, accessible and responsive. Include typed schema/validation, deterministic policy helpers where useful, and helpful error states.
- Provide automated tests for critical routing, urgency, vulnerability support and report contents where practical.
- Run install, lint, typecheck, tests and production build as supported in this repository. Fix failures rather than listing them.
- Document exact local startup commands, optional server-side API key setup, demo fallback limitations, and how to run the synthetic shopping case in `README.md`.
- After implementation, report files changed, commands run, and what was or was not verified. Don't claim functionality that was not tested.

**Build the application now.** Do not ask for design approval or spend the turn drafting a plan instead of implementing. Make sensible design defaults. Keep the functionality narrowly focused on the three scam categories and eight approved routing targets.
