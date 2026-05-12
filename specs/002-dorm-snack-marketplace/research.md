# Research: Dorm Snack Marketplace

**Phase**: 0 | **Date**: 2026-05-12 | **Plan**: [plan.md](./plan.md)

All NEEDS CLARIFICATION items from Technical Context are resolved below.

---

## Tech Stack

### Mobile Framework

**Decision**: React Native + Expo (managed workflow)
**Rationale**: Single codebase ships to iOS and Android. Expo managed workflow eliminates native tooling overhead and provides first-class support for push notifications (`expo-notifications`), camera/image-picker, and OTA updates. JavaScript/TypeScript ecosystem allows sharing type definitions with the backend. At 500 concurrent users, performance is not a bottleneck — the JS bridge overhead is irrelevant at this scale.
**Alternatives considered**: Flutter (eliminated — Dart is a narrower hiring pool, more manual FCM/APNs wiring); Swift/Kotlin native (eliminated — doubles codebase, overkill for campus scale).

---

### Backend

**Decision**: Node.js 20 LTS + Fastify 4 + TypeScript
**Rationale**: TypeScript types flow end-to-end from API contracts to the React Native client, reducing integration bugs. Async-first runtime handles the order lifecycle's event-driven notification triggers (webhook from Stripe, push on order state change). npm ecosystem has first-class SDKs for Stripe, Supabase, Cloudinary, and JWT. Fastify provides structured logging and 2× throughput over Express if performance scaling is needed, with identical code patterns. A single Render/Railway instance comfortably handles 500 concurrent users.
**Alternatives considered**: FastAPI/Python (eliminated — splits language across mobile TS and backend Python; increases team context-switching); Go (eliminated — overkill for this scale); Django REST Framework (eliminated — heavy, slower iteration vs Prisma/Fastify).

---

### Database

**Decision**: PostgreSQL 15 via Supabase
**Rationale**: Fully relational schema (Users → Listings → Orders → Ratings) with foreign-key integrity. PostgreSQL enum types model the order FSM cleanly. Built-in full-text search (`tsvector`/`tsquery`) covers FR-004 keyword search without a separate search service. `CHECK` constraints enforce business rules at the DB layer (`quantity >= 0`, `rating BETWEEN 1 AND 5`). Supabase adds Row-Level Security for free, tightening auth boundaries.
**Alternatives considered**: MySQL (eliminated — weaker full-text search, no enum/CHECK composability); MongoDB (eliminated — relational joins simulated in app code increases bugs; schema-less is a liability for a well-defined data model).

---

### File Storage

**Decision**: Cloudinary
**Rationale**: Free tier (25 GB storage/bandwidth) covers a campus pilot. Built-in image transformation on upload (resize to listing thumbnail, compress for mobile) with no Lambda/function required. React Native SDK handles image picker → upload in ~10 lines; returns a URL stored in the Listings table. CDN delivery included.
**Alternatives considered**: AWS S3 + CloudFront (eliminated — IAM, bucket policies, CloudFront distribution = significant ops overhead for v1); Supabase Storage (eliminated — no image transformation, lower CDN coverage); Firebase Storage (eliminated — Google ecosystem coupling, no transforms without Cloud Functions).

---

### Push Notifications

**Decision**: Expo Push Notifications (backed by FCM + APNs)
**Rationale**: Zero-config when using Expo: the SDK generates an `ExpoPushToken`, the backend POSTs to the Expo Push API, and Expo routes to FCM (Android) or APNs (iOS) automatically. Eliminates certificate management, APNs HTTP/2 connection pooling, and FCM token refresh. Free at campus-app volumes.
**Alternatives considered**: FCM/APNs direct (eliminated — requires managing two credentials and dual-platform routing that Expo already provides); OneSignal (viable but adds a third-party dependency when Expo Push is already available); Firebase Cloud Messaging direct (eliminated — requires Firebase project setup and service account).

---

### Payment Processor

**Decision**: Stripe Connect (Express accounts) + Payment Intents
**Rationale**: Stripe Connect is required for any marketplace where money flows buyer → seller. Express accounts give sellers a Stripe-hosted onboarding UI (Stripe handles KYC/payouts), reducing engineering burden. Payment Intents enable the authorize-now, capture-on-confirmation pattern: buyer sees an authorization hold at order placement; seller confirmation captures funds; timeout/rejection voids the hold with no refund processing. PCI compliance is Stripe's responsibility.
**Alternatives considered**: Stripe Checkout (eliminated — captures immediately, forces refunds on every cancellation); Stripe Standard Connect (eliminated — seller redirected to full Stripe dashboard, excessive friction for dorm users); direct charges without Connect (non-compliant for marketplace payouts).

---

### Auth

**Decision**: Supabase Auth (JWT-based) + university email domain validation
**Rationale**: Supabase Auth provides email/password sign-up with built-in email verification. A server-side hook validates that the email domain matches the configured university domain (e.g., `@university.edu`) before confirming the account. JWTs (1-hour TTL) with refresh tokens stored via React Native `SecureStore`. RLS in Supabase Postgres uses the JWT `sub` claim directly, unifying auth and data access control.
**Alternatives considered**: Auth0 (eliminated — paid dependency, webhook config needed for domain rules); Firebase Auth (eliminated — Google ecosystem coupling, domain restriction requires Cloud Functions); custom JWT (eliminated — requires building email delivery, verification tokens, and refresh rotation from scratch); university SSO/SAML (eliminated — requires IT cooperation, impractical for v1).

---

## Order Lifecycle

