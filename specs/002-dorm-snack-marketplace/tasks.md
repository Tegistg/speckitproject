# Tasks: Dorm Snack Marketplace

**Input**: Design documents from `/specs/002-dorm-snack-marketplace/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Paths follow plan.md structure: `api/` (Fastify + TypeScript backend), `mobile/` (Expo React Native)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize both project directories and shared tooling

- [ ] T001 Create `api/` project with Node.js 20 + Fastify 4 + TypeScript 5 (`package.json`, `tsconfig.json`, `src/` structure per plan.md)
- [ ] T002 Create `mobile/` project with Expo SDK 51 + React Native + TypeScript (`app.json`, `tsconfig.json`, `src/` structure per plan.md)
- [ ] T003 [P] Configure ESLint + Prettier for `api/` in `api/.eslintrc.json` and `api/.prettierrc`
- [ ] T004 [P] Configure ESLint + Prettier for `mobile/` in `mobile/.eslintrc.json` and `mobile/.prettierrc`
- [ ] T005 Setup Prisma 5 in `api/` with Supabase PostgreSQL connection (`api/prisma/schema.prisma`, `api/src/lib/prisma.ts`)
- [ ] T006 Setup Jest + Supertest for `api/tests/` (`api/jest.config.ts`, `api/tests/setup.ts`)
- [ ] T007 [P] Setup Jest + React Native Testing Library for `mobile/tests/` (`mobile/jest.config.ts`, `mobile/tests/setup.ts`)
- [ ] T008 Create `.env.example` files for `api/` and `mobile/` with all variables from `quickstart.md`

**Checkpoint**: Both projects scaffold, lint, and test runner execute without errors

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure required by ALL user stories — no story work begins until complete

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T009 Define full Prisma schema (User, Listing, Order, Rating entities per `data-model.md`) in `api/prisma/schema.prisma`
- [ ] T010 Run initial Prisma migration to create all tables; add GIN index on `search_vector`, B-tree indexes on `seller_id` and `status` in `api/prisma/migrations/`
- [ ] T011 Implement Supabase Auth JWT verification middleware in `api/src/middleware/auth.ts`
- [ ] T012 [P] Implement university email domain validation middleware (configurable domain via env) in `api/src/middleware/emailDomain.ts`
- [ ] T013 Bootstrap Fastify server with CORS, helmet, error handler, and route registration in `api/src/server.ts` and `api/src/app.ts`
- [ ] T014 [P] Initialize Cloudinary client singleton in `api/src/lib/cloudinary.ts`
- [ ] T015 [P] Initialize Stripe client + Stripe Connect helpers in `api/src/lib/stripe.ts`
- [ ] T016 [P] Initialize Expo Push Notifications client in `api/src/lib/expoPush.ts`
- [ ] T017 Implement auth service (register with domain check, email verification, login, refresh) in `api/src/services/authService.ts`
- [ ] T018 Implement auth routes (POST /auth/register, /auth/login, /auth/refresh, /auth/logout) per `contracts/auth.yaml` in `api/src/routes/auth.ts`
- [ ] T019 Setup React Native app with Stack + Tab navigation and auth gate in `mobile/src/App.tsx` and `mobile/src/navigation/index.tsx`
- [ ] T020 [P] Implement Login screen with email/password form in `mobile/src/screens/Login.tsx`
- [ ] T021 [P] Implement Register screen with university email validation feedback in `mobile/src/screens/Register.tsx`
- [ ] T022 Implement auth API service with JWT storage via `expo-secure-store` and token refresh logic in `mobile/src/services/authService.ts`

**Checkpoint**: Users can register (university email only), verify, log in, and receive a JWT — all other features gate on this

---

## Phase 3: User Story 1 — Browse and Purchase Snacks (Priority: P1) 🎯 MVP

**Goal**: Buyer browses the feed, views a listing, places an order, seller confirms, buyer receives pickup notification

**Independent Test**: Register as buyer + seeded seller account; browse feed, tap "Order", verify seller gets push notification, seller confirms, buyer notified with pickup details

### Implementation

- [ ] T023 [P] [US1] Implement `ListingService.getFeed()` (active listings, cursor pagination) in `api/src/services/listingService.ts`
- [ ] T024 [P] [US1] Implement `ListingService.getById()` in `api/src/services/listingService.ts`
- [ ] T025 [US1] Implement GET /listings and GET /listings/:id routes per `contracts/listings.yaml` in `api/src/routes/listings.ts`
- [ ] T026 [P] [US1] Implement `OrderService.createOrder()` with atomic quantity decrement (`UPDATE ... WHERE quantity > 0`, HTTP 409 on conflict) in `api/src/services/orderService.ts`
- [ ] T027 [US1] Implement POST /orders route (validates buyer ≠ seller, payment_method accepted by listing) per `contracts/orders.yaml` in `api/src/routes/orders.ts`
- [ ] T028 [US1] Implement GET /orders/:id route (caller must be buyer or seller) in `api/src/routes/orders.ts`
- [ ] T029 [US1] Implement `OrderService.transitionStatus()` for pending → confirmed (sets pickup_location, triggers buyer push) and pending → cancelled (seller_rejected) in `api/src/services/orderService.ts`
- [ ] T030 [US1] Implement PATCH /orders/:id/status route (seller confirms/rejects) per `contracts/orders.yaml` in `api/src/routes/orders.ts`
- [ ] T031 [P] [US1] Implement `ListingCard` component (title, price, photo, seller name + avg_rating) in `mobile/src/components/ListingCard.tsx`
- [ ] T032 [P] [US1] Implement `OrderStatusBadge` component (colour-coded per status) in `mobile/src/components/OrderStatusBadge.tsx`
- [ ] T033 [US1] Implement Feed/Home screen (paginated listing cards, pull-to-refresh) in `mobile/src/screens/Feed.tsx`
- [ ] T034 [US1] Implement ListingDetail screen (full info, "Order" button disabled when sold out) in `mobile/src/screens/ListingDetail.tsx`
- [ ] T035 [US1] Implement OrderConfirmation modal (payment method picker, quantity, total) in `mobile/src/screens/OrderConfirmation.tsx`
- [ ] T036 [US1] Implement BuyerOrderStatus screen (order lifecycle display, pickup details) in `mobile/src/screens/BuyerOrderStatus.tsx`

**Checkpoint**: Full buy-side flow works end-to-end with seeded seller account — US1 independently testable

---

## Phase 4: User Story 2 — List Snacks for Sale (Priority: P2)

**Goal**: Seller creates a snack listing (name, price, quantity, category, optional photo); listing appears in buyer feed

**Independent Test**: Register as seller, submit listing form, verify listing appears in feed immediately; test missing-field validation; test quantity=0 → sold out

### Implementation

- [ ] T037 [P] [US2] Implement `ListingService.createListing()` (validates required fields, sets status based on quantity) in `api/src/services/listingService.ts`
- [ ] T038 [US2] Implement POST /listings route per `contracts/listings.yaml` in `api/src/routes/listings.ts`
- [ ] T039 [P] [US2] Implement `MediaService.uploadPhoto()` (Cloudinary upload, returns URL) in `api/src/services/mediaService.ts`
- [ ] T040 [US2] Implement POST /listings/:id/photo route (multipart upload, 5 MB limit, JPEG/PNG only) in `api/src/routes/listings.ts`
- [ ] T041 [P] [US2] Implement CreateListing screen with form (title, description, price, quantity, category, payment methods toggle) and validation in `mobile/src/screens/CreateListing.tsx`
- [ ] T042 [US2] Integrate `expo-image-picker` for optional photo selection + upload in `mobile/src/screens/CreateListing.tsx`
- [ ] T043 [US2] Implement listing API service (create listing, upload photo) in `mobile/src/services/listingService.ts`
- [ ] T044 [US2] Auto-set listing status to `sold_out` when quantity reaches 0 on create in `api/src/services/listingService.ts`

**Checkpoint**: Seller can create a listing (with or without photo); it appears in the feed; sold-out listings are hidden — US2 independently testable

---

## Phase 5: User Story 3 — Manage Listings and Orders (Priority: P3)

**Goal**: Seller views their listings, edits quantity/price, removes listings; tracks orders through full lifecycle to completion

**Independent Test**: Create listing, place test order, move through all status stages from seller dashboard; verify listing removal cancels pending orders

### Implementation

- [ ] T045 [P] [US3] Implement `ListingService.updateListing()` and `ListingService.removeListing()` (cancels all pending orders on remove) in `api/src/services/listingService.ts`
- [ ] T046 [US3] Implement PATCH /listings/:id and DELETE /listings/:id routes (seller-only authorization) in `api/src/routes/listings.ts`
- [ ] T047 [US3] On listing removal, bulk-cancel all `pending` orders with `cancel_reason = listing_removed` and notify buyers via push in `api/src/services/listingService.ts`
- [ ] T048 [P] [US3] Implement GET /users/me/orders route (role filter: buyer|seller, status filter, pagination) per `contracts/orders.yaml` in `api/src/routes/orders.ts`
- [ ] T049 [US3] Implement confirmed → ready_for_pickup transition (seller; push buyer) in `api/src/services/orderService.ts` and `api/src/routes/orders.ts`
- [ ] T050 [US3] Implement ready_for_pickup → completed transition (both parties confirm; triggers rating prompt push) in `api/src/services/orderService.ts`
- [ ] T051 [US3] Implement order auto-cancel background job: warn seller push at `auto_cancel_at - 15 min`, cancel order at `auto_cancel_at` if still `pending`, void Stripe PaymentIntent if applicable in `api/src/services/orderTimeoutJob.ts`
- [ ] T052 [P] [US3] Implement SellerDashboard screen (active listings with quantity + order count) in `mobile/src/screens/SellerDashboard.tsx`
- [ ] T053 [P] [US3] Implement EditListing screen (update quantity, price, availability) in `mobile/src/screens/EditListing.tsx`
- [ ] T054 [US3] Implement SellerOrderList screen (incoming orders by status) in `mobile/src/screens/SellerOrderList.tsx`
- [ ] T055 [US3] Implement OrderActions screen (seller: confirm/reject/mark ready; buyer: cancel; both: mark done) in `mobile/src/screens/OrderActions.tsx`
- [ ] T056 [US3] Register Expo Push Token with API on app launch in `mobile/src/services/notificationService.ts` (PATCH /users/me)

**Checkpoint**: Full order lifecycle (pending → confirmed → ready → completed) and listing management work from seller dashboard — US3 independently testable

---

## Phase 6: User Story 4 — Search and Filter Listings (Priority: P4)

**Goal**: Buyer finds listings by keyword, category, or price range; empty-state shown when no results match

**Independent Test**: Seed 10+ listings; verify keyword search returns correct subset; price filter returns only matching range; empty query shows "no results"

### Implementation

- [ ] T057 [P] [US4] Add `search_vector` computed column and `tsvector` auto-update trigger on `title` + `description` to Listing in `api/prisma/migrations/`
- [ ] T058 [P] [US4] Implement full-text keyword search (`tsvector` query) in `ListingService.getFeed()` in `api/src/services/listingService.ts`
- [ ] T059 [US4] Add `q`, `category`, `min_price_cents`, `max_price_cents` query param handling to GET /listings in `api/src/routes/listings.ts`
- [ ] T060 [P] [US4] Implement `SearchBar` component with debounced input in `mobile/src/components/SearchBar.tsx`
- [ ] T061 [P] [US4] Implement `FilterPanel` component (category chips + price range slider) in `mobile/src/components/FilterPanel.tsx`
- [ ] T062 [US4] Update Feed screen to integrate SearchBar and FilterPanel, pass params to API in `mobile/src/screens/Feed.tsx`
- [ ] T063 [US4] Implement `EmptyState` component ("No results for…" with clear-filters action) in `mobile/src/components/EmptyState.tsx`

**Checkpoint**: Keyword + category + price filter all return correct subsets; empty state renders — US4 independently testable with 10-listing seed set

---

## Phase 7: User Story 5 — Ratings and Reputation (Priority: P5)

**Goal**: After order completion, buyer and seller each submit a 1–5 star rating; ratings appear on profiles with averaged score; "No ratings yet" shown for unrated users

**Independent Test**: Complete a transaction, verify both parties see rating prompt, submit ratings, confirm they appear on respective profiles and avg_rating is updated

### Implementation

- [ ] T064 [P] [US5] Implement `RatingService.submitRating()` (validates order is completed, one rating per party, `UNIQUE(order_id, rater_id)`) in `api/src/services/ratingService.ts`
- [ ] T065 [US5] Implement POST /ratings route per `contracts/ratings.yaml` in `api/src/routes/ratings.ts`
- [ ] T066 [P] [US5] Implement `UserService.getProfile()`, `UserService.updateProfile()`, and avg_rating recomputation trigger on new Rating in `api/src/services/userService.ts`
- [ ] T067 [US5] Implement GET /users/me and PATCH /users/me routes per `contracts/users.yaml` in `api/src/routes/users.ts`
- [ ] T068 [US5] Implement GET /users/:id and GET /users/:id/ratings routes in `api/src/routes/users.ts`
- [ ] T069 [US5] Implement GET /users/:id/listings route in `api/src/routes/users.ts`
- [ ] T070 [P] [US5] Implement `StarRating` component (interactive submit mode + read-only display mode) in `mobile/src/components/StarRating.tsx`
- [ ] T071 [P] [US5] Implement `RatingModal` (stars + optional comment, submit button) in `mobile/src/components/RatingModal.tsx`
- [ ] T072 [US5] Trigger `RatingModal` after both parties mark order completed in `mobile/src/screens/BuyerOrderStatus.tsx` and `mobile/src/screens/OrderActions.tsx`
- [ ] T073 [US5] Implement UserProfile screen (avatar, avg_rating, completed_transaction_count, listings, ratings list) in `mobile/src/screens/UserProfile.tsx`
- [ ] T074 [US5] Implement rating API service (submit, fetch user ratings) in `mobile/src/services/ratingService.ts`
- [ ] T075 [US5] Display "No ratings yet" (not a score of 0) when `avg_rating` is null in `mobile/src/screens/UserProfile.tsx`

**Checkpoint**: Both parties can rate after completion; profile shows averaged score or "No ratings yet" — US5 independently testable

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Stripe payouts, dispute flow, UX hardening, seed data, and final validation

- [ ] T076 [P] Implement Stripe Connect Express seller onboarding (POST /users/me/stripe/onboard returns hosted URL) in `api/src/routes/users.ts` and `api/src/services/stripeService.ts`
- [ ] T077 [P] Implement Stripe webhook handler (PaymentIntent authorized/captured/voided/refunded events) in `api/src/routes/webhooks.ts`
- [ ] T078 Implement order dispute transition (any non-terminal state → disputed, requires dispute_reason; pauses auto-cancel) in `api/src/services/orderService.ts` and `api/src/routes/orders.ts`
- [ ] T079 [P] Implement avatar upload handler (POST /users/me/avatar via Cloudinary) in `api/src/routes/users.ts` and `api/src/services/mediaService.ts`
- [ ] T080 [P] Add skeleton loading components for Feed and ListingDetail screens in `mobile/src/components/SkeletonCard.tsx`
- [ ] T081 [P] Add `ErrorBoundary` component and network error toast handling in `mobile/src/components/ErrorBoundary.tsx`
- [ ] T082 Verify cursor-based pagination is consistent across GET /listings and GET /users/me/orders (both use same cursor pattern)
- [ ] T083 Create database seed file with 3 users, 10 listings, 2 completed orders with ratings, 1 pending order per `quickstart.md` in `api/prisma/seed.ts`
- [ ] T084 [P] Add `completed_transaction_count` increment to `OrderService` when order reaches `completed` in `api/src/services/orderService.ts`
- [ ] T085 Run full quickstart.md validation: fresh install → seed → end-to-end browse/order/confirm/complete/rate flow passes

**Checkpoint**: All 5 user stories functional, Stripe payouts wired, disputes handled, seed data loads, quickstart validated

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no dependency on US2–US5
- **US2 (Phase 4)**: Depends on Phase 2 — no dependency on US1 (Listing entity is in Foundational)
- **US3 (Phase 5)**: Depends on Phase 2; integrates with US1 order routes and US2 listing routes
- **US4 (Phase 6)**: Depends on Phase 3 (extends GET /listings); no dependency on US2/US3/US5
- **US5 (Phase 7)**: Depends on Phase 3 (requires completed Order); no dependency on US2/US3/US4
- **Polish (Phase 8)**: Depends on all desired user stories

### User Story Dependencies

| Story | Depends on | Notes |
|---|---|---|
| US1 (P1) | Phase 2 only | Core buy-side flow; no story dependencies |
| US2 (P2) | Phase 2 only | Core sell-side creation; no story dependencies |
| US3 (P3) | Phase 2, US1 routes, US2 routes | Extends order transitions from US1; extends listing CRUD from US2 |
| US4 (P4) | Phase 3 (US1) | Extends GET /listings added in US1 |
| US5 (P5) | Phase 3 (US1) | Requires a completed Order to rate |

### Within Each User Story

- API service → API route → Mobile service → Mobile screen
- Models and services with no inter-dependencies within a story can run in parallel [P]

### Parallel Opportunities Per Story

```
US1 parallel batch 1 (API):  T023, T024, T026, T031, T032
US1 parallel batch 2 (API):  T025 (after T023/T024), T027–T030 (after T026)
US1 parallel batch 3 (mobile): T033, T034 (after T031)
US1 sequential:              T035, T036 (after T033/T034)

