# Feature Specification: Dorm Snack Marketplace

**Feature Branch**: `002-dorm-snack-marketplace`  
**Created**: 2026-04-29  
**Status**: Draft  
**Input**: User description: "dorm snack marketplace"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse and Purchase Snacks (Priority: P1)

A buyer (dorm resident) opens the marketplace, browses available snack listings from fellow students, selects an item, and places an order. The seller receives a notification and confirms the order. The buyer and seller coordinate pickup.

**Why this priority**: This is the core value loop — without the ability to discover and purchase snacks, the marketplace has no purpose. Everything else builds on this flow.

**Independent Test**: Can be fully tested by registering as a buyer, viewing the listing feed, and completing a purchase from a seeded seller account — delivers a functional end-to-end transaction.

**Acceptance Scenarios**:

1. **Given** a buyer is logged in, **When** they open the marketplace home, **Then** they see a feed of available snack listings with name, price, seller, and photo
2. **Given** a buyer views a listing, **When** they tap "Order", **Then** an order is created and the seller receives a notification
3. **Given** an order is placed, **When** the seller confirms it, **Then** the buyer is notified with pickup details
4. **Given** an item is out of stock, **When** a buyer views the listing, **Then** it is marked unavailable and cannot be ordered

---

### User Story 2 - List Snacks for Sale (Priority: P2)

A seller (dorm resident) creates a new snack listing by entering a name, description, price, quantity, and optionally uploading a photo. The listing becomes visible to all marketplace buyers.

**Why this priority**: Without sellers listing snacks, buyers have nothing to purchase. Listing is the supply side of the marketplace and must be robust before buyer features are fully usable.

**Independent Test**: Can be fully tested by registering as a seller and creating a listing — the listing should appear in the buyer feed immediately.

**Acceptance Scenarios**:

1. **Given** a seller is logged in, **When** they fill out and submit the listing form, **Then** the listing appears in the public feed
2. **Given** a seller submits a listing without a required field (name or price), **When** they attempt to save, **Then** they see a clear validation error
3. **Given** a seller uploads a photo, **When** the listing is published, **Then** the photo is displayed in the feed
4. **Given** a seller sets quantity to 0, **When** the listing is saved, **Then** it is marked as sold out and not shown to buyers

---

### User Story 3 - Manage Listings and Orders (Priority: P3)

A seller views their active listings, updates quantity or price, marks items as sold out, and tracks incoming orders through their lifecycle (pending → confirmed → ready for pickup → completed).

**Why this priority**: Sellers need control over their inventory and order pipeline. Without this, listings become stale and the marketplace loses trust.

**Independent Test**: Can be tested by creating a listing, placing a test order, and moving it through all status stages from the seller dashboard.

**Acceptance Scenarios**:

1. **Given** a seller has active listings, **When** they open their dashboard, **Then** they see all listings with current quantity and order count
2. **Given** a seller updates the quantity on a listing, **When** they save, **Then** the listing feed reflects the new quantity immediately
3. **Given** an order is in "pending" state, **When** the seller confirms it, **Then** the order moves to "confirmed" and the buyer is notified
4. **Given** an order is completed, **When** both parties mark it done, **Then** both are prompted to leave a rating

---

### User Story 4 - Search and Filter Listings (Priority: P4)

A buyer searches for a specific snack by name or filters listings by category (savory, sweet, drinks, etc.) or price range to find what they want quickly.

**Why this priority**: As the marketplace grows, discovery becomes critical. Without search, buyers must scroll through all listings.

**Independent Test**: Can be tested with at least 10 seeded listings by verifying that keyword search and price filter return the correct subset.

**Acceptance Scenarios**:

1. **Given** a buyer types a keyword, **When** they submit the search, **Then** only listings matching the keyword (name or description) are shown
2. **Given** a buyer selects a price range filter, **When** applied, **Then** only listings within that range are displayed
3. **Given** no listings match the search, **When** results are empty, **Then** a helpful "no results" message is shown

---

### User Story 5 - Ratings and Reputation (Priority: P5)

