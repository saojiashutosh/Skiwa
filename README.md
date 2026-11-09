# SKIWAA — Wear Your Energy

Full-stack e-commerce platform for the SKIWAA premium streetwear brand.
**Minimal · Bold · Timeless** — dark-first editorial design inspired by anime, typography and art.

| Layer      | Stack                                                                              |
| ---------- | ---------------------------------------------------------------------------------- |
| Frontend   | Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Framer Motion · TanStack Query · React Hook Form · Zod |
| Backend    | Django 5.2 · Django REST Framework · SimpleJWT · Celery · Redis · PostgreSQL       |
| Payments   | Razorpay (provider-abstracted — Stripe-ready)                                       |
| Media      | Cloudinary (URL-only storage)                                                       |
| DevOps     | Docker · docker-compose · Nginx · GitHub Actions                                    |

---

## Repository layout

```
skiwaa/
├── backend/                  # Django REST API
│   ├── config/               # settings, urls, celery, wsgi/asgi
│   ├── apps/
│   │   ├── accounts/         # custom User (email login), addresses, JWT auth flows
│   │   ├── products/         # Category, Product, Variant, Color, Size, Inventory
│   │   ├── collections/      # Drops (Shadows & Souls, Neo Tokyo, Ronin)
│   │   ├── cart/             # server cart + guest-cart merge
│   │   ├── wishlist/         # per-user wishlist
│   │   ├── coupons/          # percent/fixed coupons with limits & windows
│   │   ├── shipping/         # shipping methods + estimates
│   │   ├── orders/           # order lifecycle, stock reservation, cancel/return
│   │   ├── payments/         # Razorpay provider + webhook (Stripe-ready interface)
│   │   ├── reviews/          # verified-purchase reviews
│   │   └── core/             # banners, newsletter, contact, shared email tasks
│   ├── templates/emails/     # branded transactional email templates
│   ├── tests/                # pytest suite (30 tests)
│   └── Dockerfile
├── frontend/                 # Next.js storefront
│   ├── src/app/              # 25 routes (home, shop, PDP, checkout, account, …)
│   ├── src/components/       # ui primitives, layout, home sections, product, motion
│   ├── src/context/          # auth / cart / wishlist providers
│   ├── src/hooks/            # TanStack Query hooks
│   ├── src/lib/              # axios client w/ JWT refresh, types, Razorpay loader
│   └── Dockerfile
├── nginx/nginx.conf          # reverse proxy for docker-compose
├── docker-compose.yml        # db + redis + backend + celery + beat + frontend + nginx
└── .github/workflows/ci.yml  # backend pytest + frontend lint/test/build
```

---

## Quick start (local development)

### 1. Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows  (source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
copy .env.example .env            # then edit values (defaults work for local dev)
python manage.py migrate
python manage.py seed_demo        # loads 3 drops, 12 products, 71 variants, coupons, banners
python manage.py createsuperuser
python manage.py runserver        # → http://localhost:8000
```

- API docs (Swagger): `http://localhost:8000/api/docs/`
- Admin panel: `http://localhost:8000/admin/`

Without a `DATABASE_URL` the backend falls back to SQLite, and without SMTP creds
emails print to the console — so local dev needs **zero external services**.
Redis is optional locally (cache errors are swallowed); Celery tasks can run inline by
setting `CELERY_TASK_ALWAYS_EAGER=True` in `.env`.

To run the async workers for real:

```bash
celery -A config worker -l info      # terminal 2
celery -A config beat -l info        # terminal 3 (scheduled jobs)
```

### 2. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local      # set NEXT_PUBLIC_API_URL / NEXT_PUBLIC_RAZORPAY_KEY_ID
npm run dev                       # → http://localhost:3000
```

### 3. Docker (everything at once)

```bash
copy backend\.env.example backend\.env    # fill in secrets first
docker compose up --build
```

Nginx serves the whole stack at `http://localhost` — Next.js at `/`, Django at `/api/` and `/admin/`.
Then seed inside the container:

```bash
docker compose exec backend python manage.py seed_demo
docker compose exec backend python manage.py createsuperuser
```

---

## Testing

```bash
# Backend — 30 tests (auth, products, cart, coupons, orders, stock)
cd backend && pytest

# Frontend — vitest (utils + components)
cd frontend && npm test

# Frontend production build check
cd frontend && npm run build
```

CI (GitHub Actions) runs all of the above on every push/PR to `main`.

---

## Environment variables

### Backend (`backend/.env`)

| Variable | Purpose |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django crypto key — long random string |
| `DJANGO_DEBUG` | `False` in production |
| `DJANGO_ALLOWED_HOSTS` | comma-separated hosts |
| `DJANGO_CSRF_TRUSTED_ORIGINS` | e.g. `https://skiwaa.in` |
| `DATABASE_URL` | `postgres://…` (Neon in production; SQLite fallback if empty) |
| `REDIS_URL` | Redis for cache + Celery broker |
| `CORS_ALLOWED_ORIGINS` | frontend origin(s) |
| `FRONTEND_URL` | used to build email links |
| `JWT_ACCESS_LIFETIME_MINUTES` / `JWT_REFRESH_LIFETIME_DAYS` | token lifetimes |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | media uploads |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` / `RAZORPAY_WEBHOOK_SECRET` | payments |
| `EMAIL_HOST*`, `DEFAULT_FROM_EMAIL` | SMTP (console backend when empty) |

### Frontend (`frontend/.env.local`)

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Django API base, e.g. `https://api.skiwaa.in/api` |
| `NEXT_PUBLIC_SITE_URL` | public site URL (SEO/sitemap/OG) |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Razorpay **public** key id |

