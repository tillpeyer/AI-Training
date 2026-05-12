---
stepsCompleted: [1, 2, 3, 4, 5]
inputDocuments:
  - docs/prd.md
  - docs/tech-spec.md
  - docs/stories/STORY-1-list-menu.md
  - docs/stories/STORY-2-create-order.md
  - docs/stories/STORY-3-list-my-orders.md
  - docs/stories/STORY-4-cancel-order.md
  - docs/stories/STORY-5-admin-add-menu-item.md
confluenceSpaceKey: "LOCAL-ONLY"
confluenceParentPageId: "LOCAL-ONLY"
date: 2026-05-11
author: Till
---

# Solution Requirements Document: AI-Training (Lunch Order API)

<!-- Content will be appended sequentially through collaborative workflow steps -->
<!-- Each section corresponds to a Confluence sub-page -->

## PHASE 1: CLEAN START

### 1.1 Assets Check

#### Document Inventory

| # | Document | Type | Key Topics | Relevance (SRD sections) | Status |
|---|----------|------|------------|--------------------------|--------|
| 1 | `docs/prd.md` | Synthetic PRD (Phase-2 artefact) | Problem statement (paper sheet), goal, personas, scope (5 items), out-of-scope, success criteria, constraints | 1.2 Goals, 1.3 Stakeholders, 1.4 Scope, 1.5 Constraints, 2.5 Epics, 2.6 Features | available |
| 2 | `docs/tech-spec.md` | Architecture / tech spec (Phase-3 artefact) | 3-layer architecture, package layout, data model (`MenuItem`, `Order`), API conventions, mock auth, validation, testing approach | 1.5 Constraints (technical), 2.4 Event Model (light), 2.9 Data Model | available |
| 3 | `docs/stories/STORY-1-list-menu.md` | Story draft | Public read of today's menu with `available=true` filter | 2.6 Features, 2.7 Specifications, 2.8 User Stories | available |
| 4 | `docs/stories/STORY-2-create-order.md` | Story draft | Submit order with validation and cross-entity lookup | 2.6 Features, 2.7 Specifications, 2.8 User Stories | available |
| 5 | `docs/stories/STORY-3-list-my-orders.md` | Story draft | List caller's own orders sorted desc | 2.6 Features, 2.7 Specifications, 2.8 User Stories | available |
| 6 | `docs/stories/STORY-4-cancel-order.md` | Story draft | State transition `SUBMITTED → CANCELLED` with ownership check | 2.6 Features, 2.7 Specifications, 2.8 User Stories | available |
| 7 | `docs/stories/STORY-5-admin-add-menu-item.md` | Story draft | Admin-gated POST with role check via `X-Admin` header | 2.6 Features, 2.7 Specifications, 2.8 User Stories | available |

#### Existing System

A **paper sheet at reception** is the current system: employees write down their lunch order, the canteen reads it. Failure modes: lost ~twice per month, duplicate entries, no electronic visibility for kitchen portion planning. **Greenfield** from a software standpoint — no legacy code or data to migrate.

#### Pre-existing Decisions

**Technology stack** (locked by tech spec):
- Java 21 (LTS), Spring Boot 3.5.0, Maven 3.9+
- H2 in-memory database; `ddl-auto: update`, no Flyway/Liquibase
- Spring Data JPA, Spring Web, Spring Validation, Spring Actuator

**Architecture** (locked by tech spec):
- 3-layer split: Controller → Service → Repository → H2
- Feature-based packaging: `menu/`, `order/`, `common/` (no `dto/entity` split)
- UUID primary keys throughout
- No DTOs in v1 — entity is the API (workshop simplification)
- No async, no caching, no rate limiting

**Auth model** (mock):
- `/orders/**` requires `X-User-Id: <employee-id>` header
- Admin endpoints require `X-Admin: true` (else 403)
- No real authentication / authorisation

**Scope exclusions** (locked by PRD):
- No payment, no notifications, no multi-day menus, no frontend
- No real auth beyond the mock headers

**Workshop conventions** (locked by `CLAUDE.md`):
- Branch: `feature/STORY-<n>-<slug>`
- Commit: `STORY-<n>: <description>`
- PR target: `main`
- Package root: `ch.elca.training.lunch`

