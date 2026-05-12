# Data Model: Dorm Snack Marketplace

**Phase**: 1 | **Date**: 2026-05-12 | **Plan**: [plan.md](./plan.md)

---

## Entities

### User

Represents any marketplace participant. A user may act as buyer, seller, or both simultaneously.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `email` | TEXT | UNIQUE, NOT NULL | Must match university domain; verified via Supabase Auth |
| `name` | TEXT | NOT NULL | Display name |
| `avatar_url` | TEXT | nullable | Cloudinary URL |
| `stripe_account_id` | TEXT | nullable | Stripe Connect Express account ID; set on seller onboarding |
| `expo_push_token` | TEXT | nullable | Updated on each app launch |
| `avg_rating` | NUMERIC(3,2) | nullable, CHECK 1–5 | Denormalized; recomputed on each new Rating |
| `completed_transaction_count` | INTEGER | NOT NULL, DEFAULT 0 | Incremented when an Order reaches `completed` |
| `is_active` | BOOLEAN | NOT NULL, DEFAULT TRUE | Soft-delete flag |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Validation rules**:
- `email` domain must match the configured university domain at registration (enforced server-side, not DB-level).
- A user cannot purchase their own listing (enforced at order creation: `buyer_id != listing.seller_id`).

---

### Listing

A snack item posted for sale by a seller.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `seller_id` | UUID | FK → User, NOT NULL | |
| `title` | TEXT | NOT NULL | Displayed in feed and search results |
| `description` | TEXT | nullable | Optional additional detail |
| `price_cents` | INTEGER | NOT NULL, CHECK > 0 | Stored in cents to avoid floating-point issues |
| `quantity` | INTEGER | NOT NULL, CHECK >= 0 | 0 = sold out; listing marked `sold_out` automatically |
| `category` | TEXT | NOT NULL, ENUM | `savory \| sweet \| drinks \| snacks \| other` |
| `status` | TEXT | NOT NULL, ENUM, DEFAULT `active` | `active \| sold_out \| removed` |
| `photo_url` | TEXT | nullable | Cloudinary URL |
| `accepted_payment_methods` | TEXT[] | NOT NULL, DEFAULT `{cash,stripe}` | Validated at order creation |
| `search_vector` | TSVECTOR | computed, indexed | Auto-updated via trigger from `title + description` |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Validation rules**:
- `title` and `price_cents` are required (FR-002).
- When `quantity` is set to 0, `status` is automatically set to `sold_out`.
- A removed listing cancels all associated `pending` orders (FR-011).
- `accepted_payment_methods` must contain at least one value.

**Indexes**:
- `GIN` index on `search_vector` for full-text keyword search (FR-004).
- B-tree index on `seller_id` for seller dashboard queries.
- B-tree index on `status` for feed filtering.

---

### Order

A purchase transaction linking a buyer to a listing.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `listing_id` | UUID | FK → Listing, NOT NULL | |
| `buyer_id` | UUID | FK → User, NOT NULL | |
| `seller_id` | UUID | FK → User, NOT NULL | Denormalized from Listing for efficient seller queries |
| `quantity_ordered` | INTEGER | NOT NULL, CHECK >= 1 | |
| `unit_price_cents` | INTEGER | NOT NULL | Snapshot of `listing.price_cents` at order time (price-lock) |
| `total_amount_cents` | INTEGER | NOT NULL | `quantity_ordered × unit_price_cents` |
| `status` | TEXT | NOT NULL, ENUM, DEFAULT `pending` | See state machine below |
| `cancel_reason` | TEXT | nullable, ENUM | `buyer_changed_mind \| buyer_unavailable \| seller_rejected \| seller_timeout \| listing_removed \| other` |
| `dispute_reason` | TEXT | nullable, ENUM | `item_not_received \| item_not_as_described \| no_show_buyer \| no_show_seller \| other` |
| `dispute_note` | TEXT | nullable | Free-text note submitted with dispute flag |
| `payment_method` | TEXT | NOT NULL, ENUM | `cash \| stripe` |
| `payment_status` | TEXT | NOT NULL, ENUM | `not_applicable \| authorized \| captured \| refunded \| voided` |
| `stripe_payment_intent_id` | TEXT | nullable | Set for `payment_method = stripe` only |
| `pickup_location` | TEXT | nullable | Agreed pickup point (set by seller on confirmation) |
| `seller_timeout_warning_sent_at` | TIMESTAMPTZ | nullable | Set when 15-min warning push is sent |
| `auto_cancel_at` | TIMESTAMPTZ | NOT NULL | Set to `created_at + 30 minutes`; evaluated by background job |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Order State Machine**:

