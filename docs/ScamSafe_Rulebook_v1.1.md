# ScamSafe Alliance — Synthetic Decision Rulebook v1.1

> **Status:** Synthetic educational rulebook for INFS5706 ScamSafe Alliance prototype. Not official Australian law, police, banking, telecommunications, government or victim-support policy. Use synthetic case data only.
> **Business rule version:** 1.1 (converted faithfully from `ScamSafe_Codex_Implementation_Spec_v1_2.xlsx`; spreadsheet filename 1.2 refers to packaging, not a different business rule).
> **Authority:** This file is the canonical specification for rules, data definitions, organisation mandates and verification behavior. `ScamSafe_Acceptance_Tests_v1.1.md` is the canonical new scenario set.
> **Runtime:** Markdown describes the policy; every material decision MUST be enforced by deterministic application logic. Merely adding this file to an LLM prompt does NOT constitute rule implementation.


## 0. Normative principles

- **A / B / C are overlapping event indicators:** A = suspected scam contact; B = scam-related financial event (induced transfer, suspected unauthorised transaction or reported financial loss); C = actual or credibly reported information disclosure/exposure. These labels are **not mutually exclusive**. Do not infer a positive event from the mere presence of a device, website or banking details.
- **Truth status:** distinguish Yes, No, Unknown, Conflicting and Not Applicable where supported by the field. Absence of a statement is **Unknown**, not No. Reported content is not independently verified evidence.
- **Safety override:** evaluate `UG01` and `SAFE01` before ordinary information completeness checks or external routing. Do not delay human safety attention for missing details. Internal safety escalation is **not** an eighth organisation.
- **Separation of responsibilities:** the LLM extracts supported facts and writes grounded narrative; deterministic application code calculates urgency, routing, missing-information, verification tasks and control gates. Staff decide and act.
- **Missing Information:** a field is a true missing-information item only when it is applicable, needed for a specific decision or task, and Unknown. An optional field is not a blocker. `Missing`, `Conflicting`, `Pending Verification` and `Not Applicable` are distinct.
- **Priority:** Urgent / Priority / Routine / Undetermined are distinct results; `Provisional` is a separate status overlay. Apply higher triggered urgency; do not infer Routine from absence of evidence.
- **Routing:** ORG01–ORG07 are the seven external organisation categories; evaluate **mandate + specific actionable issue + exclusions** before suggesting a route. Contact channel alone is insufficient. One primary route only when a dominant actionable issue exists; otherwise primary is Undetermined. Distinct additional tasks may be recommended.
- **Support distinction:** ORG06 Victim Support for V1 emotional recovery; ORG07 Community Support for V2 language, V3 digital/accessibility, V4 basic needs. Both only where two distinct supported needs exist.
- **Out-of-scope:** SP01 Specialist Review is a workflow task, not an organisation. Do not invent a specific organisation or infer a technical compromise or official-message authenticity without evidence.
- **Human gate and privacy:** AI never confirms fraud, freezes/modifies accounts, contacts institutions, submits reports, makes emergency calls, or takes consequential decisions. Do not request actual passwords, OTPs, full bank/card/account numbers, identity documents or live sensitive customer data. Recommendations are **NOT SENT / NOT EXECUTED**.
- **Auditability:** each material decision must carry Rule ID(s), source fact(s)/evidence, assumptions, uncertainties and a human-review state. Employee corrections update working facts but preserve original narrative and decision history.

## 1. Data Dictionary (F01–F45)

The first section defines 45 **internal** fields. Derived fields (urgency, routing, status, fired rules) MUST be produced by the rule engine, not invented by the LLM. The UI should show only relevant fields, not all 45.

| ID | Machine field | Meaning (中文) | Data type | Allowed values/content | Applicability | Source / derivation | Sensitive-data rule |
| --- | --- | --- | --- | --- | --- | --- | --- |
| F01 | case_id | 案件ID | string | Synthetic ID | Always | Auto-generated | No |
| F02 | case_narrative | 原始案件陈述 | text | User-reported text | Always | Frontline staff | No real data |
| F03 | reporting_organisation | 接报机构 | enum | Bank / Telecom / Platform / Other / Unknown | Always | Frontline staff | No |
| F04 | contact_status | A: 可疑接触 | four-state | Yes / No / Unknown / Conflicting | Always | AI extracted, staff reviewed | No |
| F05 | contact_channel | 接触渠道 | enum | SMS / Call / Email / Web / Social / Other / Unknown / N/A | If A=yes | AI extracted | No |
| F06 | contact_action | 接触后行动 | enum | None / Clicked / Replied / Downloaded / Shared info / Other / Unknown / N/A | If A=yes | AI extracted | No |
| F07 | contact_time | 接触时间 | time/text | Approximate / Unknown / N/A | If A=yes | AI extracted | No |
| F08 | platform_evidence | 平台/链接类型 | text | Platform name or category / Unknown / N/A | If digital channel involved | AI extracted | No real links |
| F09 | telecom_evidence | 通信详情 | text | Channel and non-sensitive descriptor / Unknown / N/A | If SMS/call involved | AI extracted | No real numbers |
| F10 | financial_status | B: 资金事件 | four-state | Yes / No / Unknown / Conflicting | Always | AI extracted, staff reviewed | No |
| F11 | financial_event_type | 资金事件类型 | enum | Induced transfer / Unauthorised transaction / Reported loss / Unknown / N/A | If B=yes | AI extracted | No |
| F12 | amount | 报告金额 | currency/text | A$ value / Unknown / N/A | If B=yes | AI extracted | No real data |
| F13 | transaction_time | 交易时间 | time/text | Approximate / Unknown / N/A | If B=yes | AI extracted | No |
| F14 | financial_provider | 银行/支付服务商 | text | Provider category/name / Unknown / N/A | If B=yes OR bank-credential exposure | AI extracted | Synthetic only |
| F15 | transaction_authorisation | 是否授权交易 | four-state | Yes / No / Unknown / Conflicting / N/A | If B=yes | AI extracted | No |
| F16 | ongoing_financial_activity | 是否仍发生异常扣款 | four-state | Yes / No / Unknown / Conflicting / N/A | If B=yes | AI extracted | No |
| F17 | provider_contacted | 是否已联系银行/支付机构 | four-state | Yes / No / Unknown / N/A | If B=yes | AI extracted | No |
| F18 | exposure_status | C: 信息暴露 | four-state | Yes / No / Unknown / Conflicting | Always | AI extracted | No |
| F19 | exposure_type | 暴露信息类别 | multi-enum | Login credential / OTP / Identity document / BSB+account / Other / Unknown / N/A | If C=yes | AI extracted | No actual secrets |
| F20 | exposure_time | 信息披露时间 | time/text | Approximate / Unknown / N/A | If C=yes | AI extracted | No |
| F21 | suspicious_access | 异常登录/冒用迹象 | four-state | Yes / No / Unknown / Conflicting / N/A | If C=yes | AI extracted | No |
| F22 | identity_misuse | 疑似身份冒用 | four-state | Yes / No / Unknown / Conflicting / N/A | If identity info exposed | AI extracted | No |
| F23 | distress_indicator | V1: 情绪困扰 | enum | Severe reported / Some / No reported / Unknown | Always (may be unknown) | AI extracted | No real data |
| F24 | language_need | V2: 语言协助 | enum | Needed / Not needed / Unknown | Always | AI extracted | No |
| F25 | accessibility_need | V3: 数字/无障碍支持 | enum | Needed / Not needed / Unknown | Always | AI extracted | No |
| F26 | basic_needs_impact | V4: 基本生活经济影响 | enum | Immediate essentials affected / Other hardship / None reported / Unknown | Always | AI extracted | No |
| F27 | immediate_safety_threat | 明确紧迫人身安全风险 | four-state | Yes / No / Unknown / Conflicting | Always | AI extracted | No |
| F28 | reported_source_spans | 事实原文证据 | text/json | Source snippets per extracted fact | For every material finding | AI extracted | Synthetic only |
| F29 | fact_review_status | 事实复核状态 | enum | Reported / Staff-reviewed wording / Independently verified / Conflicting | For each material fact | Staff update | No |
| F30 | urgency_level | 优先级 | enum | Urgent / Priority / Routine / Undetermined | Derived | Rules | No |
| F31 | urgency_provisional | 是否暂定 | boolean | True / False | Derived | Rules | No |
| F32 | organisation_routes | 建议转介机构 | list | Primary candidate + additional candidates | Derived | Rules, staff override | No |
| F33 | missing_information | 缺失字段清单 | list | Field ID + why required + priority | Derived | Rules | No |
| F34 | verification_tasks | 待核实任务 | list | Task + reason + status | Derived | Rules + staff | No |
| F35 | handover_review_status | 交接复核状态 | enum | Draft / Needs info / Awaiting review / Staff reviewed | Derived | Staff-controlled | No |
| F36 | rules_fired | 触发规则列表 | list | Rule IDs and relevant inputs | Derived | Rules | No |
| F37 | device_security_indicator | 设备安全异常指标 | multi-enum | Suspicious pop-up/redirect; persistent unwanted page; unexpected software; device unusable; none reported; unknown; N/A | If abnormal device behaviour or suspicious link interaction is reported | AI extracted, staff reviewed | No real device identifiers or credentials |
| F38 | device_action_taken | 设备上采取的操作 | multi-enum | Clicked link; downloaded file; installed software; granted notification permission; installed extension; enabled remote access; entered information; unknown; N/A | If device anomaly or suspicious link is reported | AI extracted | Never collect actual passwords, OTPs or bank details |
| F39 | device_credential_exposure | 设备相关凭据暴露情况 | enum | Credentials entered on suspicious page; credentials stored only on device; no credentials entered/shared; unknown; N/A | If banking or identity information is said to be on the device | AI extracted, staff reviewed | Record category only; never collect actual secret values |
| F40 | authority_claim_present | 是否存在官方身份声明 | four-state | Yes / No / Unknown / Conflicting | If message/call claims to be police, court, government or another authority | AI extracted, staff reviewed | Do not collect unnecessary legal case details |
| F41 | authority_claimed_entity | 声称的机构类别 | enum | Police / Court / Government agency / Regulator / Other authority / Unknown / N/A | If F40=Yes | AI extracted | No personal case identifiers required |
| F42 | authority_verification_status | 官方身份核实状态 | enum | Unverified / Independently verified through official channel / Impersonation confirmed by authorised source / Conflicting / N/A | If F40=Yes | Authorised staff | Do not use links or phone numbers contained in the unverified message as the verification source |
| F43 | authority_contact_action | 收到官方身份声明后的行动 | multi-enum | No action; replied; called number in message; clicked message link; shared information; paid/transferred; unknown; N/A | If F40=Yes | AI extracted | Do not record actual passwords, OTPs or full identifiers |
| F44 | specialist_review_reason | 专家人工复核原因 | multi-enum | Device security; authority authenticity; no organisation mandate fit; conflicting/out-of-scope facts; other; N/A | If no suitable ORG01-ORG07 responsibility match or specialist expertise is needed | Rules + staff | Minimum necessary description |
| F45 | organisation_match_rationale | 机构匹配理由 | structured text/list | Organisation ID + matched fact + responsibility + rule ID + Primary/Additional status | For every suggested organisation route | Rules | No unnecessary personal data |