#### Standards and Guidelines

- **ELCA SRD methodology** (this workflow) — Phase 1 Clean Start → Phase 2 Functional Requirements
- **ELCA Agentic-Engineering workshop conventions** — codified in `CLAUDE.md`
- **Spring Boot 3.5 / Jakarta EE idioms** — `jakarta.validation`, `@WebMvcTest`, `@DataJpaTest`, `@SpringBootTest` only for context-load smoke tests
- **HTTP status conventions**: 200/201/204/400/403/404/409 (locked by tech spec)
- **Error response shape**: `{ "code": "STRING_CODE", "message": "human readable" }` (locked by tech spec)

#### Open Questions from Asset Review

These cannot be answered from the loaded documents and must be elicited in later steps (or flagged as workshop assumptions):

1. **Stakeholders beyond the two personas** — who owns the budget? Who signs off on canteen menu changes? Is there a HR/facilities stakeholder?
2. **Volume / scale targets** — concurrent users, orders per day, peak hour (e.g. 11:30–12:30 spike)?
3. **SLAs** — response-time target, uptime expectation, supported business hours?
4. **Data retention & GDPR** — how long are orders kept? Is `userId` PII for GDPR purposes?
5. **Definition of "today"** — calendar day in CH timezone (CET/CEST)? Cut-off time after which the menu / ordering window closes?
6. **Race conditions** — what happens if a menu item becomes `available = false` *after* an order is placed but *before* the kitchen prepares it? (Out of scope per PRD but worth flagging.)
7. **Multi-kitchen / multi-shift** — is the canteen single-site, single-shift? PRD implies yes but doesn't say.
8. **Audit / observability requirements** — only `/actuator/health` is mentioned; what else does ops need?

> ⚠️ **Workshop-rehearsal flag:** items 2, 3, 4, 5 are the kind of NFRs a real ELCA engagement would have answers to from the tender. Their absence here is the strongest signal that this is a *teaching artefact*, not a real customer brief.

### 1.2 Business Goals

#### Product Vision

> Within three months of launch, every on-site ELCA employee orders lunch through the Lunch Order API instead of the paper sheet — eliminating lost orders and removing lunch coordination from reception's plate.

#### Problem Statement / Pain Point

The paper sheet at reception is lost ~twice per month, produces duplicate orders, and offers zero electronic visibility for kitchen portion planning. Source: `docs/prd.md` §Problem.

#### Strategic Goals and Weightings

| # | Strategic Goal | Weighting | How the application supports it |
|---|---|---|---|
| 1 | **Eliminate paper-based order loss** | **High** | Digital orders persist in DB with unique IDs — physically cannot be "lost" the way the sheet was |
| 2 | **Improve employee on-site experience** | **High** | Fast self-service ordering, history of own orders, ability to cancel without involving reception |
| 3 | **Advance facilities digitalisation roadmap** | Medium | Lighthouse for retiring paper-based internal processes — sets a pattern for future facilities-ops apps |
| 4 | **Free reception staff from lunch coordination** | Medium | Removes a non-core duty from the front desk; reception no longer mediates between employees and the canteen |

> *Goal "Reduce canteen food waste" was considered but **deferred to v2**: it requires a kitchen-facing aggregated view (a STORY-6-style feature) that is not in the current scope. Promising it here without the supporting story would be dishonest.*

#### Success Criteria (SMART)

| # | Criterion | Specific | Measurable | Achievable | Relevant | Time-bound |
|---|---|---|---|---|---|---|
| 1 | **Lost orders = 0 / month** | ✅ Lost-order count | DB order records vs. kitchen fulfilment reconciliation | ✅ Digital orders cannot be physically lost | Directly addresses primary pain point | T+1 month from launch |
| 2 | **≥ 75% of on-site employees order via API** | ✅ Active-user ratio | Distinct `X-User-Id` values in server access logs ÷ on-site headcount, monthly | ✅ Habit-forming with sub-10s flow | Without adoption, the paper sheet returns | T+3 months from launch |

> *Criteria for performance (p95 latency), availability (uptime SLA), and waste reduction were **deferred to v2** — they require functionality (perf instrumentation, uptime monitoring, kitchen view) that is not in the current 5-story scope.*

