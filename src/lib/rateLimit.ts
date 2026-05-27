// ============================================================
// BANELLO — Rate Limiter
// In-memory implementation compatible with Vercel Edge + Serverless
// For production with Redis: swap to @upstash/ratelimit
// ============================================================

// In-memory store (works without Redis for initial deployment)
// Each key maps to { count, resetAt }
const store = new Map<string, { count: number; resetAt: number }>()

// Clean up expired entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    Array.from(store.entries()).forEach(([key, val]) => {
      if (now > val.resetAt) store.delete(key)
    })
  }, 5 * 60 * 1000)
}

export interface RateLimitConfig {
  limit: number        // Max requests allowed
  windowMs: number     // Time window in milliseconds
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetAt: number      // Unix timestamp (ms) when window resets
  retryAfter: number   // Seconds until retry is allowed
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    // New window
    const resetAt = now + config.windowMs
    store.set(key, { count: 1, resetAt })
    return { allowed: true, remaining: config.limit - 1, resetAt, retryAfter: 0 }
  }

  if (entry.count >= config.limit) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000)
    return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfter }
  }

  entry.count += 1
  store.set(key, entry)
  return { allowed: true, remaining: config.limit - entry.count, resetAt: entry.resetAt, retryAfter: 0 }
}

// Pre-configured limiters for different routes
export const limiters = {
  // Login: 5 attempts per 15 minutes per IP
  login: (ip: string) => rateLimit(`login:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 }),

  // API: 100 requests per minute per IP (general)
  api: (ip: string) => rateLimit(`api:${ip}`, { limit: 100, windowMs: 60 * 1000 }),

  // Orders: 10 orders per minute per IP (prevents order spam)
  orders: (ip: string) => rateLimit(`orders:${ip}`, { limit: 10, windowMs: 60 * 1000 }),

  // Password reset: 3 requests per hour per IP
  passwordReset: (ip: string) => rateLimit(`reset:${ip}`, { limit: 3, windowMs: 60 * 60 * 1000 }),

  // OTP: 3 OTP sends per 10 minutes per phone number
  otp: (phone: string) => rateLimit(`otp:${phone}`, { limit: 3, windowMs: 10 * 60 * 1000 }),

  // Registration: 5 new accounts per hour per IP
  register: (ip: string) => rateLimit(`register:${ip}`, { limit: 5, windowMs: 60 * 60 * 1000 }),
}

// Helper: extract real IP from request headers (Vercel forwards via x-forwarded-for)
export function getClientIp(headers: Headers | Record<string, string | string[] | undefined>): string {
  const forwarded = headers instanceof Headers
    ? headers.get('x-forwarded-for')
    : Array.isArray(headers['x-forwarded-for'])
      ? headers['x-forwarded-for'][0]
      : headers['x-forwarded-for']

  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  return 'unknown'
}

// Helper: set rate limit response headers (standard Retry-After headers)
export function setRateLimitHeaders(
  headers: Record<string, string>,
  result: RateLimitResult,
  limit: number
) {
  headers['X-RateLimit-Limit'] = String(limit)
  headers['X-RateLimit-Remaining'] = String(result.remaining)
  headers['X-RateLimit-Reset'] = String(Math.ceil(result.resetAt / 1000))
  if (!result.allowed) {
    headers['Retry-After'] = String(result.retryAfter)
  }
}