```
                    ┌──────────┐
         ┌──────────│  pending │──────────────────┐
         │          └────┬─────┘                  │
         │ seller         │ seller confirms         │ auto-cancel (30 min)
         │ rejects        ▼                        │ or listing removed
         │          ┌─────────────┐                │
         │          │  confirmed  │──────────┐     │
         │          └──────┬──────┘          │     │
         │    seller marks │ ready           │     │
         │                 ▼                 │     │
         │          ┌──────────────────┐     │     │
         │          │ ready_for_pickup │     │     │
         │          └───────┬──────────┘     │     │
         │     both confirm │ done           │     │
         │                  ▼                │     │
         │          ┌───────────┐            │     │
         │          │ completed │            │     │
         │          └───────────┘            │     │
         │                                   │     │
         ▼       buyer cancels (until ready) ▼     ▼
    ┌───────────┐◄──────────────────────────────────┘
    │ cancelled │
    └───────────┘
         ▲
         │  either party flags
    ┌────┴────┐
    │disputed │◄── any state except completed/cancelled
    └─────────┘
         │ admin resolves
         ▼
    completed or cancelled
```

**Validation rules**:
- `buyer_id != seller_id` (enforced at order creation; FR-006).
- `payment_method` must be in `listing.accepted_payment_methods`.
- Quantity decrement: `UPDATE listings SET quantity = quantity - 1 WHERE id = ? AND quantity > 0` — atomic; HTTP 409 if 0 rows affected.
- Buyer may not cancel once `status = ready_for_pickup` or terminal (`completed`, `cancelled`, `disputed`).
- `payment_status` transitions are determined by `payment_method`:
  - `cash` → always `not_applicable`
  - `stripe` → `authorized` on creation, `captured` on seller confirmation, `voided` on cancellation before capture, `refunded` on cancellation after capture

---

### Rating

A 1–5 star review left by one party on another after an order reaches `completed`.

| Field | Type | Constraints | Notes |
|---|---|---|---|
| `id` | UUID | PK, auto-generated | |
| `order_id` | UUID | FK → Order, NOT NULL | |
| `rater_id` | UUID | FK → User, NOT NULL | The reviewer |
| `ratee_id` | UUID | FK → User, NOT NULL | The reviewed party |
| `stars` | INTEGER | NOT NULL, CHECK BETWEEN 1 AND 5 | |
| `comment` | TEXT | nullable | Optional free-text |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT now() | |

**Validation rules**:
- Ratings may only be submitted for orders with `status = completed` (FR-012).
- Each party may submit exactly one rating per order (`UNIQUE(order_id, rater_id)`).
- `rater_id` must be either `order.buyer_id` or `order.seller_id`; `ratee_id` is the other party.
- `rater_id != ratee_id`.
- Submitting a Rating triggers recomputation of `User.avg_rating` for the `ratee_id`.

**Indexes**:
- B-tree index on `ratee_id` for profile page queries.
- `UNIQUE(order_id, rater_id)` to prevent duplicate ratings.

---

## Entity Relationships

```
User (1) ──< Listing (seller_id)
User (1) ──< Order (buyer_id)
User (1) ──< Order (seller_id)
Listing (1) ──< Order (listing_id)
Order (1) ──< Rating (order_id)  [0, 1, or 2 ratings per order]
User (1) ──< Rating (rater_id)
User (1) ──< Rating (ratee_id)
```

---

## Background Jobs

The following scheduled/async processes are implied by the data model:

| Job | Trigger | Action |
|---|---|---|
| `order_timeout_warning` | `auto_cancel_at - 15 min` reached | Push notification to seller; set `seller_timeout_warning_sent_at` |
| `order_auto_cancel` | `auto_cancel_at` reached AND `status = pending` | Transition to `cancelled`, `cancel_reason = seller_timeout`; void Stripe PaymentIntent if applicable |
| `listing_soldout_sync` | `quantity` updated to 0 on any Order creation | Set `listing.status = sold_out` |
| `user_rating_recompute` | Rating inserted | Recompute `User.avg_rating` and `completed_transaction_count` for ratee |