#### Time Horizon

| Milestone | Target (relative to kickoff) |
|---|---|
| **MVP** — Stories 1–3 shipped to staging | T+4 weeks |
| **Public launch** — Stories 1–5 in production | T+8 weeks |
| **Adoption checkpoint** — Success Criterion 2 reviewed | T+3 months from launch |

#### Open Questions

None for §1.2 after scope-tightening. The deferred items (waste reduction, NFRs, kitchen view) become inputs to a v2 SRD cycle once stories 1–5 are live.

#### Completeness & Contradiction Check (Task B5)

- ✅ All 5 elicitation questions addressed
- ✅ SMART compliance: both criteria are specific, measurable from data the system already produces, achievable inside the 5-story scope, relevant to the pain point, and time-bound
- ✅ Internal consistency: every business goal here can be delivered by the existing 5 stories — no promises the scope can't keep
- ⚠️ **Workshop-rehearsal flag**: this section is **deliberately leaner** than my first draft. The ambitious goals (waste -30%, < 10s p95, 99.5% uptime) were dropped because they require functionality that doesn't exist in stories 1–5. Good teaching moment for participants: *if §1.2 goals don't survive a reality check against the existing story list, either the goals shrink or the story list grows.*

### 1.3 Stakeholders

#### Stakeholder Register

| # | Stakeholder | Role / Group | Int./Ext. | Interest (1-5) | Influence (1-5) | Span of Control | Significance |
|---|---|---|---|---|---|---|---|
| 1 | **Facilities Manager** | Project sponsor; owns canteen contract & budget | Internal | 4 | 5 | ~5 (facilities team) | **High** |
| 2 | **Canteen Admin / Kitchen Lead** | Primary admin user; maintains daily menu | Internal | 5 | 4 | 1 (with kitchen team ~6) | **High** |
| 3 | **On-site Employees** | Primary users; place / view / cancel orders | Internal | 5 | 3 (collective) | ~300 | **High** |
| 4 | **IT Operations** | Runs the Spring Boot service; on-call for incidents | Internal | 3 | 4 | ~3 | **High** |
| 5 | **Canteen Service Provider** | Cooks; receive aggregated orders from kitchen admin | External | 4 | 3 | ~8 | Medium-High |
| 6 | **Reception Staff** | Currently mediates the paper sheet; workload changes | Internal | 4 | 2 | ~3 | Medium |
| 7 | **IT Security / Compliance** | Approves mock-auth model for internal use; reviews data handling | Internal | 2 | 4 | ~2 | Medium-High |
| 8 | **Works Council (Personalkommission)** | Reviews changes to employee-facing systems & data | Internal | 2 | 3 | ~5 (council reps) | Medium |
| 9 | **HR / Internal Comms** | Owns rollout messaging to employees | Internal | 2 | 2 | ~2 | Low |

#### Stakeholder Matrix (Interest × Influence)