### Field reference notes

| Field ID | Used in | Notes |
| --- | --- | --- |
| F01 | Traceability | Internal prototype case identifier |
| F02 | CL / IR / UG / RT | Preserve original wording for staff review; synthetic only |
| F03 | RT / handover | Different from suggested destination |
| F04 | CL01 / IR02 | 'No' requires explicit denial, not silence |
| F05 | IR02 / RT02 / RT03 | Multiple channels supported |
| F06 | IR02 / UG07 | 'None' must be explicitly reported |
| F07 | IR02 | Approximate time acceptable |
| F08 | RT02 / IR02 | Avoid real URLs or accounts in demo |
| F09 | RT03 / IR02 | Do not use real phone numbers |
| F10 | CL02 / IR03 / UG04 | Covers scam-induced transfer, suspected unauthorised transaction, reported related loss; not automatically all lost cash |
| F11 | IR03 / RT01 | Distinguish transfer from unknown debit |
| F12 | IR03 / handover | Amount is not a direct urgency threshold |
| F13 | IR03 / handover | Time may affect ongoing risk review but does not block initial help |
| F14 | IR03 / RT01 / handover | Needed for provider-specific handover, not for initial routing class |
| F15 | IR03 | Don't decide legal authorisation from narrative alone |
| F16 | UG02 / IR03 | Reported ongoing activity can trigger provisional urgent review |
| F17 | IR03 / handover | May affect next-step guidance |
| F18 | CL03 / IR04 / UG05 | Includes reported sensitive identity, credentials, bank receiving identifiers |
| F19 | IR04 / UG03 / UG05 / RT04 | Collect type only, NEVER actual password/OTP/ID |
| F20 | IR04 / UG03 | Relevant to urgency but not alone sufficient |
| F21 | IR04 / UG03 / RT04 | 'Unknown' not treated as 'No' |
| F22 | IR04 / RT04 / UG05 | Reported sign, not independently confirmed scam |
| F23 | VU01 / UG06 | Do not diagnose mental health |
| F24 | VU02 / RT07 | Record preferred language only where volunteered |
| F25 | VU03 / RT07 | Specify functional assistance requested, not inferred disability |
| F26 | VU04 / UG06 / RT07 | Not driven by amount alone |
| F27 | SAFE01 / UG01 | Explicit threat to kill/seriously harm or immediate physical safety danger; exact timing may be unknown; avoid over-inference |
| F28 | CTL03 / VE03 | Trace each positive trigger to narrative evidence |
| F29 | VE02 / VE03 | Staff validating extraction does not independently prove underlying transaction |
| F30 | UG01–UG09 | Level separate from Provisional flag |
| F31 | UG09 | True if decisive facts lack independent verification |
| F32 | RT01–RT08 | No automatic transmission |
| F33 | IR01–IR06 / VE01 | Critical only for specific decision/task, not global completeness |
| F34 | VE02–VE05 | Pending on facts/tasks; not global freeze |
| F35 | VE04 / CTL01 | Reviewed draft does not imply referral sent |
| F36 | CTL03 | Required for explainability |
| F37 | IR08 / VE07 / SP01 | A device anomaly is not itself proof of malware or credential theft |
| F38 | IR08 / VE07 | Record action category only |
| F39 | CL03 / IR04 / IR08 / UG05 | Stored on device is not equivalent to disclosed or accessed |
| F40 | IR07 / VE06 | A claim of authority is not proof of authenticity or scam |
| F41 | IR07 / VE06 | Use broad entity type for prototype |
| F42 | VE06 | AI cannot independently certify authority identity |
| F43 | IR07 / VE06 | Clarify what the person did without blame |
| F44 | SP01 / VE06 / VE07 / CTL03 | Specialist review is not an external organisation category |
| F45 | RT01–RT10 / CTL03 / CTL04 | Every route must be explainable and traceable |

## 2. Executable business rules — 48 entries

**Important:** The following entries preserve the workbook's full trigger, outcome, uncertainty, escalation, routing, staff control and boundary descriptions. Translate them into deterministic predicates and output construction; do not substitute a single prompt asking the model to "follow the rules."

### 2.1 Classification rules

#### CL01
- **IF / trigger:** Narrative explicitly reports suspected scam contact via message, phone, site or platform
- **THEN / system behavior:** A=Yes; classify channel(s); if explicit denial A=No
- **Relevant fields:** F02,F04,F05
- **Missing or uncertain data:** Silence => Unknown, contradiction => Conflicting
- **Urgency effect:** —
- **Routing effect:** Supports telecom/platform
- **Human-review gate:** Confirm extracted claim
- **Boundary / notes:** Not a declaration that scam occurred

