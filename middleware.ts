// ============================================================
// BANELLO — Edge Middleware
// Runs on Vercel Edge BEFORE any page or API route renders.
// Protects /ops-centre-bg2026/* and applies rate limiting.
// ============================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// Must match src/lib/auth.ts values exactly
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'banello-dev-secret-change-in-production-minimum-32-chars'
)
const ADMIN_SLUG = process.env.ADMIN_PATH_SLUG || 'ops-centre-bg2026'

// ─── RATE LIMIT STATE (Edge-compatible memory store) ──────────
// Edge middleware has no persistent memory between requests on Vercel
// For production: replace with @upstash/ratelimit + @upstash/redis
// This implementation uses a request-scoped check via KV headers

// Simple sliding window using request metadata
// On Vercel Edge, each invocation is isolated — use Upstash Redis for persistence
// Included here as the correct structure; wire to Upstash when ready

const RATE_CONFIGS = {
  login:    { limit: 5,   windowMs: 15 * 60 * 1000 },  // 5/15min
  api:      { limit: 100, windowMs: 60 * 1000 },        // 100/min
  orders:   { limit: 10,  windowMs: 60 * 1000 },        // 10/min
  register: { limit: 5,   windowMs: 60 * 60 * 1000 },   // 5/hr
  otp:      { limit: 3,   windowMs: 10 * 60 * 1000 },   // 3/10min
}

function getClientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  )
}

function getAdminAllowedIps(): string[] {
  const raw = process.env.ADMIN_ALLOWED_IPS || ''
  if (!raw) return [] // Empty = no IP restriction (dev mode)
  return raw.split(',').map(ip => ip.trim()).filter(Boolean)
}

async function verifyAccessToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, {
      issuer:   'banello.ug',
      audience: 'banello-platform',
    })
    return payload
  } catch {
    return null
  }
}

function getTokenFromCookies(req: NextRequest): string | null {
  return req.cookies.get('banello_access')?.value || null
}

function rateLimitResponse(retryAfter: number, limit: number, endpoint: string): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please wait ${retryAfter} seconds before trying again.`,
      endpoint,
      retryAfter,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': String(retryAfter),
        'X-RateLimit-Limit': String(limit),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const ip = getClientIp(req)
  const method = req.method

  // ─── 1. SECURITY HEADERS (applied to all responses) ────────
  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    ...(process.env.NODE_ENV === 'production' ? {
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    } : {}),
  }

  // ─── 2. ADMIN ROUTE PROTECTION ─────────────────────────────
  if (pathname.startsWith(`/${ADMIN_SLUG}`)) {
    // 2a. IP allowlist check (runs before token check — fails fast)
    const allowedIps = getAdminAllowedIps()
    if (allowedIps.length > 0 && !allowedIps.includes(ip)) {
      // Return 404 — never reveal admin path exists to unknown IPs
      return new NextResponse(null, { status: 404 })
    }

    // 2b. JWT verification
    const token = getTokenFromCookies(req)
    if (!token) {
      // Redirect to login, preserving the intended destination
      const loginUrl = new URL('/login', req.url)
      loginUrl.searchParams.set('from', pathname)
      const res = NextResponse.redirect(loginUrl)
      Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
      return res
    }

    const payload = await verifyAccessToken(token)
    if (!payload || !payload.isAdmin) {
      // Valid token but not admin — return 403 Forbidden
      return new NextResponse(
        JSON.stringify({ error: 'Access denied', message: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json', ...securityHeaders } }
      )
    }

    // Token valid and user is admin — pass through
    const res = NextResponse.next()
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    // Attach user info for downstream route handlers
    res.headers.set('x-user-id', String(payload.userId || ''))
    res.headers.set('x-user-role', String(payload.role || ''))
    return res
  }

  // ─── 3. API ROUTE RATE LIMITING ────────────────────────────

  // Login endpoint — most critical to rate limit
  if (pathname === '/api/auth/login' && method === 'POST') {
    // Pass rate limit info via header — actual enforcement in the route handler
    // This middleware sets a flag; the handler reads it
    // (Edge middleware cannot share memory with serverless functions)
    const res = NextResponse.next()
    res.headers.set('x-rate-limit-key', `login:${ip}`)
    res.headers.set('x-rate-limit-config', JSON.stringify(RATE_CONFIGS.login))
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // Order placement
  if (pathname === '/api/orders' && method === 'POST') {
    const res = NextResponse.next()
    res.headers.set('x-rate-limit-key', `orders:${ip}`)
    res.headers.set('x-rate-limit-config', JSON.stringify(RATE_CONFIGS.orders))
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // Registration
  if (pathname === '/api/auth/register' && method === 'POST') {
    const res = NextResponse.next()
    res.headers.set('x-rate-limit-key', `register:${ip}`)
    res.headers.set('x-rate-limit-config', JSON.stringify(RATE_CONFIGS.register))
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // General API rate limiting
  if (pathname.startsWith('/api/')) {
    const res = NextResponse.next()
    res.headers.set('x-rate-limit-key', `api:${ip}`)
    res.headers.set('x-rate-limit-config', JSON.stringify(RATE_CONFIGS.api))
    Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
    return res
  }

  // ─── 4. PUBLIC ROUTES — add security headers only ──────────
  const res = NextResponse.next()
  Object.entries(securityHeaders).forEach(([k, v]) => res.headers.set(k, v))
  return res
}

export const config = {
  matcher: [
    // Admin routes
    '/ops-centre-bg2026/:path*',
    // All API routes
    '/api/:path*',
    // Exclude Next.js internals and static files
    '/((?!_next/static|_next/image|favicon|public).*)',
  ],
}