|                     | Low Influence (1-2) | Medium Influence (3)              | High Influence (4-5)               |
|---------------------|---------------------|-----------------------------------|------------------------------------|
| **High Interest (4-5)** | Reception (#6)       | Employees (#3), Canteen Provider (#5) | Canteen Admin (#2), Sponsor (#1)   |
| **Medium Interest (3)** | —                  | —                                 | IT Operations (#4)                 |
| **Low Interest (1-2)**  | HR / Comms (#9)     | Works Council (#8)                | IT Security (#7)                   |

> **Reading the matrix:** the **top-right cell** (high interest × high influence) holds the **key players** to engage closely. **High influence / low interest** (IT Security) needs to be kept satisfied so they don't surprise-block delivery. **High interest / low influence** (Reception) needs to be kept informed so they don't feel run over by the change.

#### Provisional Communication Plan

| Stakeholder | Significance | Frequency | Medium | Content Focus |
|---|---|---|---|---|
| **Facilities Manager (#1)** | High | Weekly (during build); monthly (post-launch) | 1:1 + steering committee | Budget, milestones, scope decisions, adoption KPIs |
| **Canteen Admin (#2)** | High | Weekly | 1:1 walkthrough + demo session | Workflow changes, menu-editing UX, training |
| **Employees (#3)** | High | Monthly (pre-launch); on launch | Intranet post + canteen poster | Why it's changing, how to use it, where to give feedback |
| **IT Operations (#4)** | High | At each release + on-call handover | Runbook + Slack channel | Deployment, monitoring, incident response |
| **Canteen Provider (#5)** | Medium-High | Biweekly during build; on launch | Email + sponsor-led meeting | Operational changes, fallback procedures |
| **Reception Staff (#6)** | Medium | Monthly | Email + brief in-person | Reassurance, workload change, fallback if app down |
| **IT Security (#7)** | Medium-High | At each scope/architecture change | Email + review meeting on request | Auth model decisions, data flow, GDPR posture |
| **Works Council (#8)** | Medium | At kick-off + before launch | Formal written notification | Employee data handling, consent, opt-out path |
| **HR / Comms (#9)** | Low | At launch + adoption checkpoint | Email | Rollout messaging, FAQ |

#### Open Questions

- **Sponsor confirmation**: assumed to be Facilities Manager — needs validation with management
- **On-site headcount**: assumed ~300 for adoption-rate calculation (Success Criterion 2) — needs HR confirmation
- **Works Council notification timing**: ELCA-specific governance rule may dictate when they must be informed (kick-off vs. design freeze)
- **External canteen contract**: does the provider have veto rights on operational changes? (Read contract before assuming Influence = 3)

#### Mary's BA Review Prompt (Task C6)

Before continuing, please verify:
- ☐ Are all relevant stakeholders captured? (Anyone missing? — e.g., a Data Protection Officer for GDPR review?)
- ☐ Are interest / influence scores plausible for ELCA's culture?
- ☐ Is the communication plan realistic given available bandwidth?

> ⚠️ **Workshop-rehearsal flag**: every name, score, and team-size figure above is fabricated for the dry-run. In a real engagement these come from a stakeholder workshop, an org chart, and conversations with the sponsor. Useful teaching moment: *§1.3 is the SRD section most prone to under-elicitation — participants tend to capture only the user-facing personas (Employee + Admin) and miss the people who can quietly kill the project (IT Security, Works Council, the sponsor).*

### 1.4 Scope

#### In Scope

| # | Area | Description |
|---|---|---|
| 1 | **User groups** | On-site employees; canteen admin (via `X-Admin: true`) |
| 2 | **Functionality** | Story 1: list today's menu · Story 2: submit order · Story 3: list own orders · Story 4: cancel own order · Story 5: admin adds menu item |
| 3 | **API surface** | REST over HTTP, JSON, under `/api/v1`; HTTP status codes 200/201/204/400/403/404/409 |
| 4 | **Mock auth** | `X-User-Id` header on `/orders/**`; `X-Admin: true` on admin endpoints |
| 5 | **Persistence** | H2 in-memory DB; UUID PKs; `ddl-auto: update` |
| 6 | **Operational** | `/actuator/health` reachable returning `UP` |
| 7 | **Documentation** | This SRD; the tech spec (`docs/tech-spec.md`); the 5 story files |

#### Out of Scope

| # | Area | Description | Rationale |
|---|---|---|---|
| 1 | **Real authentication / authorisation** | No SSO, no OAuth, no user database, no password store | PRD §"Out of scope". Mock headers are the v1 boundary |
| 2 | **Payment** | No price collection, no integration with finance / expense systems | PRD §"Out of scope". This is an ordering service, not a billing service |
| 3 | **Notifications** | No email / SMS / Teams on order placement or cancellation | PRD §"Out of scope" |
| 4 | **Multi-day menus** | Only "today" exists; no historical menus, no advance ordering | PRD §"Out of scope". Avoids calendar / timezone complexity |
| 5 | **Frontend** | No web UI, no mobile app | PRD §"Out of scope". API-only deliverable |
| 6 | **Kitchen-facing view** | No aggregated portions-per-item endpoint for the kitchen | Not in stories 1–5; deferred to v2 (see §1.2 deferred items) |
| 7 | **Observability beyond `/health`** | No metrics, no tracing, no log aggregation | Tech spec §"What this doc deliberately doesn't decide" |
| 8 | **Database migrations** | No Flyway / Liquibase; H2 `ddl-auto: update` is the lifecycle manager | Tech spec; workshop simplification |
| 9 | **OpenAPI / Swagger** | No machine-readable API contract | Tech spec: "stretch goal" |
| 10 | **Caching, rate limiting** | None | Tech spec §"deliberately doesn't decide" |

#### Gray Areas / Open Questions

| # | Area | Question | Status |
|---|---|---|---|
| 1 | **Definition of "today"** | Calendar day in CH timezone? Cut-off time for ordering? Does midnight roll over the menu automatically or by admin action? | Open |
| 2 | **Kitchen consumption channel** | How does the actual kitchen team receive the day's order list? Manual SQL? Admin reads to them? Printed report? | Open (likely v2) |
| 3 | **Admin scope** | Only Story 5 (add item) is in scope. What about editing prices / removing items / toggling availability? Missing CRUD coverage. | Open (likely v2) |
| 4 | **`userId` semantics** | Is it an ELCA AD identifier? An email? A free string? GDPR posture changes accordingly | Open |

#### Surrounding Systems

| # | System | Direction | Purpose | Data Exchanged | Business Process | Business Rules |
|---|---|---|---|---|---|---|
| 1 | **Implicit identity provider** (reverse proxy / SSO) | Upstream (deferred) | Sets `X-User-Id` in v2 instead of accepting it as a raw client header | `userId` | Authentication | Today: trust client; v2: enforced upstream |
| 2 | **Kitchen / canteen operations** (manual today) | Downstream (deferred) | Receives the day's order list to prep food | Aggregated order list per menu item | Daily kitchen prep | Today: admin reads from app; v2: dedicated kitchen view (STORY-6) |
| 3 | **IT-Ops monitoring** | Downstream (operational) | Polls `/actuator/health` for uptime tracking | UP / DOWN status | Uptime SLA monitoring | None — purely operational |

#### Abstract Architecture Diagram

```
                       ┌───────────────────────────┐
                       │   Employee browser/curl   │
                       │  (no UI; direct API call) │
                       └─────────────┬─────────────┘
                                     │  HTTP/JSON
                                     │  + X-User-Id header
                                     ▼
   ┌───────────────────┐    ┌────────────────────────────────┐    ┌──────────────────────┐
   │  IT-Ops Uptime    │───▶│   Lunch Order API (Spring 3.5) │    │   Canteen Admin      │
   │  monitor          │    │   ┌─────────────┬──────────┐   │◀───│   (HTTP + X-Admin)   │
   │  /actuator/health │    │   │   menu/     │ order/   │   │    └──────────────────────┘
   └───────────────────┘    │   │   service+  │ service+ │   │
                            │   │   ctrl      │ ctrl     │   │
                            │   └──────┬──────┴──────────┘   │
                            │          ▼                     │
                            │      ┌────────┐                │
                            │      │  H2    │                │
                            │      │ in-mem │                │
                            │      └────────┘                │
                            └────────────────┬───────────────┘
                                             │
                                             │ (deferred / manual today)
                                             ▼
                            ┌────────────────────────────────┐
                            │     Kitchen / canteen team     │
                            │  (reads aggregated orders —    │
                            │   v1: manual; v2: STORY-6 view)│
                            └────────────────────────────────┘

   ⋯ deferred to v2 ⋯
   IdP / Reverse proxy ─▶ Lunch Order API  (replaces "trust X-User-Id" pattern)
```

#### Plausibility Check (Tasks D2 + E2)

- ⚠️ **Inconsistency**: Tech spec says *"No external systems. No async."* but `X-User-Id` is meaningless without an implicit upstream IdP. The mock works because *someone* (gateway, curl) sets it. **Recommendation:** in §1.5 Constraints, name this as the "auth boundary" so the implicit dependency is visible.
- ⚠️ **Gap**: kitchen-consumption channel is undefined. If we ship v1 without it, the canteen admin is the bottleneck. Worth surfacing to the sponsor in the §1.3 communication plan.
- ✅ **Coherent**: scope inclusions and exclusions are mutually exclusive and well-justified.

### 1.5 Constraints

#### Geographic Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | Single-site canteen (assumed Lausanne or Zurich ELCA office) | No multi-site routing of orders; one menu, one kitchen | Inferred — not in docs |
| 2 | Switzerland-based deployment | CET/CEST timezone; Swiss data-protection law (nLPD) applies | Inferred — not in docs |

> ⚠️ Both inferred; needs sponsor confirmation in real engagements.

#### Organizational Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | Two user groups: **Employee** (place / view / cancel own orders) and **Canteen Admin** (`X-Admin: true` — add menu items) | Drives the auth-header model and route-level role checks | `docs/prd.md` §Personas; `docs/tech-spec.md` §API conventions |
| 2 | No role hierarchy beyond Employee / Admin | No delegation, no shift managers, no "kitchen-only" role | Implicit from absence in docs |
| 3 | Auth boundary owned by upstream gateway (deferred to v2) | Today: client sets `X-User-Id`; v2: enforced by IdP/reverse proxy | `docs/tech-spec.md` §Auth + §1.4 surrounding-systems analysis |

#### Technical Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | **Java 21 (LTS)** | Locked language and runtime version | `docs/tech-spec.md`; `pom.xml` |
| 2 | **Spring Boot 3.5.0** | Locked framework version + Jakarta EE namespace | `docs/tech-spec.md`; `pom.xml` |
| 3 | **Maven 3.9+** with `spring-boot-maven-plugin` | Build tool fixed; no Gradle | `docs/tech-spec.md`; `pom.xml` |
| 4 | **H2 in-memory database** | No persistence across restarts; no production deployment as-is; PostgreSQL swap = "zero code changes + one dependency swap" | `docs/tech-spec.md` |
| 5 | **No external systems** (no Redis, no Kafka, no real IdP) | Single-process boundary in v1 | `docs/tech-spec.md` |
| 6 | **REST / HTTP / JSON under `/api/v1`** | No GraphQL, no gRPC, no SOAP | `docs/tech-spec.md` §API conventions |
| 7 | **UUID primary keys throughout** | No sequence guessing; matches broader ELCA migration convention | `docs/tech-spec.md` |
| 8 | **No DTOs in v1 (entity = API)** | Refactor toward DTOs only if a story explicitly requires it | `docs/tech-spec.md` §Decisions |
| 9 | **Feature-based packaging** (`menu/`, `order/`, `common/`) — entity, repo, service, controller live in the same package | No layered `dto/entity/service/repo` split | `docs/tech-spec.md` §Package layout |
| 10 | **`jakarta.validation`** for input validation | `@Valid` on controller args; structured 400 responses | `docs/tech-spec.md` §Validation |
| 11 | **`ddl-auto: update`** — no Flyway / Liquibase | Schema lifecycle managed by Hibernate for workshop simplicity | `docs/tech-spec.md` §Decisions |
| 12 | **Test framework**: `@WebMvcTest` (controllers), `@DataJpaTest` (repos), `@SpringBootTest` only for smoke test | Slow tests forbidden | `docs/tech-spec.md` §Testing |
| 13 | **No additional dependencies** beyond what is in `pom.xml` unless story requires it | Limits scope creep | `CLAUDE.md` §Scope rules |

#### Financial Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | Workshop format: half-day, monthly, fixed effort per participant | Each story sized for ≤ 60 min implementation cycle | `CLAUDE.md` §Workshop flow |
| 2 | No external budget figure in docs | Cannot apply financial Definition of Done (e.g., billing milestone) | Implicit gap — fabricated for dry-run |
| 3 | **DoD (per story)** locked — see `CLAUDE.md` §Definition of Done | Every story must pass `mvn test`, boot cleanly, return `UP` on `/actuator/health`, and have a PR against `main` | `CLAUDE.md` |

> ⚠️ Item 2 fabricated for the dry-run — real engagements would have a budget envelope.

#### Process Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | **BMAD Phase 4 cycle** per story: SM (lock story) → Dev (implement + tests + PR) → QA (verify) | The whole methodology being taught | `CLAUDE.md` §Workshop flow; this workflow |
| 2 | **One story per branch** | No batching, no preemptive refactors across stories | `CLAUDE.md` §Scope rules |
| 3 | **Branch naming**: `feature/STORY-<n>-<short-slug>` | Locked | `CLAUDE.md` |
| 4 | **Commit format**: `STORY-<n>: <description>` | Locked | `CLAUDE.md` |
| 5 | **PR target**: `main`; participant decides on merge — agents never self-merge | Locked | `CLAUDE.md` |
| 6 | **Package root**: `ch.elca.training.lunch` | Locked | `CLAUDE.md` |
| 7 | **Stay inside the story's AC** — no improving surrounding code, no preemptive refactors | The lesson is steering, not autonomous engineering | `CLAUDE.md` §Scope rules |

#### Schedule Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | **MVP** — Stories 1–3 to staging by T+4 weeks (fabricated for dry-run) | Drives sprint planning | §1.2 Business Goals (this SRD) |
| 2 | **Public launch** — Stories 1–5 in production by T+8 weeks (fabricated) | Hard external milestone | §1.2 Business Goals |
| 3 | **Adoption checkpoint** at T+3 months from launch | Success Criterion 2 review | §1.2 Business Goals |
| 4 | **Workshop cycle**: each participant runs one SM→Dev→QA cycle in a single half-day block | Story complexity capped accordingly | `CLAUDE.md` §Workshop flow |

#### Regulatory Constraints

| # | Constraint | Impact | Source |
|---|---|---|---|
| 1 | **Swiss data-protection law (nLPD / revFADP)** applies — `userId` is likely PII | Need a retention policy; need a deletion path (v2) | Inferred from Geographic Constraint 2 |
| 2 | **GDPR-equivalence** for any EU data subjects | Cross-border consideration if ELCA hires from EU | Inferred |
| 3 | **Works Council (Personalkommission) notification** before launch | Required for changes affecting employee data | §1.3 Stakeholders |
| 4 | **No special regulation** for ordering food (not pharma, not finance) | Low regulatory burden overall | Inferred |

> ⚠️ Items 1–3 fabricated based on standard CH corporate practice — needs legal sign-off in a real project.

#### Open Questions

| # | Question | Assigned To | Status |
|---|---|---|---|
| 1 | Which ELCA office (Lausanne, Zurich, both)? | Sponsor | Open |
| 2 | `userId` retention policy — keep forever? Anonymise after X days? | Legal + IT Security | Open |
| 3 | Is there a budget cap or capitalisation rule (capex vs. opex) for v1? | Facilities Manager | Open |
| 4 | Works Council notification deadline relative to launch | HR | Open |
| 5 | Is PostgreSQL the assumed v2 production DB, or another RDBMS? | IT Operations | Open |

#### Plausibility Check (Task F2)

- ✅ Technical constraints (Java 21 + Spring 3.5 + H2 + UUIDs) are internally consistent
- ⚠️ Schedule constraints (§1.2 dates) and process constraint 1 (BMAD cycle) are **two different timelines** — the BMAD cycle is for the workshop, the dates are for the (fictional) real launch. In a real project these are the same set. **Recommendation:** clarify in §1.2 which date system applies if running this SRD outside the workshop context.
- ⚠️ Constraint #5 (no external systems) contradicts the implicit IdP from §1.4 surrounding systems — already flagged, but worth re-stating: v1 = no IdP, v2 = mandatory IdP, transition needs a constraint in its own right when planning v2.

## PHASE 2: FUNCTIONAL REQUIREMENTS

### 2.1 Domain Terminology (Glossary)

<!-- Technical terms, abbreviations, industry terminology -->

### 2.2 Process Participants (AKV Matrix)

<!-- Roles with Tasks, Competencies, Responsibilities -->

### 2.3 Business Processes and Use Cases

<!-- BPMN diagrams, process descriptions, use case specifications -->

### 2.4 Event Model

<!-- Domain Events, Commands, Aggregates, Read Models -->

### 2.5 Epics (Functional Blocks)

<!-- Large functional blocks with goals, stakeholders, scope, success criteria -->

### 2.6 Features (with Prioritization)

<!-- Feature descriptions, business value, effort estimation -->

### 2.7 Specifications

<!-- Detailed specifications per feature with business rules -->

### 2.8 User Stories

<!-- User stories linked to specifications and Jira -->

### 2.9 Data Model

<!-- Data objects, entities, relationships, volume framework -->