#### CL02
- **IF / trigger:** Narrative reports induced transfer, suspected unauthorised transaction or scam-related financial loss
- **THEN / system behavior:** B=Yes; classify financial event
- **Relevant fields:** F02,F10,F11
- **Missing or uncertain data:** Ambiguous 'lost money' without scam/transaction context => Unknown
- **Urgency effect:** —
- **Routing effect:** Supports bank/payment
- **Human-review gate:** Confirm scope and original narrative
- **Boundary / notes:** No automatic fraud diagnosis

#### CL03
- **IF / trigger:** Narrative explicitly reports information disclosed or potentially exposed
- **THEN / system behavior:** C=Yes; classify exposure type
- **Relevant fields:** F02,F18,F19
- **Missing or uncertain data:** Silence => Unknown; don't request actual secrets
- **Urgency effect:** —
- **Routing effect:** Supports bank/identity
- **Human-review gate:** Confirm category not secret value
- **Boundary / notes:** BSB/account details != login passwords/OTP

### 2.2 Information rules

#### IR01
- **IF / trigger:** Any case received
- **THEN / system behavior:** Extract basic event narrative, time, reported impact, ongoing-risk signals and supporting quotes
- **Relevant fields:** F02,F27,F28
- **Missing or uncertain data:** Flag decision-relevant unknowns; no global mandatory all-fields gate
- **Urgency effect:** —
- **Routing effect:** —
- **Human-review gate:** Ask staff for safe clarifications
- **Boundary / notes:** General intake checklist

#### IR02
- **IF / trigger:** A=Yes (CL01)
- **THEN / system behavior:** Check channel, interaction/action and approximate time; if digital/telecom route, capture non-sensitive channel descriptor
- **Relevant fields:** F05,F06,F07,F08,F09
- **Missing or uncertain data:** If action unknown, ask before qualifying for Routine; evidence detail may be optional
- **Urgency effect:** Routine eligibility
- **Routing effect:** Telecom/platform details
- **Human-review gate:** Staff validates
- **Boundary / notes:** No real links or phone numbers

#### IR03
- **IF / trigger:** B=Yes (CL02)
- **THEN / system behavior:** Check event type, reported amount, approximate time, provider, authorisation, ongoing activity, previous contact
- **Relevant fields:** F11-F17
- **Missing or uncertain data:** Critical: ongoing activity unknown if necessary for urgency; named-provider handover pending if provider missing
- **Urgency effect:** Urgency if ongoing
- **Routing effect:** Bank/payment
- **Human-review gate:** Staff verifies before handover
- **Boundary / notes:** Do not wait for amount to flag ongoing risk

#### IR04
- **IF / trigger:** C=Yes (CL03)
- **THEN / system behavior:** Check exposure category, approximate time, suspicious access / identity misuse as applicable
- **Relevant fields:** F19-F22
- **Missing or uncertain data:** Credential type unknown => clarification; never collect actual OTP/password
- **Urgency effect:** May affect urgency
- **Routing effect:** Bank / identity
- **Human-review gate:** Staff verifies category
- **Boundary / notes:** Explicitly separate account receiving identifiers

#### IR05
- **IF / trigger:** Vulnerability/support indicator V1-V4 is explicitly reported
- **THEN / system behavior:** Check the distinct support task: V1 emotional recovery; V2 language/interpretation; V3 digital literacy/accessibility; V4 basic-needs navigation
- **Relevant fields:** F23-F27
- **Missing or uncertain data:** Ask only what assistance is needed; do not diagnose or infer from demographics; separate multiple support tasks
- **Urgency effect:** Urgency only via UG01/UG06, not by number of support labels
- **Routing effect:** V1 -> ORG06; V2/V3/V4 -> ORG07
- **Human-review gate:** Staff reviews support need and whether referral is appropriate
- **Boundary / notes:** Victim Support makes its own service accessible but is not the digital-skills trainer or basic-needs provider

#### IR06
- **IF / trigger:** Preparing a named organisation handover
- **THEN / system behavior:** Check receiving destination, permitted case summary and task-specific required facts
- **Relevant fields:** F14,F28,F29,F32,F35
- **Missing or uncertain data:** Missing destination or necessary fact => handover task Needs info (not whole case blocked)
- **Urgency effect:** —
- **Routing effect:** Target organisation
- **Human-review gate:** Staff reviews before any transfer
- **Boundary / notes:** No automatic outbound communication

#### IR07
- **IF / trigger:** F40=Yes: message/call claims to be from police, court, government or regulator
- **THEN / system behavior:** Check claimed entity, requested action, any deadline/pressure, payment or credential request, contact route, actions already taken and independent verification status
- **Relevant fields:** F40-F43
- **Missing or uncertain data:** Keep authenticity Unverified if no independent check; ask targeted questions; do not treat silence as evidence of legitimacy or fraud
- **Urgency effect:** No automatic urgency effect
- **Routing effect:** No automatic organisation route; RT05 only if suspected scam/reporting need; RT03 only for actionable telecom issue
- **Human-review gate:** Staff/user verifies through independently sourced official channel; never use message-provided link/number as the verification source
- **Boundary / notes:** Do not ask for unnecessary legal case details; do not label genuine or fraudulent without evidence

#### IR08
- **IF / trigger:** Device anomaly or suspicious link interaction reported
- **THEN / system behavior:** Check pop-ups/redirects/persistent page/device unusable; clicked/downloaded/installed/granted permission/remote access; whether credentials were entered or only stored; any account anomaly
- **Relevant fields:** F37,F38,F39,F21,F16
- **Missing or uncertain data:** Device anomaly alone does not prove malware or data exposure; stored credentials alone do not mean disclosed; keep Unknown where unclear
- **Urgency effect:** No automatic Urgent; assess UG02/UG03/UG05 only on their own triggers
- **Routing effect:** Specialist Review if device security cannot be addressed by ORG01-ORG07; RT02 only for platform-controlled content/account
- **Human-review gate:** Staff arranges qualified device-security assessment; no automatic software install, remote access or device control
- **Boundary / notes:** Never request actual passwords, OTPs, full bank details or untrusted links

### 2.3 Urgency rules

#### UG01
- **IF / trigger:** Explicit reported threat to kill or cause serious physical harm, or other immediate physical safety danger
- **THEN / system behavior:** Set Urgency=Urgent with Provisional overlay if not independently verified; trigger SAFE01 immediately; exact timing/location details must not delay authorised human attention
- **Relevant fields:** F27,F28,F30,F31
- **Missing or uncertain data:** If timing or location is Unknown, keep the safety alert active and ask only essential safe questions
- **Urgency effect:** Urgent
- **Routing effect:** Internal Safety Escalation only
- **Human-review gate:** Authorised human follows internal emergency protocol; no automatic call or external contact
- **Boundary / notes:** A credible explicit death/serious-harm threat is enough for urgent human attention even if exact timing is unclear

#### UG02
- **IF / trigger:** F16=Yes: the person explicitly reports continuing or repeated unexpected/unauthorised financial activity
- **THEN / system behavior:** Set Urgency=Urgent, Provisional until independently verified; distinguish ongoing/repeated suspicious activity from a single new transaction whose authorisation is Unknown
- **Relevant fields:** F10,F11,F12,F13,F15,F16,F28
- **Missing or uncertain data:** If F16=Unknown, ask whether further unexpected transactions are occurring; do not infer ongoing activity from one unverified debit
- **Urgency effect:** Urgent only when continuing/repeated activity is reported
- **Routing effect:** Bank & Payment Providers if bank/payment issue
- **Human-review gate:** Prompt human bank/payment assessment; no automatic block or recovery promise
- **Boundary / notes:** A$ amount alone or a single transaction with unknown authorisation does not trigger UG02

