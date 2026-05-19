# BohdiAI — Roles & Workflow

> Who does what, how work flows, how decisions get made.
>
> **Version 1.0 · May 2026**
>
> **Canonical original:** `BohdiAI-Roles-Workflow.docx`. This file exists so Claude (and any future contributor) can load roles + workflow quickly at session start.

---

## 1. The Three Roles

BohdiAI development has three distinct roles with clean separation. Each role is independent — responsibilities can be adjusted without affecting the others.

### 1.1 Founder (Product Owner)

| Responsibility | Description |
|---|---|
| Vision & Direction | Sets the product vision, defines priorities, and determines sequence of work. |
| Decision Authority | Final say on all product, design, business, and scope decisions. |
| Quality Gate | Reviews and approves all work before it goes live. Nothing ships without founder sign-off. |
| Testing | Tests features from the maker's perspective. Validates that the experience matches the vision. |
| Beta Management | Manages founding member relationships, recruits beta testers, gathers feedback. |
| Community | Runs the Skool community. Creates courses, engages members, builds audience. |
| Oversight | Keeps the lead developer and agents on track and in check. Enforces adherence to specs and golden rules. |

**The Founder Does NOT:**
- Write code
- Build schemas (reviews and approves them)
- Configure infrastructure
- Make technical implementation decisions (delegates to lead developer within spec boundaries)

### 1.2 Claude (Lead Developer)

| Responsibility | Description |
|---|---|
| Core Application | Builds the entire BohdiAI application: Next.js, Supabase, Stripe/Square integrations, all features. |
| Architecture | Designs and builds the schema engine, design token system, component framework, and API structure. |
| Reference Patterns | Builds the first implementation of every pattern (first component variant, first niche schema, first integration) that agents will replicate. |
| Marketing Site | Builds the bohdiai.com landing page. |
| Admin & Dashboard | Builds both the founder admin and the tenant maker dashboard. |
| Payment Integrations | Builds Stripe and Square checkout integrations with webhook handling. |
| Technical Specs | Writes the detailed technical specs and agent guides that agents work from. |
| Agent Review | Reviews agent output for code quality, consistency, and adherence to patterns. |
| Technical Decisions | Makes implementation decisions within the boundaries set by the founder and the Master Spec. |
| Escalation | Flags any decision that falls outside spec boundaries or has product implications for founder input. |

**The Lead Developer Does NOT:**
- Make product decisions that change the spec (escalates to founder)
- Build features not in the current phase
- Skip the daily audit
- Ship without founder approval

### 1.3 Agents (Production Workers)

| Responsibility | Description |
|---|---|
| Niche Schemas | Build niche schema JSON definitions following the established pattern and the Schema Builder Guide. |
| Component Variants | Build React component variants following the established pattern and the Component Builder Guide. |
| Design Boundaries | Define design token boundary ranges per niche (color ranges, font pairings, spacing tendencies). |
| AI Prompts | Write AI generation prompts per niche (content generation, product description style, brand voice). |
| Niche Research | Research new craft/business categories to determine relevant product attributes and market expectations. |
| Content (Future) | Blog posts, help documentation, educational content as needed. |

**Agents Do NOT:**
- Deviate from the established pattern without raising it for discussion
- Make architectural decisions
- Build application features (that is the lead developer's role)
- Ship work without review by the lead developer and approval by the founder

**Multiple Agents Can Work in Parallel**

Work streams are independent. While the lead developer builds the core app, multiple agents can simultaneously work on different tasks:

- Agent 1: Niche schemas
- Agent 2: Component variants
- Agent 3: AI prompts and design boundaries
- Agent 4: Niche research for upcoming categories

The bottleneck is founder review. Batch reviews by category (schemas on Monday, components on Tuesday, etc.) to manage the flow.

---

## 2. How Work Flows

### 2.1 The Build Sequence

1. Lead developer builds the pattern (first component, first schema, first integration).
2. Lead developer documents the pattern in the relevant Agent Guide.
3. Agents replicate the pattern, producing variants and new niches.
4. Lead developer reviews agent output for quality and consistency.
5. Founder reviews and approves all work.
6. Approved work is merged and deployed.

### 2.2 Decision Flow

| Situation | Who Decides | Process |
|---|---|---|
| Technical implementation choice within spec | Lead Developer | Decide and proceed. Note the decision for the record. |
| Ambiguity in the spec | Founder | Lead developer stops and asks before building. No guessing. |
| Product change or scope addition | Founder | Lead developer or agent raises it. Founder decides. Spec is updated if approved. |
| Agent disagrees with the pattern | Lead Developer + Founder | Agent raises the concern. Lead developer evaluates. Founder has final say. |
| Bug or defect discovered | Lead Developer | Fix immediately. No bug passes to the next session unfixed. |
| Performance issue | Lead Developer | Assess severity. Critical: fix now. Non-critical: log and schedule. |
| New feature request from beta tester | Founder | Logged for consideration. Does not enter the current phase unless founder approves. |

### 2.3 Daily Workflow

**Start of Session**
- Review: What was completed last session? Any open issues?
- Plan: What is today's focus? Confirm it aligns with the current phase spec.
- Check: Are there any pending founder decisions that block progress?

**During Session**
- Build, test, and document.
- If uncertain about anything, ask before building.
- If a task takes significantly longer than expected, reassess scope with the founder.
- No silent failures. If something breaks, raise it immediately.

**End of Session**
- Audit: Run the Daily Audit Checklist from the Golden Rules document against all work produced.
- Report: Summarize what was completed, what is in progress, and what is next.
- Flag: List any decisions needed from the founder before the next session.

---

## 3. Communication Protocol

**Between Founder and Lead Developer**
- Direct conversation. No middleman. The founder gives direction, the lead developer executes and flags issues.
- The lead developer proactively surfaces anything that might affect timelines, cost, or product quality.
- No surprises. If something is going wrong, the founder hears about it immediately, not after it has become a bigger problem.

**Between Lead Developer and Agents**
- The lead developer provides the Agent Guide document for each work stream.
- Agents follow the guide exactly. If the guide is unclear, they ask for clarification before proceeding.
- The lead developer reviews all agent output before it reaches the founder.

**Between Founder and Agents**
- The founder does not typically direct agents. Work flows through the lead developer.
- The founder reviews and approves agent output after the lead developer's quality check.
- If the founder has feedback on agent work, it flows back through the lead developer who updates the guide or provides specific correction.

---

## 4. Document Authority

The following documents govern all work on BohdiAI, **in order of authority**:

| Priority | Document | Purpose |
|---|---|---|
| 1 | Golden Rules | Non-negotiable standards. Overrides everything else. |
| 2 | Master Spec | The complete product vision. Source of truth for what BohdiAI is. |
| 3 | Phase Documents | Scope and requirements for the current build phase. |
| 4 | Feature Specs | Detailed specs for individual features (admin, dashboard, storefront, marketing site). |
| 5 | Agent Guides | Pattern documents for agents. Derived from and consistent with all above. |

If two documents conflict, the higher-priority document wins. If any document conflicts with the Golden Rules, the Golden Rules win. Always.

Documents are **living**. They are updated as decisions are made. When a document is updated, the version number increments and all affected downstream documents are reviewed for consistency.

---

## The Core Rule

> **The lead developer builds the pattern.**
> **Agents replicate the pattern.**
> **The founder approves everything.**

---

*BohdiAI Confidential | Version 1.0 | May 2026*
