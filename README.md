# 🍌 Banello Business Platform — Complete Deployment Guide

> Premium fresh produce from the breezy mountains of Bugisu · Business operations platform with full auth, rate limiting, and admin security

---

## 5-minute deploy to Vercel

```bash
# 1. Unzip and enter project folder
cd banello

# 2. Install dependencies
npm install

# 3. Copy env file and fill in values
cp .env.example .env.local
# Edit .env.local with your actual secrets

# 4. Test locally
npm run dev
# Opens at http://localhost:3000

# 5. Deploy to Vercel
npx vercel --prod
```

**Set environment variables in Vercel dashboard** (Settings → Environment Variables) before deploying. Never commit `.env.local`.

---

## File structure

```
banello/
├── middleware.ts                     ← Edge middleware: auth + rate limit + security headers
├── public/
│   ├── favicon.svg                   ← Banello banana arc favicon
│   ├── manifest.json                 ← PWA manifest (home screen install)
│   └── robots.txt                    ← Hides /api from search engines
├── src/
│   ├── lib/
│   │   ├── auth.ts                   ← JWT generation, verification, cookie helpers
│   │   ├── AuthContext.tsx           ← React auth context + auto token refresh
│   │   ├── rateLimit.ts              ← In-memory rate limiter (swap to Upstash for prod)
│   │   ├── password.ts               ← bcrypt hashing + strength validation
│   │   └── apiAuth.ts                ← withApiAuth() HOC for protected API routes
│   ├── data/
│   │   └── store.ts                  ← Static data (replace with DB queries in production)
│   ├── pages/
│   │   ├── _app.tsx                  ← App wrapper + AuthProvider
│   │   ├── _document.tsx             ← HTML shell + fonts + PWA meta
│   │   ├── index.tsx                 ← Customer-facing storefront SPA
│   │   ├── login.tsx                 ← Login page with lockout UI + countdown
│   │   ├── admin.tsx                 ← Full admin dashboard (10 sections)
│   │   └── api/
│   │       ├── auth/
│   │       │   ├── login.ts          ← Rate limited login (5/15min, progressive delay)
│   │       │   ├── logout.ts         ← Clears auth cookies
│   │       │   ├── refresh.ts        ← Issues new access token from refresh token
│   │       │   └── session.ts        ← Returns current auth state
│   │       ├── orders.ts             ← Protected orders CRUD API
│   │       └── payments/
│   │           └── pesapal-webhook.ts ← Payment confirmation (signature verified)
│   ├── styles/
│   │   └── globals.css               ← Complete brand + component CSS system
│   └── utils/
│       └── format.ts                 ← UGX formatting, CSV export, calculations
├── .env.example                      ← All required environment variables documented
├── vercel.json                       ← Vercel config + security headers
├── next.config.js                    ← Next.js config
└── tsconfig.json                     ← TypeScript config (es2017 target)
```

---

## Authentication architecture

### Token strategy
| Token | Lifespan | Storage | Purpose |
|-------|----------|---------|---------|
| Access token (JWT) | 15 minutes | HttpOnly cookie | API authentication |
| Refresh token (JWT) | 30 days | HttpOnly cookie (path=/api/auth) | Issue new access tokens |

### Login rate limiting
| Event | Limit | Window | Action on breach |
|-------|-------|--------|-----------------|
| Login attempts | 5 | 15 minutes | 429 + countdown timer in UI |
| Order creation | 10 | 1 minute | 429 |
| General API | 100 | 1 minute | 429 |
| Password reset | 3 | 1 hour | 429 |
| Registration | 5 | 1 hour | 429 |

### Progressive delay on failed logins
Failed attempt 1 → 0s delay
Failed attempt 2 → 1s delay  
Failed attempt 3 → 2s delay  
Failed attempt 4 → 4s delay  
Failed attempt 5 → 8s delay → then rate limit kicks in

### Admin path protection (3 layers)
1. **Non-obvious URL** — `ADMIN_PATH_SLUG` env var (default: `ops-centre-bg2026`)
2. **JWT middleware** — Edge middleware verifies token before page renders
3. **IP allowlist** — `ADMIN_ALLOWED_IPS` blocks unknown IPs with 404 (optional)

---

## Demo credentials (development only)

```
Admin:  admin@banello.ug  /  Banello@2026!
Rider:  rider@banello.ug  /  Banello@2026!
```

**Change these immediately** — replace `DEMO_USERS` in `src/pages/api/auth/login.ts` with a real database query before going live.

---

## Required environment variables

Generate JWT secrets with:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Run this **twice** — one for `JWT_SECRET`, one for `JWT_REFRESH_SECRET`. Never reuse.

See `.env.example` for the full list with descriptions.

---

## Connecting a real database (production)

Replace the static arrays in `src/data/store.ts` with Prisma queries:

```bash
npm install prisma @prisma/client
npx prisma init
# Add your DATABASE_URL to .env.local
# Define schema in prisma/schema.prisma
npx prisma migrate dev
```

Recommended: **Supabase** (free tier, hosted Postgres, built-in auth option, realtime subscriptions for live order updates).

Alternative: **Neon** (serverless Postgres, Vercel integration, free tier).

---

## Upgrading rate limiter to Redis (production)

The current in-memory rate limiter loses state on server restart. For persistent rate limiting across Vercel serverless functions:

```bash
npm install @upstash/ratelimit @upstash/redis
```

```typescript
// Replace limiters.login() in rateLimit.ts with:
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const redis = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL!, token: process.env.UPSTASH_REDIS_REST_TOKEN! })
export const loginLimiter = new Ratelimit({ redis, limiter: Ratelimit.slidingWindow(5, '15m') })
```

Upstash free tier: 10,000 requests/day — covers Banello's early volume entirely.

---

## Pages

| URL | Access | Description |
|-----|--------|-------------|
| `/` | Public | Customer storefront — order, subscribe, browse |
| `/login` | Public | Auth page — rate limited, lockout UI |
| `/{ADMIN_SLUG}` | Admin only | Full operations dashboard |
| `/api/auth/login` | Public | POST — rate limited login |
| `/api/auth/logout` | Auth | POST — clear session |
| `/api/auth/refresh` | Auth | POST — refresh access token |
| `/api/auth/session` | Auth | GET — current user |
| `/api/orders` | Auth | GET/POST — order management |
| `/api/payments/pesapal-webhook` | Pesapal server | POST — payment confirmation |

---

## Security checklist before going live

- [ ] Generate unique JWT_SECRET and JWT_REFRESH_SECRET (64+ chars each)
- [ ] Set ADMIN_PATH_SLUG to something non-obvious
- [ ] Replace DEMO_USERS with real database query
- [ ] Set PESAPAL_WEBHOOK_SECRET and test webhook signature verification
- [ ] Add your IP(s) to ADMIN_ALLOWED_IPS in Vercel env vars
- [ ] Install Upstash Redis and upgrade rate limiter
- [ ] Connect PostgreSQL database and migrate all static data
- [ ] Verify HTTPS is enforced (Vercel handles this automatically)
- [ ] Test login lockout: try 6 wrong passwords in a row
- [ ] Test admin path: confirm it returns 404 for unauthenticated requests
- [ ] Test Pesapal webhook with sandbox credentials before live payments

---

*Banello Fresh Produce Ltd · From the slopes of Elgon. To your table.*