#### UG03
- **IF / trigger:** C=Yes AND login credential/OTP exposure is reported AND suspicious access or active misuse is also reported (F21=Yes)
- **THEN / system behavior:** Set Urgency=Urgent, Provisional until verified; suggest immediate bank/account-security assessment
- **Relevant fields:** F18,F19,F21,F28
- **Missing or uncertain data:** If active misuse is Unknown, apply UG05 Priority floor where eligible, not UG03
- **Urgency effect:** Urgent
- **Routing effect:** ORG01 Bank & Payment Providers
- **Human-review gate:** Staff checks account-security concern; never request actual password/OTP
- **Boundary / notes:** Exposure plus reported active misuse; exposure alone is not enough for this rule

#### UG04
- **IF / trigger:** B=Yes, or conflicting financial report includes affirmative loss/transfer statement, AND no urgent trigger
- **THEN / system behavior:** At least Priority (provisional if report unverified)
- **Relevant fields:** F10,F28,F29
- **Missing or uncertain data:** Amount/time unknown does not demote to Routine
- **Urgency effect:** Priority
- **Routing effect:** Bank/payment
- **Human-review gate:** Staff verifies financial allegation
- **Boundary / notes:** If B conflict, preserve conflict and escalate to human

#### UG05
- **IF / trigger:** C=Yes with password/OTP/identity-document exposure or reported identity misuse, and no higher Urgent trigger
- **THEN / system behavior:** Set at least Priority (Provisional if not independently verified); route by exposure subtype
- **Relevant fields:** F18,F19,F21,F22,F28
- **Missing or uncertain data:** BSB+account alone or information merely stored on device does not automatically trigger this rule
- **Urgency effect:** Priority
- **Routing effect:** ORG01 for bank credentials; ORG04 for identity documents/data
- **Human-review gate:** Staff reviews exposure category; do not collect actual secrets or ID values
- **Boundary / notes:** Distinguish credentials entered/disclosed from credentials stored only

#### UG06
- **IF / trigger:** Immediate essential-needs impact OR severe reported distress materially preventing the person from proceeding, with no UG01 safety trigger
- **THEN / system behavior:** Set at least Priority for prompt human support assessment; do not automatically set Urgent
- **Relevant fields:** F23,F26,F27,F28
- **Missing or uncertain data:** If support need is Unknown, ask respectfully; do not infer from amount or demographic attributes
- **Urgency effect:** Priority
- **Routing effect:** ORG06 for emotional support; ORG07 for practical/basic-needs support
- **Human-review gate:** Staff assesses the distinct support task; safety assessment remains separate
- **Boundary / notes:** Basic-needs provision is Community Support; Victim Support is not the basic-needs provider

#### UG07
- **IF / trigger:** A=Yes; explicit no interaction, B=No, C=No, no safety/ongoing/support warning signals
- **THEN / system behavior:** Routine (if no higher-priority rule)
- **Relevant fields:** F04,F06,F10,F18,F23-F27
- **Missing or uncertain data:** If critical negatives unreported/Unknown, use UG08 not Routine
- **Urgency effect:** Routine
- **Routing effect:** Telecom/platform or reporting as appropriate
- **Human-review gate:** Staff still reviews
- **Boundary / notes:** Silence is not negative evidence

#### UG08
- **IF / trigger:** No urgent/priority trigger and criteria for Routine not established
- **THEN / system behavior:** Undetermined + targeted questions; cannot infer low risk
- **Relevant fields:** F04,F10,F18,F27
- **Missing or uncertain data:** Ask only most decision-changing questions
- **Urgency effect:** Undetermined
- **Routing effect:** Provisional candidate routes possible
- **Human-review gate:** Staff clarifies
- **Boundary / notes:** Undetermined is a level, not a fourth urgency tier

#### UG09
- **IF / trigger:** More than one urgency rule applies
- **THEN / system behavior:** Choose maximum Urgent > Priority > Routine; attach Provisional flag when triggering facts not independently verified
- **Relevant fields:** F29,F30,F31
- **Missing or uncertain data:** Urgency not averaged or scored by money
- **Urgency effect:** Maximum
- **Routing effect:** Keep affected routes
- **Human-review gate:** Staff can override with reason
- **Boundary / notes:** Explain fired rule IDs

### 2.4 Routing rules

#### RT01
- **IF / trigger:** Reported financial transaction/loss, unauthorised debit, scam-induced transfer, or bank-linked credential/account-security concern
- **THEN / system behavior:** Match ORG01 Bank & Payment Providers; Primary when financial/account action is the most immediate actionable issue
- **Relevant fields:** F10-F17,F19,F21,F45
- **Missing or uncertain data:** Provider name missing allows category-level suggestion; named-provider handover remains Needs Information
- **Urgency effect:** May inherit urgency
- **Routing effect:** ORG01 Bank & Payment Providers
- **Human-review gate:** Transaction/account-security assessment draft; no automatic blocks or fund recovery
- **Boundary / notes:** Do not trigger from bank information merely stored on a device

#### RT02
- **IF / trigger:** A platform-controlled account, listing, advertisement, message, marketplace or content is implicated
- **THEN / system behavior:** Match ORG02 Digital Platforms; Primary when the platform can act on the main content/account issue
- **Relevant fields:** F05,F08,F45
- **Missing or uncertain data:** If an independent website/operator is unknown, do not assume a platform can act; use Specialist Review if necessary
- **Urgency effect:** No independent urgency effect
- **Routing effect:** ORG02 Digital Platforms
- **Human-review gate:** Platform reporting/account-review draft for staff
- **Boundary / notes:** A website/link alone is not enough unless an identifiable platform has control or a relevant reporting function

#### RT03
- **IF / trigger:** An actionable telecommunications service issue is reported: SIM swap, number porting, telecom account takeover, number abuse or carrier-reportable SMS/call issue
- **THEN / system behavior:** Match ORG03 Telecommunications Providers
- **Relevant fields:** F05,F09,F45
- **Missing or uncertain data:** SMS/call channel alone is insufficient; if no telco action is identified, do not force ORG03
- **Urgency effect:** No independent urgency effect
- **Routing effect:** ORG03 Telecommunications Providers
- **Human-review gate:** Telecom-specific assessment/reporting draft for staff
- **Boundary / notes:** Do not use this rule to authenticate a police/government message

#### RT04
- **IF / trigger:** Identity documents or personal identity data are reported exposed, or identity misuse is reported
- **THEN / system behavior:** Match ORG04 Identity Recovery Services; Primary when identity recovery/protection is the main actionable issue
- **Relevant fields:** F19,F22,F45
- **Missing or uncertain data:** Bank credentials alone do not trigger identity recovery; never collect actual document numbers
- **Urgency effect:** May coincide with UG05
- **Routing effect:** ORG04 Identity Recovery Services
- **Human-review gate:** Identity-protection/recovery assessment draft
- **Boundary / notes:** Separate identity documents/data from bank login credentials

#### RT05
- **IF / trigger:** A suspected scam event exists and the person/staff has a reporting or public-information need
- **THEN / system behavior:** Match ORG05 Government Scam Reporting Services; Primary only when reporting is the main/only actionable need; otherwise Additional
- **Relevant fields:** F02,F04,F05,F10,F18,F45
- **Missing or uncertain data:** If authenticity/scam status is uncertain, label as suspected/unverified; do not imply a report has been filed
- **Urgency effect:** No independent urgency effect
- **Routing effect:** ORG05 Government Scam Reporting Services
- **Human-review gate:** Prepare reporting information for human review; no automatic submission
- **Boundary / notes:** This is not a police identity-verification channel or criminal investigation guarantee