US2 parallel batch 1:        T037, T039, T041
US2 sequential:              T038 (after T037), T040 (after T039), T042 (after T041)

US3 parallel batch 1:        T045, T048, T052, T053
US3 sequential:              T046, T047 (after T045), T049, T050, T051 (after T048)

US4 parallel batch 1:        T057, T058, T060, T061
US4 sequential:              T059 (after T057/T058), T062 (after T060/T061)

US5 parallel batch 1:        T064, T066, T070, T071
US5 sequential:              T065 (after T064), T067–T069 (after T066), T072–T075 (after T070/T071)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — **CRITICAL, blocks everything**
3. Complete Phase 3: US1 (Browse and Purchase)
4. **STOP and VALIDATE**: Full buy-side flow works with seeded seller
5. Demo / share for feedback

### Incremental Delivery

1. Setup + Foundational → auth + DB ready
2. US1 → buyers can browse and order → **MVP**
3. US2 → sellers can list → marketplace supply side
4. US3 → sellers can manage inventory + orders → operational
5. US4 → discovery at scale → growth feature
6. US5 → trust layer → retention feature
7. Polish → production-ready

### Parallel Team Strategy

With 3 developers after Foundational is done:
- **Dev A**: US1 (browse + purchase)
- **Dev B**: US2 (listing creation)
- **Dev C**: Infrastructure (background jobs, Stripe webhooks)

---

## Summary

| Phase | Tasks | Parallelizable |
|---|---|---|
| Phase 1: Setup | T001–T008 (8) | 4 |
| Phase 2: Foundational | T009–T022 (14) | 5 |
| Phase 3: US1 Browse & Purchase | T023–T036 (14) | 5 |
| Phase 4: US2 List Snacks | T037–T044 (8) | 3 |
| Phase 5: US3 Manage | T045–T056 (12) | 4 |
| Phase 6: US4 Search & Filter | T057–T063 (7) | 4 |
| Phase 7: US5 Ratings | T064–T075 (12) | 4 |
| Phase 8: Polish | T076–T085 (10) | 5 |
| **Total** | **85 tasks** | **34 parallelizable** |

---

## Notes

- [P] tasks touch different files and have no dependency on incomplete tasks in the same phase
- [Story] label maps every task to its user story for traceability back to spec.md
- Each user story phase is independently completable and testable without the next story
- No test tasks generated (not requested in spec) — add TDD tasks if adopting test-first approach
- Commit after each checkpoint; do not merge phases with failing API or mobile builds