After a transaction is marked complete, both the buyer and seller can rate the other party (1–5 stars, optional comment). Ratings are displayed on user profiles and listing cards.

**Why this priority**: Trust is essential in peer-to-peer commerce. Ratings allow users to make informed decisions. This is a quality-of-life feature that improves over time.

**Independent Test**: Can be tested by completing a transaction and verifying that both parties can submit a rating, which then appears on their respective profiles.

**Acceptance Scenarios**:

1. **Given** an order is completed, **When** the buyer opens the order, **Then** they see a rating prompt for the seller
2. **Given** a user submits a rating, **When** saved, **Then** it is visible on the rated user's profile and averaged into their score
3. **Given** a user has no ratings yet, **When** their profile is viewed, **Then** it shows "No ratings yet" rather than a score of 0

---

### Edge Cases

- What happens when a buyer places an order but the seller does not respond within a reasonable time window?
- How does the system handle a seller who lists more quantity than they actually have?
- What happens if a buyer cancels an order after the seller has already confirmed?
- How are disputes between buyers and sellers handled?
- What happens when a user attempts to purchase their own listing?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Users MUST be able to register for an account and log in to access the marketplace
- **FR-002**: Sellers MUST be able to create snack listings with name, description, price, available quantity, category, and an optional photo
- **FR-003**: Buyers MUST be able to browse all in-stock snack listings in a feed view
- **FR-004**: Buyers MUST be able to search listings by keyword and filter by category and price range
- **FR-005**: Buyers MUST be able to place orders for available snacks
- **FR-006**: Users MUST NOT be able to purchase their own listings
- **FR-007**: The system MUST notify sellers when a new order is placed for their listing
- **FR-008**: Sellers MUST be able to confirm, reject, or mark orders as ready for pickup
- **FR-009**: The system MUST track order status through: pending → confirmed → ready for pickup → completed
- **FR-010**: Sellers MUST be able to update listing quantity, price, and availability at any time
- **FR-011**: Sellers MUST be able to remove a listing, which cancels any pending orders for it
- **FR-012**: After order completion, both buyer and seller MUST be able to leave a 1–5 star rating with an optional comment
- **FR-013**: User profiles MUST display average rating and number of completed transactions
- **FR-014**: The system MUST support two payment methods: (A) cash-on-pickup coordination — the system records the agreed payment method but no money changes hands in-app; and (B) in-app payments via a third-party payment processor. Buyers choose their preferred method at checkout; sellers may restrict which methods they accept on a per-listing basis.
- **FR-015**: The system MUST restrict access to verified campus dorm residents only. Verification is performed via university email domain at registration; only accounts with a valid university email address may join the marketplace.

### Key Entities

- **User**: A marketplace participant with a profile, rating history, and role (buyer and/or seller)
- **Listing**: A snack item posted for sale with name, description, price, quantity, category, photo, and status
- **Order**: A purchase transaction linking a buyer to a listing, with a lifecycle status
- **Rating**: A 1–5 star review left by one party on another after a completed order

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can complete the full flow — browse, order, and receive a snack — within 5 minutes of first use
- **SC-002**: Sellers can create a new listing in under 2 minutes
- **SC-003**: Search returns relevant results in under 2 seconds for any query
- **SC-004**: 80% or more of orders placed reach a "completed" status (measuring marketplace reliability)
- **SC-005**: At least 60% of completed transactions receive a rating within 24 hours
- **SC-006**: The marketplace can support at least 500 concurrent users without degraded performance

## Assumptions

- Users have stable internet connectivity via campus Wi-Fi
- All users are members of the same university community (email domain verification is sufficient for v1)
- Pickup occurs in-person within the dorm building or a designated campus meeting point — the system coordinates but does not handle physical logistics
- One user can act as both buyer and seller simultaneously
- Moderation of listings is manual (flagging mechanism) for v1; automated content filtering is out of scope
- Push or in-app notifications are supported on the target platform
- Photo uploads are optional — listings without photos are still valid and visible
- Mobile-first design; a web interface is out of scope for v1