#### RT06
- **IF / trigger:** V1 emotional distress, request for emotional/psychological support, or recovery/aftercare need is explicitly reported
- **THEN / system behavior:** Match ORG06 Victim Support Organisations; Primary if emotional recovery is the main/only actionable need
- **Relevant fields:** F23,F27,F45
- **Missing or uncertain data:** Do not infer distress or diagnose; do not match for digital skills/basic-needs support alone
- **Urgency effect:** UG06 only if its defined conditions are met
- **Routing effect:** ORG06 Victim Support Organisations
- **Human-review gate:** Emotional support, trauma-informed care and recovery referral suggestion
- **Boundary / notes:** Must make its own service accessible; does not provide digital-skills training or basic-needs provision

#### RT07
- **IF / trigger:** V2 language/interpretation, V3 digital literacy/accessibility, or V4 practical/basic-needs support is explicitly reported
- **THEN / system behavior:** Match ORG07 Community Support Organisations; Primary if practical access/basic-needs support is the main/only actionable need
- **Relevant fields:** F24,F25,F26,F45
- **Missing or uncertain data:** Ask the specific assistance required; do not infer language, disability or hardship from demographics
- **Urgency effect:** UG06 only where immediate essentials are affected
- **Routing effect:** ORG07 Community Support Organisations
- **Human-review gate:** Language, digital-skills, accessibility/communication and basic-needs navigation
- **Boundary / notes:** Victim Support may ensure accessible delivery of its own service but is not the primary digital-skills/accessibility trainer

#### RT08
- **IF / trigger:** Two or more ORG01-ORG07 responsibility matches are present
- **THEN / system behavior:** Select one Primary by most immediate, material and actionable issue; list other valid matches as Additional; if no clear dominant issue, Primary=Undetermined
- **Relevant fields:** F10-F27,F32,F45
- **Missing or uncertain data:** Do not use a fixed global hierarchy; use user-stated need and direct organisational mandate; unresolved tie goes to staff
- **Urgency effect:** Urgency is independent of routing
- **Routing effect:** One Primary + multiple Additional, or Primary Undetermined
- **Human-review gate:** Staff may override and record rationale; no automatic referral
- **Boundary / notes:** A high urgency level does not allow an organisation to act outside its mandate

#### RT09
- **IF / trigger:** Any organisation candidate is being considered
- **THEN / system behavior:** Require explicit fit with the organisation's mandate, in-scope responsibilities and trigger; check exclusions before matching
- **Relevant fields:** F32,F45,F10-F27
- **Missing or uncertain data:** If no responsibility match, do not force a route; use SP01 if specialist review needed
- **Urgency effect:** No independent urgency effect
- **Routing effect:** ORG01-ORG07 only where mandate fit exists
- **Human-review gate:** Display matched fact, responsibility, Rule ID and Primary/Additional reason
- **Boundary / notes:** Organisation Responsibility Framework is the canonical routing source

#### RT10
- **IF / trigger:** A contact channel (SMS, phone, website, social media) is the only routing evidence
- **THEN / system behavior:** Do not route solely by channel; require an actionable matter the organisation can handle
- **Relevant fields:** F05,F08,F09,F45
- **Missing or uncertain data:** If only channel is known, retain route as Undetermined or ask a clarifying question
- **Urgency effect:** No independent urgency effect
- **Routing effect:** No automatic ORG03 for SMS/call; no automatic ORG02 for any website
- **Human-review gate:** Human chooses a route after identifying the responsible service
- **Boundary / notes:** Channel is evidence, not a mandate match

### 2.5 Support rules

#### VU01
- **IF / trigger:** Direct statement of severe distress, panic or inability to cope
- **THEN / system behavior:** Record reported distress; flag victim-support and consider UG06; check safety separately
- **Relevant fields:** F23,F27,F28
- **Missing or uncertain data:** Unknown emotion ≠ no distress; don't diagnose
- **Urgency effect:** Could trigger Priority via UG06
- **Routing effect:** Victim Support
- **Human-review gate:** Staff follows supportive conversation
- **Boundary / notes:** Only explicit text indicators

#### VU02
- **IF / trigger:** Direct request for translation or inability to communicate adequately in present language
- **THEN / system behavior:** Record language assistance and routing to community support
- **Relevant fields:** F24
- **Missing or uncertain data:** Preferred language unknown => ask; no urgency upgrade alone
- **Urgency effect:** Normally none
- **Routing effect:** Community Support
- **Human-review gate:** Staff arranges language assistance if authorised
- **Boundary / notes:** Language need not an incapacity label

#### VU03
- **IF / trigger:** Direct report of inability to use digital services or need for accessibility accommodation
- **THEN / system behavior:** Record requested accessibility / assisted channel
- **Relevant fields:** F25
- **Missing or uncertain data:** Actual assistance type missing => ask
- **Urgency effect:** Normally none
- **Routing effect:** Community Support
- **Human-review gate:** Staff offers accessible alternative
- **Boundary / notes:** No disability inference

#### VU04
- **IF / trigger:** F26=Immediate essentials affected or other reported basic-needs hardship
- **THEN / system behavior:** Record practical/basic-needs support need and route to ORG07 Community Support; only add ORG06 if separate emotional-support need is reported
- **Relevant fields:** F26,F45
- **Missing or uncertain data:** Ask what essential need is affected and by when; do not infer hardship from amount alone
- **Urgency effect:** May trigger UG06 Priority if immediate essentials are affected
- **Routing effect:** ORG07 Community Support; ORG06 only for separate V1 need
- **Human-review gate:** Staff assesses practical support pathway
- **Boundary / notes:** Victim Support is not the primary provider of food/housing/medicine/basic-needs assistance

#### VU05
- **IF / trigger:** Victim Support and Community Support needs overlap
- **THEN / system behavior:** Match ORG06 only for emotional/psychological recovery need; match ORG07 for language, digital skills, accessibility/communication or basic-needs need
- **Relevant fields:** F23-F26,F45
- **Missing or uncertain data:** If one support domain is absent, do not duplicate-route; state separate task for each matched service
- **Urgency effect:** Urgency only through UG06/UG01, not number of support labels
- **Routing effect:** ORG06 and/or ORG07
- **Human-review gate:** Victim Support makes its own service accessible; Community Support provides practical access assistance
- **Boundary / notes:** No duplicate generic 'support' referral; each organisation gets a distinct purpose

### 2.6 Verification rules

#### VE01
- **IF / trigger:** A task-specific required applicable field is Unknown / absent
- **THEN / system behavior:** Flag Missing with reason and target task; Not Applicable excluded
- **Relevant fields:** F33
- **Missing or uncertain data:** Missing != No != Not Applicable != Unverified
- **Urgency effect:** Can affect certainty
- **Routing effect:** Can delay named handover
- **Human-review gate:** Human determines if further questions needed
- **Boundary / notes:** Field-level applicability is prerequisite

#### VE02
- **IF / trigger:** Two source statements on material fact conflict
- **THEN / system behavior:** Mark Conflicting; preserve both source quotes; request staff clarification
- **Relevant fields:** F28,F29
- **Missing or uncertain data:** Do not silently choose one value
- **Urgency effect:** Provisional if risk alleged
- **Routing effect:** Route subject to review
- **Human-review gate:** Staff resolves
- **Boundary / notes:** Potential risk still can prompt action

#### VE03
- **IF / trigger:** AI extraction recorded and staff agrees wording, but no external verification
- **THEN / system behavior:** Status = Staff-reviewed report; NOT Independently verified
- **Relevant fields:** F28,F29
- **Missing or uncertain data:** Don't treat reported as proven
- **Urgency effect:** Provisional where decisive
- **Routing effect:** —
- **Human-review gate:** External verification by authorised route only
- **Boundary / notes:** Two verification levels distinct

#### VE04
- **IF / trigger:** Handover/action depends on missing or conflicting material input OR required review is incomplete
- **THEN / system behavior:** Only THAT task = Pending Verification / Needs Info; retain urgency and preliminary advice
- **Relevant fields:** F29,F33,F34,F35
- **Missing or uncertain data:** No global freeze due to missing noncritical fields
- **Urgency effect:** Urgent alert unaffected
- **Routing effect:** Named target may remain draft
- **Human-review gate:** Staff review needed for export-ready summary
- **Boundary / notes:** Case-level attention summary optional

