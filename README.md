# Commerce Marketplace (BazaarHub)

Production-ready e-commerce marketplace with Express + PostgreSQL backend, Next.js frontend, Stripe payments, and RBAC (admin/user roles).

**Repo:** [github.com/karthiksathishjeemain/commerce-marketplace](https://github.com/karthiksathishjeemain/commerce-marketplace)

## Architecture

- **Backend** (`/backend`) — Express 5, TypeScript, Prisma ORM, JWT auth, Stripe Checkout
- **Frontend** (`/frontend`) — Next.js 15, Tailwind CSS, real API integration
- **Database** — External PostgreSQL (you provide the connection string)

## Prerequisites

- Node.js 20+
- PostgreSQL database (hosted or self-managed): [Supabase](https://supabase.com), [Neon](https://neon.tech), AWS RDS, Railway, or your own Postgres instance
- [Stripe](https://stripe.com) account (test mode for development)

## Quick Start

### 1. Set up PostgreSQL

Create a PostgreSQL database and note the connection URL. Examples:

```
# Neon
postgresql://user:password@ep-xxx.region.aws.neon.tech/marketplace?sslmode=require

# Supabase
postgresql://postgres:password@db.xxx.supabase.co:5432/postgres

# Local Postgres you manage yourself
postgresql://user:password@localhost:5432/marketplace
```

### 2. Backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL, JWT_SECRET (32+ chars), STRIPE_SECRET_KEY
npm install
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

API runs at `http://localhost:4000`.

### 3. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

App runs at `http://localhost:3000`.

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | External PostgreSQL connection string |
| `JWT_SECRET` | Random string, minimum 32 characters |
| `JWT_EXPIRES_IN` | Token expiry (default: `7d`) |
| `STRIPE_SECRET_KEY` | Stripe secret key (`sk_test_...` or `sk_live_...`) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret (`whsec_...`) |
| `FRONTEND_URL` | Frontend URL for CORS and Stripe redirects |
| `PORT` | API port (default: `4000`) |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API URL (default: `http://localhost:4000/api`) |

## Stripe Setup

1. Create a [Stripe account](https://dashboard.stripe.com/register) and switch to **Test mode**.
2. Copy your **Secret key** (`sk_test_...`) into `STRIPE_SECRET_KEY`.
3. For local webhook testing, install the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe listen --forward-to localhost:4000/api/webhooks/stripe
```

Copy the webhook signing secret (`whsec_...`) into `STRIPE_WEBHOOK_SECRET`.

4. Use [Stripe test cards](https://stripe.com/docs/testing#cards) at checkout (e.g. `4242 4242 4242 4242`).

For production, create a webhook endpoint in the Stripe Dashboard pointing to `https://your-api-domain.com/api/webhooks/stripe` for the `checkout.session.completed` and `checkout.session.expired` events.

## Seed Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@marketplace.com | Admin@123456 |
| User | demo@marketplace.com | User@123456 |

The seed creates 24 products across 5 categories (Electronics, Fashion, Home & Kitchen, Books, Sports & Fitness).

## Features

- Product catalog with search, filters, sorting, and pagination
- Shopping cart and Stripe Checkout (INR)
- Order tracking with status updates
- User profiles and saved addresses
- Admin dashboard: stats, product CRUD, order management, user role management
- RBAC: `USER` and `ADMIN` roles enforced on API and frontend

## Deploy to Vercel

Deploy **two separate Vercel projects** from this monorepo (one for frontend, one for backend).

### Step 1 — Database

Use [Neon](https://neon.tech) or [Supabase](https://supabase.com) for PostgreSQL. Run schema + seed once from your machine:

```bash
cd backend
cp .env.example .env   # set DATABASE_URL
npm install
npx prisma db push
npm run db:seed
```

### Step 2 — Deploy backend

> **Important:** In Vercel → Project Settings → **General** → **Root Directory**, set **`backend`** and click Save.  
> If Root Directory is empty or `.`, the build will fail immediately at `npm install`.

1. Go to [vercel.com/new](https://vercel.com/new) → Import `commerce-marketplace` repo
2. Set **Root Directory** to `backend` ← required
3. Framework Preset: **Other**
4. Add environment variables:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your Neon/Supabase connection string |
| `JWT_SECRET` | Random string, 32+ characters |
| `STRIPE_SECRET_KEY` | `sk_test_...` or `sk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | From Stripe Dashboard (see below) |
| `FRONTEND_URL` | Your frontend Vercel URL (update after Step 3) |
| `NODE_ENV` | `production` |

5. Deploy → note your backend URL, e.g. `https://commerce-marketplace-api.vercel.app`

Verify: `https://YOUR-BACKEND-URL/api/health` should return `{"status":"ok",...}`

### Step 3 — Deploy frontend

> Set **Root Directory** to **`frontend`**.

1. New Vercel project → same repo
2. Set **Root Directory** to `frontend` ← required
3. Framework Preset: **Next.js** (auto-detected)
4. Add environment variable:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://YOUR-BACKEND-URL/api` |

5. Deploy → note your frontend URL, e.g. `https://commerce-marketplace.vercel.app`

### Step 4 — Link frontend ↔ backend

Go back to the **backend** Vercel project → Settings → Environment Variables:

- Set `FRONTEND_URL` = `https://YOUR-FRONTEND-URL` (no trailing slash)
- Redeploy the backend

### Step 5 — Stripe webhook (production)

In [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks):

- Endpoint URL: `https://YOUR-BACKEND-URL/api/webhooks/stripe`
- Events: `checkout.session.completed`, `checkout.session.expired`
- Copy the signing secret → set as `STRIPE_WEBHOOK_SECRET` on backend Vercel → redeploy

---

## Production Notes

- Set `NODE_ENV=production` on the backend
- Use strong `JWT_SECRET` and live Stripe keys
- Set `FRONTEND_URL` to your deployed frontend domain
- Run `npm run build && npm start` for both backend and frontend
- Ensure PostgreSQL has SSL enabled for hosted providers (`?sslmode=require`)
- Configure Stripe webhooks on your production API URL

## Scripts

### Backend

```bash
npm run dev          # Development server
npm run build        # Compile TypeScript
npm start            # Production server
npm run db:push      # Push schema to database
npm run db:seed      # Seed products and users
npm run db:studio    # Prisma Studio GUI
```

### Frontend

```bash
npm run dev          # Development server
npm run build        # Production build
npm start            # Production server
```