---

## REST API map

```
POST   /api/auth/register|login|logout|token/refresh/
POST   /api/auth/password/forgot|reset/     /api/auth/email/verify|resend/
GET|PATCH /api/profile/                     CRUD /api/profile/addresses/
GET    /api/products/?category=&collection=&color=&size=&min_price=&max_price=&in_stock=&on_sale=&search=&ordering=&page=
GET    /api/products/facets/                /api/products/{slug}/ | related/ | reviews/
GET    /api/categories/    /api/collections/    /api/collections/{slug}/
GET|DELETE /api/cart/      POST /api/cart/items/ | merge/ | coupon/
GET|POST /api/wishlist/    DELETE /api/wishlist/{product_id}/
POST   /api/coupons/validate/
GET    /api/shipping/methods/    POST /api/shipping/estimate/
GET|POST /api/orders/      GET /api/orders/{number}/    POST …/cancel/ | …/return/
POST   /api/payment/razorpay/create/ | verify/          POST /api/payment/webhook/razorpay/
GET    /api/banners/       GET /api/content/  (backend-managed page copy)
POST   /api/newsletter/subscribe/    POST /api/contact/
GET    /api/docs/  (Swagger)   /api/schema/  (OpenAPI)
```

Design notes:
- **All money math is server-side.** The client sends only variant ids + quantities; the
  backend recomputes subtotals, validates coupons, and quotes shipping inside a DB transaction
  with `select_for_update` on inventory rows — no overselling under concurrency.
- **Stock is reserved at order creation** and restored on cancellation or failed payment.
- **Payments are idempotent** — `mark_order_paid` can be called by both the client verify
  endpoint and the Razorpay webhook without double-processing, and the webhook is the safety
  net when a buyer closes the tab mid-payment.
- **Payment providers are pluggable**: implement `PaymentProvider` (create/verify/webhook/refund)
  and register it — Stripe can be added without touching orders or views.

---

## Deployment guide

### Frontend → Vercel

1. Import the repo in Vercel, set **Root Directory** to `frontend/`.
2. Environment variables: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SITE_URL`, `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
3. Deploy — Vercel auto-detects Next.js 15. Done.

### Backend → Railway

1. New Railway project → **Deploy from repo**, root `backend/` (the Dockerfile is picked up automatically; migrations run in the entrypoint).
2. Add a **Redis** plugin, then set `REDIS_URL` from it.
3. Set every backend env var from the table above. Use the Neon connection string for `DATABASE_URL`.
4. Set `DJANGO_DEBUG=False`, `DJANGO_ALLOWED_HOSTS=<railway-domain>,api.skiwaa.in`, `CORS_ALLOWED_ORIGINS=https://<vercel-domain>`.
5. Add two more Railway services from the same repo/root for the workers, overriding the start command:
   - `celery -A config worker --loglevel=info`
   - `celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler`
6. One-time setup via Railway shell: `python manage.py createsuperuser` and (optionally) `python manage.py seed_demo`.

### Database → Neon

Create a Neon PostgreSQL project, copy the pooled connection string into `DATABASE_URL`.
`dj-database-url` + `psycopg3` handle SSL automatically.

### Media → Cloudinary

Create a Cloudinary account and set the three `CLOUDINARY_*` vars. Product images uploaded
via the Django admin go straight to Cloudinary; only URLs are stored in Postgres.

### Payments → Razorpay

1. Generate API keys (test first, then live) → `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET`
   (backend) and `NEXT_PUBLIC_RAZORPAY_KEY_ID` (frontend).
2. In the Razorpay dashboard add a webhook pointing to
   `https://<backend-domain>/api/payment/webhook/razorpay/` with events
   `payment.captured`, `payment.failed`, `refund.processed`, and set the same secret in
   `RAZORPAY_WEBHOOK_SECRET`.

---

## Security checklist (already wired)

- Argon2 password hashing (PBKDF2 fallback) + Django password validators
- JWT with rotation + blacklist on logout; refresh handled by an axios interceptor
- Scoped rate limiting (auth 10/min, newsletter/contact 5/min, payments 30/min, global anon/user caps)
- CORS locked to the frontend origin, CSRF trusted origins, HSTS/secure cookies/SSL redirect in production
- Razorpay signature verification on both the client callback and webhooks
- DRF serializer validation everywhere; enumeration-safe password reset responses
- Order ownership checks; admin-only catalog mutations

## Store management

### Studio — the built-in admin panel (`/studio`)

A private, staff-only management panel inside the storefront, at `http://localhost:3000/studio`.
Sign in with any account that has `is_staff=True` (e.g. your superuser). Non-staff users are
redirected away, and every underlying `/api/manage/` endpoint enforces `IsAdminUser` server-side.

- **Dashboard** — revenue, order counts, customers, low-stock alerts, recent orders
- **Products** — create/edit/delete products; manage images (URL-based), variants
  (color × size) with auto-generated SKUs, and per-variant stock inline
- **Drops & Categories** — full CRUD, featured-drop toggle, visibility
- **Orders** — filter by status, view details, mark processing/shipped/delivered
  with tracking numbers (shipped/delivered email the customer automatically)
- **Coupons** — percent/fixed codes with caps, minimums, usage limits
- **Reviews** — publish/hide/delete customer reviews
- **Content** — hero banners and per-page copy (headings/intros)

### Django admin (`/admin/`)

The classic Django admin remains available for power-user tasks: direct Cloudinary file
uploads, newsletter subscribers, contact messages, user/permission management, and raw
data access.