#### VE05
- **IF / trigger:** Staff edits a fact or clarifies missing/conflicting field
- **THEN / system behavior:** Re-run affected classification, urgency, routing, info requirements and recommendations; store change log
- **Relevant fields:** All derived F30-F36
- **Missing or uncertain data:** Avoid stale assessments
- **Urgency effect:** Recompute
- **Routing effect:** Recompute
- **Human-review gate:** Staff confirms change
- **Boundary / notes:** One source of truth

#### VE06
- **IF / trigger:** F40=Yes and authority authenticity has not been independently checked
- **THEN / system behavior:** Set authority-verification task to Pending Verification; preserve claimed entity and message content; request independent official-channel verification
- **Relevant fields:** F40-F43
- **Missing or uncertain data:** Do not mark genuine or scam from wording alone; do not use message-provided links/numbers to verify
- **Urgency effect:** No urgency effect unless separate UG/SAFE trigger exists
- **Routing effect:** No automatic routing; ORG05 only if a suspected scam reporting need is separately identified
- **Human-review gate:** Authorised staff/user uses contact details obtained independently from official source
- **Boundary / notes:** AI can prepare a verification checklist but cannot certify official identity

#### VE07
- **IF / trigger:** Device security condition or possible credential exposure is reported
- **THEN / system behavior:** Set device assessment task to Pending Specialist Review where malware/device control cannot be established from narrative
- **Relevant fields:** F37-F39,F44
- **Missing or uncertain data:** Do not mark malware confirmed; do not mark C=Yes unless information was actually entered/disclosed or exposure is otherwise reported
- **Urgency effect:** Urgency determined separately by UG rules
- **Routing effect:** No forced organisation route; ORG01 only if bank/account risk; ORG02 only if platform mandate fits
- **Human-review gate:** Qualified human specialist assesses device; staff verifies any account-risk reports
- **Boundary / notes:** No remote access or software installation initiated by prototype

### 2.7 Safety rules

#### SAFE01
- **IF / trigger:** UG01 triggered by explicit reported threat to kill or cause serious physical harm, or other immediate physical safety danger
- **THEN / system behavior:** Display Internal Safety Escalation immediately and alert authorised staff to follow the internal emergency protocol; do not wait for ABC classification or missing details
- **Relevant fields:** F27,F28
- **Missing or uncertain data:** If exact timing/location is Unknown, keep the alert active and ask only essential safe clarification
- **Urgency effect:** Urgent
- **Routing effect:** Internal Safety Escalation Rule only
- **Human-review gate:** Authorised human handles emergency response; no automatic call/contact
- **Boundary / notes:** An explicit death/serious-harm threat is sufficient for urgent human attention even when exact timing is unclear

### 2.8 Control rules

#### CTL01
- **IF / trigger:** Every generated recommendation or handover
- **THEN / system behavior:** No scam confirmation, bank blocks, account edits, cross-org contact, or consequential autonomous decisions
- **Relevant fields:** F35,F36
- **Missing or uncertain data:** Hold external action for authorised human
- **Urgency effect:** —
- **Routing effect:** —
- **Human-review gate:** Mandatory human review
- **Boundary / notes:** Follows case boundary

#### CTL02
- **IF / trigger:** All prototype interactions
- **THEN / system behavior:** Synthetic cases/guidance only; mask real PII and never request credentials, OTP or account identifiers as actual values
- **Relevant fields:** F02,F19
- **Missing or uncertain data:** Do not collect secrets; types only
- **Urgency effect:** —
- **Routing effect:** —
- **Human-review gate:** Staff responsible for safe use
- **Boundary / notes:** Clearly mark synthetic assumption

#### CTL03
- **IF / trigger:** Each matched recommendation
- **THEN / system behavior:** Display rule ID, supporting reported facts, assumptions, unknowns, and review status; no guidance match => human specialist review
- **Relevant fields:** F28,F29,F33,F36
- **Missing or uncertain data:** No unsupported invented guidance
- **Urgency effect:** Provisional if uncertain
- **Routing effect:** —
- **Human-review gate:** Staff can reject/edit
- **Boundary / notes:** Auditability and fallback

#### CTL04
- **IF / trigger:** Every organisation recommendation is generated
- **THEN / system behavior:** Check ORF mandate, exclusions, route trigger, minimum information and Primary/Additional rationale
- **Relevant fields:** F32,F45,F36
- **Missing or uncertain data:** If any of these cannot be explained, suppress the route and request human review
- **Urgency effect:** None
- **Routing effect:** No unsupported organisation recommendation
- **Human-review gate:** No external referral or communication; staff approves any handover
- **Boundary / notes:** Organisation responsibilities are synthetic assumptions and must be labelled as such

### 2.9 Specialist Review rules

#### SP01
- **IF / trigger:** Device security, authority authenticity or another material issue is outside ORG01-ORG07 mandate or synthetic guidance
- **THEN / system behavior:** Create Specialist Review Required task; state why no organisation mandate matches; retain candidate routes only where independently justified
- **Relevant fields:** F37,F40,F44,F45
- **Missing or uncertain data:** If reason unclear, ask a targeted question; do not invent an eighth external organisation
- **Urgency effect:** Does not set urgency by itself; SAFE01/UG rules still apply
- **Routing effect:** No external organisation automatically assigned
- **Human-review gate:** Authorised staff identifies suitable qualified support or official verification path
- **Boundary / notes:** Specialist Review is a workflow fallback, not an organisation category

## 3. Organisation Responsibility Framework (ORG01–ORG07)

**Authority:** This framework controls whether a proposed destination has an actionable task. Do not route only because the report mentions a SMS, phone, website or organisation name. Each proposed route needs a task-specific reason and may require additional handover information.

### ORG01 — Bank & Payment Providers
- **Purpose / mandate:** Assess and respond to bank/payment transaction, account and payment-security issues.
- **In scope:** Scam-induced transfers; reported unauthorised card/account transactions; unexplained debits; payment account security; bank login/OTP/card credential compromise assessment; transaction dispute or recall requests under provider processes.
- **Trigger:** B=Yes; OR a bank-linked login/OTP/card credential exposure is reported; OR suspicious bank-account activity is reported.
- **Exclusions / boundaries:** Does not investigate or remove scam websites; does not repair malware; does not provide counselling, language training or digital-skills instruction.
- **Information for a draft handover:** Provider name/category; financial event type; amount and time if known; transaction authorisation status; whether activity continues; whether provider has been contacted. Never collect actual passwords, OTPs or full account/card numbers.
- **Primary when:** The most immediate actionable issue is a bank/payment transaction, account or credential-security matter.
- **Additional when:** A separate platform, identity, telecom or support need also exists.
- **Relevant rules and fields:** F10-F17,F19,F21; RT01; IR03; UG02-UG05
- **Synthetic assumptions:** Do not promise funds recovery, transaction blocking or a particular bank outcome.

### ORG02 — Digital Platforms
- **Purpose / mandate:** Address content, accounts, listings and interactions controlled by a digital platform.
- **In scope:** Platform-controlled social accounts; marketplace listings; ads; messages; fake seller/buyer profiles; platform account compromise; reporting or review of platform-hosted content.
- **Trigger:** A named or identifiable platform has control over the relevant account, content, listing, ad or message and can potentially act on it.
- **Exclusions / boundaries:** Does not recover bank funds; does not repair a user's computer; does not verify police/government identity; does not provide counselling.
- **Information for a draft handover:** Platform/service category; type of account/content/listing; approximate time; what the user did; safe non-sensitive content description. No real credentials or unnecessary live URLs in the prototype.
- **Primary when:** The platform-controlled account/content is the main actionable issue and no more immediate bank/identity issue dominates.
- **Additional when:** The platform issue is one part of a wider financial, identity or support case.
- **Relevant rules and fields:** F05,F08; RT02,RT09,RT10; IR02
- **Synthetic assumptions:** An independent website or pop-up is not automatically within a platform's remit. If no operator/platform responsibility is clear, use Specialist Review.

