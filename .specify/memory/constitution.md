# Spec Kit Constitution
<!-- Version: 1.0.0 | Last amended: 2026-04-29 | Amended by: [name] -->
<!-- Changelog at bottom of this file -->

---

## 1. Core Principles

These rules are non-negotiable. The coding agent cannot bypass, rationalize around, or defer them.

| # | Principle | What it means |
|---|-----------|---------------|
| P1 | **Spec before code** | No implementation begins without an approved `.spec.md` file. `/implement` is blocked if `/specify` has not been reviewed and signed off. |
| P2 | **One spec per feature** | Each feature, bug fix, or initiative gets its own spec. No bundling unrelated changes into a single spec. |
| P3 | **Humans verify, agents execute** | The agent proposes — plans, tasks, code. A human approves before each phase transition. Agents do not self-approve. |
| P4 | **Failing tests block merges** | No PR merges with a failing test suite. The agent must resolve failures before requesting review. |
| P5 | **No orphaned code** | Every function or module must trace back to a task, which traces back to a spec. Undocumented additions are not permitted. |
| P6 | **Brownfield respect** | The agent reads and understands existing architecture before proposing changes. The agent adapts to the codebase — the codebase does not adapt to the agent. |
| P7 | **Constitution is human-only** | The agent cannot modify this file, CLAUDE.md, or any core config files. These are human-governed artifacts. |

---

## 2. Tech Stack & Constraints

### Locked Dependencies
```
Python version:     >=3.11
CLI framework:      Typer >=0.24.0, Click >=8.2.1
Language:           Python
Package manager:    Hatchling (build) / pip (install)
Test runner:        pytest >=7.0
```

### Rules
- Dependencies are pinned. The agent cannot propose version upgrades without a spec.
- No ORM magic. External API contracts (GitHub, Jira, Confluence, etc.) cannot be changed by the agent without a spec amendment.

### Off-Limits
- Production credentials never appear in spec files, task files, or code comments.
- No direct commits to `main`. All changes must go through a PR.
- The agent cannot run destructive operations outside of a locally scoped test environment.

---

## 3. Development Workflow

### Phase Gates

```
[ Spec approved ]         ← Human sign-off required
        ↓
[ /plan reviewed ]        ← Human confirms approach
        ↓
[ /tasks accepted ]       ← Human validates scope
        ↓
[ Agent implements ]
        ↓
[ Tests pass ]            ← Automated gate — PR blocked if red
        ↓
[ Code review ]           ← Human reviewer (not the author)
        ↓
[ Merge to main ]
```

### PR Rules
- Every PR must reference its `.spec.md` file in the PR description.
- PRs without a linked spec are flagged and must be resolved before review begins.
- Agent-generated code is labeled `[ai-assisted]` in the PR description so reviewers know where to focus scrutiny.
- No self-merges. A second human must approve.
- If a spec is amended post-implementation, a retroactive comment is required in the PR explaining the drift.

### Quality Gates
- Tests must exist for any new behavior. Test-first or test-concurrent — never test-after.
- Linting and formatting must pass before a PR is reviewable.
- No `TODO` comments left in merged code unless linked to an open ticket.

---

## 4. Governance

### Who Can Amend This Constitution

| Artifact | Who can propose | Who must approve |
|---|---|---|
| This file (constitution.md) | Any team member | Majority vote — minimum 2 senior members |
| `.spec.md` files | BA / PM / Dev Lead | At least 1 reviewer from a different role |
| Task lists | Dev / BA | Dev Lead or peer |
| Implementation | Coding agent | Any dev reviewer |

### Amendment Process

1. Open a dedicated PR titled: `[constitution] — <change summary>`
2. Include a **Rationale** section: why this rule needs to change and what problem it solves.
3. Minimum review window: **48 hours** — no fast-merges on governance changes.
4. Requires sign-off from at least one person outside the role proposing the change.
5. On merge, update the version number and changelog at the bottom of this file.

### What Triggers a Constitutional Review
- A principle was violated and the gap needs to be closed.
- A new tool or workflow makes an existing rule obsolete.
- A new team member or product area requires the rules to flex.

---

## 5. Spec File Format

Every `.spec.md` lives in `/specs/` and follows this structure:

```markdown
# Spec: [Feature Name]
**Version:** 1.0
**Status:** Draft | In Review | Approved
**Author:** [name]
**Reviewer(s):** [names]
**Last updated:** YYYY-MM-DD

## Problem Statement
What problem does this solve? Why now?

## Goals
- Goal 1
- Goal 2

## Non-Goals
- Out of scope item 1

## Proposed Solution
High-level description of the approach.

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Open Questions
- Question 1 (owner: [name], due: [date])

## Dependencies
- Other specs, tickets, or services this depends on
```

---

## 6. File Structure Reference

```
/
├── constitution.md         ← This file. Human-only. Do not edit via agent.
├── specs/                  ← All .spec.md files live here
│   └── [feature-name].spec.md
├── .tasks/                 ← Agent-generated task breakdowns (per spec)
├── src/
└── tests/
```

---

## Changelog

| Version | Date | Author | Summary |
|---|---|---|---|
| 1.0.0 | 2026-04-29 | [name] | Initial constitution |
