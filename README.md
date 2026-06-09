# 🍌 Banello Platform — Deployment Guide

## Routes
| URL | Access | Description |
|-----|--------|-------------|
| `/` | Public | Customer storefront — shop, cart, checkout, confirmation |
| `/login` | Public | Staff login with rate limiting (5/15min, progressive lockout) |
| `/admin` | Admin only | Full operations dashboard — protected by JWT middleware |
| `/api/auth/login` | Public | Rate-limited login API |
| `/api/auth/logout` | Auth | Clear session cookies |
| `/api/auth/refresh` | Auth | Refresh access token |
| `/api/auth/session` | Auth | Check current auth state |

## Deploy to Vercel (5 minutes)
```bash
cd banello
npm install
npm run dev          # Test locally at http://localhost:3000
npx vercel --prod    # Deploy live
```

## Demo credentials
- **Admin:** admin@banello.ug / Banello@2026!
- **Rider:** rider@banello.ug / Banello@2026!  
- **Manager:** manager@banello.ug / Banello@2026!

## Customer flow
1. Browse products on homepage or `/shop`
2. Add to cart (quantity controls inline)
3. Cart page → checkout
4. Checkout: contact details → choose office (14 Kampala offices + custom) → assign rider or auto → delivery details + payment method
5. Confirm order → confirmation page with tracking timeline

## Admin access
The admin dashboard at `/admin` requires login. The middleware verifies the JWT token before rendering. Unauthenticated requests are redirected to `/login?from=/admin`. After login, admins are redirected back.

## Security notes
- JWT access tokens expire in 15 minutes (auto-refreshed)
- Login is rate limited: 5 attempts per 15 minutes per IP
- Failed logins apply progressive delay: 1s, 2s, 4s, 8s
- All auth cookies are HttpOnly + SameSite=Strict
- Change ADMIN_PATH_SLUG in production to something non-obvious

## Go-live checklist
- [ ] Generate real JWT_SECRET (64-char hex)
- [ ] Generate real JWT_REFRESH_SECRET (64-char hex)
- [ ] Replace DEMO_USERS in login.ts with database query
- [ ] Set PESAPAL_WEBHOOK_SECRET
- [ ] Connect PostgreSQL database
- [ ] Change ADMIN_PATH_SLUG to non-obvious value
- [ ] Add ADMIN_ALLOWED_IPS for extra protection

*From the slopes of Elgon. To your table.*