### ORG03 — Telecommunications Providers
- **Purpose / mandate:** Address telecom network, phone-number, SIM and carrier-service security or abuse.
- **In scope:** SIM swap; number porting without authorisation; telecom account takeover; phone-number abuse/spoofing; carrier-reportable SMS/call abuse; relevant service-level blocking or investigation.
- **Trigger:** A telecom provider has an actionable service/number issue to address, not merely because the contact happened through SMS or phone.
- **Exclusions / boundaries:** Does not authenticate a police message; does not handle bank transactions; does not investigate all online content; does not provide psychological support.
- **Information for a draft handover:** Carrier if known; channel; approximate time; type of telecom service/number issue; masked/non-sensitive descriptor; whether service was lost or transferred.
- **Primary when:** The phone number, SIM or telecom account is the principal compromised service or ongoing carrier issue.
- **Additional when:** Telecom abuse is relevant to a broader case and carrier reporting is a distinct useful task.
- **Relevant rules and fields:** F05,F09; RT03,RT09,RT10; IR02
- **Synthetic assumptions:** SMS/phone is a channel, not by itself a routing decision. Police identity verification is a separate task.

### ORG04 — Identity Recovery Services
- **Purpose / mandate:** Support protection and recovery when personal identity information or identity documents may be misused.
- **In scope:** Exposure of identity documents or personal identity data; suspected identity theft; identity misuse; recovery/protection guidance following identity compromise.
- **Trigger:** Identity document/personal identity data exposure is reported, or identity misuse is reported.
- **Exclusions / boundaries:** Does not handle bank login credentials alone; does not handle ordinary password resets; does not provide psychological treatment or malware repair.
- **Information for a draft handover:** Category of identity information/document; approximate exposure time; misuse indicators; protective actions already taken. Never collect actual document numbers or document images in the prototype.
- **Primary when:** Identity misuse or identity recovery is the main actionable issue.
- **Additional when:** Identity misuse also creates bank, platform or practical support needs.
- **Relevant rules and fields:** F19,F22; RT04; IR04; UG05
- **Synthetic assumptions:** Bank credentials and identity documents are separate exposure subtypes; do not route all C=Yes cases here.

### ORG05 — Government Scam Reporting Services
- **Purpose / mandate:** Provide official scam-reporting, incident-recording and public reporting guidance within the synthetic model.
- **In scope:** Receiving reports of suspected scams; recording scam patterns; public reporting guidance; information about appropriate reporting channels.
- **Trigger:** A suspected scam context exists and the person/staff has a reporting or public-information need.
- **Exclusions / boundaries:** Does not recover funds; does not guarantee investigation or prosecution; does not authenticate a police SMS; does not provide counselling or technical repair.
- **Information for a draft handover:** Incident summary; channel; approximate timeframe; reported loss/exposure categories; evidence categories; whether the report is only a draft or has actually been submitted.
- **Primary when:** Reporting/recording is the main or only actionable task and no operational service needs to act first.
- **Additional when:** A bank/platform/telecom/identity route is primary and reporting is a useful additional option.
- **Relevant rules and fields:** F02,F04,F05,F10,F18; RT05; IR06
- **Synthetic assumptions:** The prototype only prepares reporting information; it never submits a report.

### ORG06 — Victim Support Organisations
- **Purpose / mandate:** Provide emotional wellbeing, trauma-informed support, recovery and aftercare to people affected by scams.
- **In scope:** Emotional distress; fear, shame, anxiety or trauma-related support; supportive listening; victim recovery; follow-up and referral to appropriate counselling/psychological services.
- **Trigger:** V1 is explicitly reported or the person requests emotional/psychological support.
- **Exclusions / boundaries:** Does not provide digital-skills training; does not provide technical accessibility training; does not act as the primary basic-needs provider; does not handle bank/account/device security.
- **Information for a draft handover:** Reported emotional/support need; requested type of support; safe/preferred contact method; consent or other appropriate referral details as assumed by the prototype.
- **Primary when:** Emotional recovery is the main or only actionable need.
- **Additional when:** A separate financial, identity, platform or practical support issue remains primary.
- **Relevant rules and fields:** F23,F27; RT06; VU01,VU05; UG06
- **Synthetic assumptions:** Victim Support must deliver its own service accessibly and may arrange interpretation for its own sessions. This does not make it the primary digital-literacy/accessibility provider.

### ORG07 — Community Support Organisations
- **Purpose / mandate:** Provide practical access, communication and basic-needs support so people can access services and manage immediate daily-life barriers.
- **In scope:** Language assistance and interpretation; digital literacy and assisted use of devices/services; accessibility and accessible communication support; disability-related service access; food/housing/medicine/basic-needs navigation; financial-hardship support navigation.
- **Trigger:** V2 language need, V3 digital/accessibility need or V4 essential-needs hardship is explicitly reported.
- **Exclusions / boundaries:** Does not provide clinical/psychological treatment; does not resolve bank disputes or secure accounts; does not perform malware forensics or technical device remediation.
- **Information for a draft handover:** Specific support task; preferred language/communication mode; functional barrier; accessibility accommodation requested; essential need and timeframe. Collect minimum necessary detail.
- **Primary when:** Practical access, language or basic-needs support is the main/only actionable need.
- **Additional when:** A financial/identity/platform issue is primary and a distinct practical support need also exists.
- **Relevant rules and fields:** F24-F26; RT07; VU02-VU05; UG06
- **Synthetic assumptions:** Community Support is the primary pathway for digital skills and accessibility assistance. Victim Support may make its own service accessible but should not be duplicated as a digital-training provider.

### 3.8 V1–V4 support-responsibility boundary

| Support need | Primary organisation | Additional organisation (only if separate need exists) | What the primary organisation does | Boundary / do not duplicate | Rule references |
| --- | --- | --- | --- | --- | --- |
| V1 Emotional distress / recovery | ORG06 Victim Support | ORG07 only if practical access/basic-needs need also exists | Emotional support, trauma-informed care, recovery and aftercare | Do not route to Community Support for psychological treatment alone | VU01,RT06 |
| V2 Language / interpretation | ORG07 Community Support | ORG06 may arrange accessible communication within its own service | Interpretation and language-access assistance | Victim Support must make its own service accessible but is not the primary interpretation provider | VU02,RT07 |
| V3 Digital literacy / accessibility | ORG07 Community Support | ORG06 only if a separate emotional-support need exists | Digital skills, assisted service use, accessible communication and practical accommodation | A device malfunction alone is a technical issue, not automatically a V3 vulnerability; malware repair is Specialist Review | VU03,RT07,SP01 |
| V4 Basic-needs hardship | ORG07 Community Support | ORG06 only if a separate emotional-support need exists | Food, housing, medicine and basic-needs navigation/referral | Victim Support is not the primary basic-needs provider; amount alone does not prove hardship | VU04,RT07,UG06 |
| V1 + V2/V3/V4 together | ORG06 and ORG07 each own a separate task; Primary selected by dominant actionable need | The other service is Additional | One provides emotional recovery; the other practical access/basic-needs support | Do not send duplicate generic referrals; explain each organisation's distinct task | VU05,RT06,RT07,RT08 |

### 3.9 Primary/Additional route-selection algorithm

