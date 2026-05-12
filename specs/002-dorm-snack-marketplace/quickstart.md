# Quickstart: Dorm Snack Marketplace

**Date**: 2026-05-12 | **Plan**: [plan.md](./plan.md)

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| Node.js | 20 LTS | https://nodejs.org |
| npm | 10+ | bundled with Node |
| Expo CLI | latest | `npm install -g expo-cli` |
| PostgreSQL | 15 | via Supabase (hosted) or local Docker |
| Git | any | system |

---

## Services to Configure

Before running anything, create free-tier accounts for:

| Service | Purpose | Key values needed |
|---|---|---|
| [Supabase](https://supabase.com) | PostgreSQL + Auth | Project URL, anon key, service role key |
| [Cloudinary](https://cloudinary.com) | Photo storage + CDN | Cloud name, API key, API secret |
| [Stripe](https://stripe.com) | In-app payments | Publishable key, secret key, webhook secret |
| Expo account | Push notifications | No API key needed; Expo Push Token per device |

---

## Repository Setup

```bash
# Clone and install
git clone <repo-url>
cd <repo-root>

# Backend
cd api
cp .env.example .env       # fill in values from Services section
npm install
npx prisma migrate dev     # creates all tables
npx prisma db seed         # loads test fixtures

# Mobile
cd ../mobile
cp .env.example .env       # fill in EXPO_PUBLIC_API_URL
npm install
```

---

## Environment Variables

### `api/.env`

```env
DATABASE_URL=postgresql://postgres:<password>@<supabase-host>:5432/postgres
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
UNIVERSITY_EMAIL_DOMAIN=university.edu
JWT_SECRET=<long-random-secret>

CLOUDINARY_CLOUD_NAME=<cloud-name>
CLOUDINARY_API_KEY=<api-key>
CLOUDINARY_API_SECRET=<api-secret>

STRIPE_SECRET_KEY=sk_test_<key>
STRIPE_WEBHOOK_SECRET=whsec_<key>
STRIPE_PUBLISHABLE_KEY=pk_test_<key>

PORT=3000
NODE_ENV=development
```

### `mobile/.env`

```env
EXPO_PUBLIC_API_URL=http://localhost:3000
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_<key>
```

---

## Running Locally

```bash
# Terminal 1 — API server
cd api
npm run dev
# Fastify starts on http://localhost:3000

# Terminal 2 — Expo dev server
cd mobile
npx expo start
# Scan QR code with Expo Go app on your phone, or press 'i' for iOS simulator / 'a' for Android emulator
```

---

## Running Tests

```bash
# Backend unit + integration tests
cd api
npm test

# Mobile component tests
cd mobile
npm test

# Both (from repo root, if scripts are wired in root package.json)
npm test
```

> Tests require a running test database. The integration test suite uses `DATABASE_URL` pointing to a separate `postgres_test` database. Run `npx prisma migrate deploy` against the test database before the first run.

---

## Stripe Local Webhook Testing

Stripe webhooks must reach your local backend during development:

```bash
# Install Stripe CLI (https://stripe.com/docs/stripe-cli)
stripe listen --forward-to localhost:3000/webhooks/stripe
# Copy the webhook signing secret printed to your terminal into STRIPE_WEBHOOK_SECRET
```

---

## Key API Endpoints (Quick Reference)

| Action | Method | Path |
|---|---|---|
| Register | POST | `/auth/register` |
| Login | POST | `/auth/login` |
| Browse feed | GET | `/listings?q=chips&category=savory` |
| Create listing | POST | `/listings` |
| Place order | POST | `/orders` |
| Confirm order (seller) | PATCH | `/orders/:id/status` `{"status":"confirmed"}` |
| My orders | GET | `/users/me/orders?role=seller` |
| Rate a user | POST | `/ratings` |

Full contracts: [`contracts/`](./contracts/)

---

## Seed Data

After `npx prisma db seed`, the database contains:

- 3 users: `buyer@university.edu`, `seller@university.edu`, `admin@university.edu` (all password: `password123`)
- 10 listings across all categories, various quantities and payment method settings
- 2 completed orders with ratings
- 1 pending order (suitable for testing confirmation flow)

---

## Useful Commands

```bash
# Reset database to clean state
cd api && npx prisma migrate reset

# Generate Prisma client after schema changes
cd api && npx prisma generate

# View database in browser
cd api && npx prisma studio

# Lint + format
npm run lint
npm run format
```
