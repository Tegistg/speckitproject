# Implementation Plan: Dorm Snack Marketplace

**Branch**: `002-dorm-snack-marketplace` | **Date**: 2026-05-12 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-dorm-snack-marketplace/spec.md`

## Summary

A mobile-first peer-to-peer snack marketplace for university dorm residents. Buyers browse, search, and order snacks listed by fellow students; sellers manage listings, confirm orders, and receive payment via Stripe Connect or cash-on-pickup. The system enforces university email domain verification at registration, tracks orders through a 6-state lifecycle (pending → confirmed → ready_for_pickup → completed, with cancelled and disputed branches), and supports post-transaction 1–5 star ratings. Stack: React Native + Expo (mobile), Node.js 20 + Fastify 4 + TypeScript (backend API), PostgreSQL 15 via Supabase (database), Cloudinary (photo uploads), Stripe Connect + Payment Intents (in-app payments), Expo Push Notifications (cross-platform).

## Technical Context

**Language/Version**: TypeScript 5.x throughout; Node.js 20 LTS (backend)
**Primary Dependencies**: Expo SDK 51 + React Native, Fastify 4.x, Prisma 5.x (ORM + migrations), Supabase Auth, Stripe Connect SDK, `@stripe/stripe-react-native`, Cloudinary Node SDK, expo-notifications
**Storage**: PostgreSQL 15 via Supabase (relational data + full-text search via `tsvector`); Cloudinary (photo blob storage + CDN)
**Testing**: Jest + Supertest (backend unit + integration), Jest + React Native Testing Library (mobile), pytest not applicable
**Target Platform**: iOS 15+ and Android 10+ via Expo managed workflow
**Project Type**: Mobile app (React Native/Expo) + REST API backend
**Performance Goals**: API p95 < 500 ms; search results < 2 s (SC-003); 500 concurrent users (SC-006)
**Constraints**: University email domain restriction at registration (FR-015); mobile-only v1; photo uploads optional; cash-on-pickup requires no in-app payment processing
**Scale/Scope**: ~500 concurrent users, hundreds of listings, ~50 screens estimated

> ⚠️ **CONSTITUTION MISMATCH — Human Review Required Before Implementation**
> The constitution's Locked Dependencies (Python 3.11, Typer, Hatchling, pytest) reflect a CLI tool template configuration. This feature requires TypeScript/Node.js + React Native, which diverges from those locked values. Per P7, the agent cannot amend the constitution. A human must either update the constitution's tech stack section to reflect this feature's stack, or explicitly confirm the Python constraints do not govern this feature before `/speckit-tasks` is run.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|---|---|---|
| P1: Spec before code | ✅ PASS | `spec.md` complete, all NEEDS CLARIFICATION resolved |
| P2: One spec per feature | ✅ PASS | Single spec covers the entire marketplace v1 |
| P3: Humans verify, agents execute | ✅ PASS | Plan requires human sign-off; agent does not self-approve |
| P4: Failing tests block merges | ✅ PASS | CI gate to be wired in tasks; test suite required per spec |
| P5: No orphaned code | ✅ PASS | All planned modules trace to FR-001–FR-015 |
| P6: Brownfield respect | ✅ PASS | Greenfield feature; no conflicting existing architecture |
| P7: Constitution is human-only | ✅ PASS | Agent has not modified constitution.md |
| **Tech Stack Gate** | ⚠️ FLAG | Constitution locks Python/Typer; feature requires TypeScript + React Native. Requires human resolution. |

## Project Structure

### Documentation (this feature)

```text
specs/002-dorm-snack-marketplace/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
│   ├── auth.yaml
│   ├── listings.yaml
│   ├── orders.yaml
│   ├── users.yaml
│   └── ratings.yaml
└── tasks.md             # Phase 2 output (/speckit-tasks command — NOT created here)
```

### Source Code (repository root)

```text
api/
├── src/
│   ├── models/         # Prisma schema + generated client types
│   ├── services/       # Business logic: orders, listings, payments, notifications, ratings
│   ├── routes/         # Fastify route handlers: auth, listings, orders, users, ratings
│   ├── middleware/     # JWT validation, university email domain enforcement
│   └── lib/            # Stripe, Cloudinary, Expo Push singleton clients
└── tests/
    ├── unit/           # Service-layer unit tests
    └── integration/    # Route-level tests against a real test database

mobile/
├── src/
│   ├── components/     # Shared UI: ListingCard, OrderStatusBadge, StarRating, etc.
│   ├── screens/        # Feed, ListingDetail, CreateListing, OrderDetail, Profile, etc.
│   ├── services/       # API client (typed fetch wrapper), push token registration
│   └── store/          # React Query for server state; Zustand for local UI state
└── tests/
    ├── unit/
    └── integration/
```

**Structure Decision**: Two top-level project directories (`api/` and `mobile/`), matching the mobile app + REST API pattern. Shared TypeScript types are co-located in `api/src/models/` and imported by the mobile client; a `packages/shared/` monorepo package is deferred to v2.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| Tech stack diverges from constitution's Python/Typer defaults | The spec mandates mobile-first with push notifications, photo uploads, in-app payments, and real-time order tracking — none of which are deliverable as a Python CLI | A Python CLI cannot produce a consumer mobile marketplace; this feature is a categorically different product from a developer CLI tool |