### Seller Non-Response Timeout

**Decision**: Auto-cancel at 30 minutes; push notification warning at 15 minutes. Cancellation stored as `cancelled` status with `cancel_reason = 'seller_timeout'` (sub-reason, not a separate state).
**Rationale**: Dorm commerce is high-urgency. 30 minutes matches on-demand food delivery norms. A warning at 15 min gives sellers a fair chance to respond. For cash orders, no payment action needed. For Stripe orders, the PaymentIntent is authorized (not captured) at placement, so timeout simply voids the authorization — no refund processing.
**Alternatives considered**: 60-minute timeout (eliminated — too long, buyer has already moved on); separate `timed_out` state (eliminated — unnecessary complexity; sub-reason on `cancelled` is sufficient); no timeout / buyer manually cancels (eliminated — creates permanently abandoned orders, degrades seller stats).

---

### Buyer Cancellation After Seller Confirmation

**Decision**: Buyer may cancel any order up to (but not including) the `ready_for_pickup` transition. Full refund for Stripe orders; no in-app action for cash orders. Cancellation reason stored as enum (`buyer_changed_mind | buyer_unavailable | other`).
**Rationale**: v1 prioritizes trust and adoption over penalty enforcement. Seller cost in a dorm snack transaction is minimal — the item is still in their room. Full refund is the correct consumer expectation and prevents card disputes. Locking cancellation once the order is `ready_for_pickup` protects sellers who have already acted.
**Alternatives considered**: Full refund at any lifecycle point (eliminated — exposes system to abuse after seller has walked to pickup); partial refund (deferred to v2 after data on cancellation patterns); no cancellation after confirmation (too rigid, creates dispute volume).

---

### Dispute Handling (v1)

**Decision**: Flag + `disputed` state + human admin review. Either party flags an order with a typed reason (`item_not_received | item_not_as_described | no_show_buyer | no_show_seller | other`) and optional free-text note. Flagged orders move to `disputed`, pausing all auto-transitions. Admin resolves via admin panel action setting final state (`completed` or `cancelled`) with optional Stripe refund override.
**Rationale**: The spec explicitly calls for manual flagging for v1. Automated dispute resolution requires transaction data to tune rules and is high-risk when wrong. Campus context (same building, verified identities) makes admin review fast and low-cost. `disputed` state prevents auto-cancel timers from firing during review.
**Alternatives considered**: No dispute state — support tickets only (eliminated — loses structured data, can't measure dispute rate); automated resolution — buyer always wins (eliminated — creates seller churn); in-app mediation chat (deferred to v2).

---

### Concurrent Order Race Conditions (Last Item)

**Decision**: Atomic database-level quantity decrement: `UPDATE listings SET quantity = quantity - 1 WHERE id = ? AND quantity > 0`. Order is only created if exactly 1 row is affected. If 0 rows affected, return HTTP 409 Conflict: "This item just sold out."
**Rationale**: Dorm snack volumes are low (single-digit quantities typical). A lightweight atomic decrement is safe, simple, and requires no additional infrastructure. Optimistic locking at the DB layer prevents the TOCTOU race condition.
**Alternatives considered**: `SELECT FOR UPDATE` pessimistic lock (eliminated — holds lock during network round-trips, overkill); reservation/hold system (eliminated — appropriate for concert tickets, not dorm snacks); application-layer check (eliminated — classic TOCTOU race condition).

---

## Dual Payment Method

### Modeling `payment_method` on Order

**Decision**: `payment_method` enum column (`cash | stripe`) on Order, immutable after creation. Separate `payment_status` enum (`not_applicable | authorized | captured | refunded | voided`). Cash orders always have `payment_status = not_applicable`.
**Rationale**: Separating "how" (`payment_method`) from "what state" (`payment_status`) cleanly handles the asymmetry between cash (no lifecycle) and Stripe (full lifecycle). Storing both on Order is sufficient for v1; a normalized Payment table is premature at this scale.
**Alternatives considered**: Boolean `is_cash_payment` (eliminated — adds a second field if a third payment type is added); Stripe status strings directly (eliminated — couples data model to Stripe's API contract).

---

### Per-Listing Seller Payment Restrictions

**Decision**: `accepted_payment_methods` as a `text[]` array column on Listing, defaulting to `['cash', 'stripe']`. Validated at order creation — if buyer's chosen method is not in the array, return HTTP 422 Validation Error. Exposed as a multi-select toggle in the listing creation form.
**Rationale**: FR-014 explicitly requires per-listing seller restrictions. Array column is the simplest implementation. Default to both accepted = zero friction for sellers who don't care. Enforcement at order creation on the backend (not just client-side).
**Alternatives considered**: Seller-level preference not per-listing (eliminated — less flexible); separate `ListingPaymentMethod` join table (eliminated — unnecessary for a two-value set); UI-only enforcement (eliminated — never enforce only on client).

---

### Cash Cancellation Refund Flow

**Decision**: No in-app action. Update order status to `cancelled`, notify both parties with explicit copy: "No payment was processed — you owe nothing." Log cancellation reason.
**Rationale**: Cash orders are outside the payment system by design (FR-014: "the system records the agreed payment method but no money changes hands in-app"). If a buyer pre-paid cash in person before cancellation, that is a party dispute handled via the flag mechanism.
**Alternatives considered**: Issue in-app credit/voucher (eliminated — no wallet system in v1); prompt parties to confirm no money changed hands (eliminated — not enforceable, adds friction); unify with Stripe refund flow (eliminated — would call Stripe APIs for orders that never touched Stripe).