| Step | Rule | Implementation | If unresolved | Why |
| --- | --- | --- | --- | --- |
| 1 | Safety check | Run SAFE01 independently before ordinary routing. | Safety escalation does not replace or select an external organisation. | Human safety attention cannot wait for routing completeness. |
| 2 | Mandate fit | Compare each issue/task with ORG01-ORG07 mandate, trigger and exclusions. | Suppress any organisation without a mandate match. | ABC labels and channels alone do not determine destination. |
| 3 | Identify actionable issue | List distinct tasks: financial/account, platform content/account, telecom service, identity recovery, scam reporting, emotional support, practical access/basic needs. | Keep multiple candidates only when they have distinct tasks. | Prevents duplicate or vague referrals. |
| 4 | Select Primary | Choose the organisation able to act on the most immediate, material and actionable issue, considering user-stated need and urgency. | If no dominant route or unresolved tie, Primary=Undetermined; show candidates for staff selection. | No fixed global ranking; an organisation cannot act outside its mandate. |
| 5 | Add Additional routes | Add other organisations only for separate, evidenced tasks. | Do not add support organisations without reported support needs. | Multiple routes are allowed, but each must have a reason. |
| 6 | Check handover information | Apply destination-specific required fields and privacy limits. | Only that handover task becomes Needs Information/Pending; other analysis continues. | Missing data does not globally freeze the case. |
| 7 | Human approval | Show matched facts, ORG ID, rule IDs, primary rationale and gaps. | No automatic referral, message, report or data transfer. | Human remains responsible for action. |

### 3.10 Non-organisational workflow paths

- `SAFE01` is independent **Internal Safety Escalation**. It neither replaces a needed external route nor becomes ORG08.
- `SP01` is **Specialist Review Required** for material problems outside ORG01–ORG07 mandates, such as suspected device compromise or claimed-authority verification. It is not ORG08.

## 4. Verification and status semantics

| Category | State / predicate | Meaning | System consequence | Example |
| --- | --- | --- | --- | --- |
| Field value | YES | Explicitly reported affirmative | May trigger rules, provisional when unverified | A=Yes when reported SMS was received |
| Field value | NO | Explicitly reported negative | Can satisfy Rule UG07 when relevant and staff reviewed | Person clearly states no payment or information sharing |
| Field value | UNKNOWN | Absent, ambiguous, or not determined | If applicable to a decision/task => Missing Information | Person did not mention whether money was sent |
| Field value | CONFLICTING | Material statements disagree | Flag conflict and verify; do not collapse into Unknown | 'I sent $500' and later 'I never sent money' |
| Field value | NOT APPLICABLE | Condition was explicitly ruled out or field not relevant | Exclude from Missing list | Amount is N/A when no financial event is explicitly reported |
| Evidence status | REPORTED | Claim appears in complainant narrative | Not independently established | Customer states funds were taken |
| Evidence status | STAFF-REVIEWED REPORT | Staff verifies AI faithfully captured the person's statement | Still not external fact verification | Staff checks summary matches complainant's words |
| Evidence status | INDEPENDENTLY VERIFIED | Authorised staff has valid external verification evidence | May clear certain verification tasks | Payment provider record checked by authorised staff; prototype does not perform lookup |
| Evidence status | CONFLICTING | Competing material claims remain unresolved | Relevant task pending; urgent human signal may still apply | Two reported amounts differ |
| Decision label | URGENT | Explicit immediate safety or ongoing threat trigger | Act on provisional alert despite absent details | Reported ongoing deductions; UG02 |
| Decision label | PRIORITY | Reported financial event or significant exposure or urgent support need | Staff review with higher priority | Reported induced payment without ongoing risk |
| Decision label | ROUTINE | Affirmatively contact-only, no further action or red flags | Appropriate only with explicit negative evidence | SMS received; no click, no transfer, no exposure |
| Decision label | UNDETERMINED | Insufficient evidence to classify priority | Ask few high-value clarification questions | 'I think something happened' |
| Decision overlay | PROVISIONAL = TRUE | Urgency supported by reported/unverified claim | Does not delay urgent human attention | Provisional Urgent |
| Task status | DRAFTABLE | Can produce clearly qualified preliminary output | No actual external action | Internal draft even if provider unknown |
| Task status | NEEDS INFORMATION | A prerequisite field for THIS task is unknown | Ask targeted question; keep unrelated functions running | Cannot address named-provider handover without provider |
| Task status | PENDING VERIFICATION | Material fact conflicted, not verified to required level, or mandatory human check incomplete | Flag that specific task, not whole case | Exact transfer verification or handover review |
| Task status | STAFF REVIEWED | Authorised human reviewed corresponding recommendation/draft | Still does not mean it was transmitted or allegation proven | Reviewed handover summary |
| Missing test | APPLICABLE + NEEDED + UNKNOWN | All three must be true to call information missing for a task | No global percentage threshold | B=yes, transaction_time unknown, matters to transaction assessment |
| Missing test | SUPPORTING ONLY | Optional useful information not essential for current step | Mark Additional, not blocking | Exact SMS number for early telecom category suggestion |
| Safety override | UG01 before completeness | Immediate safety flag supersedes info collection ordering | Alert authorised human even if everything else unknown | Immediate danger claim |
| Routing rule | SINGLE PRIMARY + ADDITIONAL | One primary operational suggestion, several additional; staff override | Safety rule independent | Bank primary, Telecom + Support additional |
| Routing evidence | MANDATE MATCH REQUIRED | An organisation is suggested only if a specific task fits its responsibility, trigger and exclusions. | No match => do not force route; use Specialist Review if material. | SMS alone does not require Telecom; website alone does not require Digital Platform. |
| Support boundary | V1 vs V2/V3/V4 | V1 emotional recovery -> Victim Support; V2 language, V3 digital/accessibility, V4 basic-needs -> Community Support. | Both only when distinct needs exist; each gets a separate task. | Victim Support must make its own service accessible but is not a digital-skills trainer. |
| Authority verification | UNVERIFIED CLAIM | A message claiming to be police/government/court remains unverified until checked through independently sourced official contact. | Do not use message-provided link/number; do not label scam or genuine from wording alone. | Authority verification is a task, not a new ABC event or organisation. |
| Device security | DEVICE ANOMALY | Persistent pop-ups/redirects or device unusability may require specialist review; they do not prove malware or data exposure. | Check action taken and whether credentials were entered vs merely stored; C remains Unknown unless disclosure/exposure reported. | Device specialist review is a workflow fallback, not an eighth organisation. |
| Specialist fallback | NO MANDATE FIT | If none of ORG01-ORG07 can act on the issue, set route Undetermined and create Specialist Review task. | Do not invent an external provider or force the nearest-sounding organisation. | Safety escalation remains independent. |

## 5. Implementation contract and output expectations

1. Preserve original synthetic narrative; keep employee clarifications/corrections as separate provenance.
2. Extract supported reported facts with evidence quotes; distinguish Yes/No/Unknown/Conflicting/N/A and avoid false factual conclusions.
3. Run immediate safety override before normal triage.
4. Match `CL`, `IR`, `UG`, `VU`, `RT`, `VE`, `SAFE`, `CTL` and `SP` rules. Apply ORG01–ORG07 mandates and exclusions.
5. Produce task-scoped missing-information and verification lists; choose 1–3 decision-changing clarification questions when needed.
6. Generate concise case summary and useful staff recommendations. Do not show redundant or inapplicable fields.
7. No automatic external action. Retain staff Accept/Modify/Reject, history and NOT SENT / NOT EXECUTED labels.
8. Ensure machine-verifiable Rule ID coverage and deterministic tests. Use the **new** T01–T22 cases only.

## 6. Known boundaries that must not be silently rewritten

- `UG02` requires a **reported continuing/repeated unexpected/unauthorised** activity. One additional debit of unknown authorisation is not proof of ongoing activity.
- `CL03`/`UG05` must not interpret banking information **merely stored** on a computer as proven disclosed/stolen.
- `RT03` requires an actionable telecom-service issue, not merely an SMS. `RT02` requires a platform-controlled account/content/listing, not merely a website.
- Claimed police/government identity is **unverified** until checked through independently sourced official contact details; neither authenticity nor fraud is assumed.
- Only a report of a support need triggers ORG06/ORG07; generic requests for help do not themselves establish a vulnerability.
- If a test expectation and rule predicate appear inconsistent, **record and report the conflict before changing behavior**. Do not secretly alter the workbook-derived policy.
